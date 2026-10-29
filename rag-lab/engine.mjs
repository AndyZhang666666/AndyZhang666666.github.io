// Pure retrieval core, shared by the public *example* and the real API.
// Authorization is a server responsibility; a public browser is never a security boundary.
export const VERSIONS = Object.freeze({index: 'zh-bigram-bm25-v1', prompt: 'grounded-json-v1', judge: 'equipment-facts-v1', corpus: 'qingyu-20261028-v1'});
export const SNAPSHOTS = Object.freeze({baseline: '原始资料快照', revised: '演示修订快照'});
export const DEFAULT_DATE = '2026-10-28';

export function validDate(date) {
  return typeof date === 'string' && /^20\d{2}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
}

export function validateInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('参数需为 JSON 对象。');
  if (Object.keys(input).some(k => !['question', 'date', 'snapshot', 'generation'].includes(k))) throw new Error('包含不支持的参数；身份由会话决定。');
  if (typeof input.question !== 'string' || !input.question.trim() || input.question.length > 300) throw new Error('请输入 1–300 字的问题。');
  if (!validDate(input.date)) throw new Error('请使用有效的 YYYY-MM-DD 业务日期。');
  if (!Object.hasOwn(SNAPSHOTS, input.snapshot)) throw new Error('资料快照无效。');
  if (!['extractive', 'model'].includes(input.generation ?? 'extractive')) throw new Error('运行方式无效。');
  return {...input, question: input.question.trim(), generation: input.generation ?? 'extractive'};
}

export function parseDocument(markdown) {
  const match = markdown.match(/^---\n([^]*?)\n---\n([^]*)$/);
  if (!match) throw new Error('Document metadata missing');
  const meta = JSON.parse(match[1]);
  if (!/^[A-Z0-9-]+$/.test(meta.id) || !meta.policy || !meta.title || !meta.version ||
      !validDate(meta.effectiveFrom) || (meta.effectiveTo && !validDate(meta.effectiveTo)) ||
      !Array.isArray(meta.roles) || !meta.roles.every(r => ['employee', 'admin'].includes(r)) ||
      !Array.isArray(meta.snapshots) || !meta.snapshots.every(s => Object.hasOwn(SNAPSHOTS, s))) throw new Error('Invalid document metadata');
  let heading = meta.title;
  const chunks = [];
  for (const block of match[2].trim().split(/\n\s*\n/)) {
    if (/^#+ /.test(block)) { heading = block.replace(/^#+ /, ''); continue; }
    chunks.push({id: `${meta.id}:p${chunks.length + 1}`, heading, text: block.trim()});
  }
  return {...meta, chunks};
}

// Stable IDs come from immutable document revisions and paragraph order.
export function eligibleDocuments(documents, {role, date, snapshot}) {
  if (!['employee', 'admin'].includes(role) || !validDate(date) || !Object.hasOwn(SNAPSHOTS, snapshot)) throw new Error('Invalid retrieval scope');
  const scoped = documents.filter(d => d.roles.includes(role) && d.snapshots.includes(snapshot) &&
    d.effectiveFrom <= date && (!d.effectiveTo || date < d.effectiveTo));
  const newest = new Map();
  for (const d of scoped) newest.set(d.policy, [newest.get(d.policy) ?? '', d.effectiveFrom].sort().at(-1));
  // Equal effective dates have no automatic tie-break: preserve both for conflict checks.
  return scoped.filter(d => d.effectiveFrom === newest.get(d.policy));
}

export function tokenize(text) {
  const tokens = [];
  for (const run of text.toLowerCase().match(/[\p{Script=Han}]+|[a-z0-9]+/gu) ?? []) {
    if (/^[a-z0-9]+$/.test(run)) tokens.push(run);
    else if (run.length === 1) tokens.push(run);
    else for (let i = 0; i < run.length - 1; i++) tokens.push(run.slice(i, i + 2));
  }
  return tokens;
}

export function search(documents, query, scope, limit = 8) {
  // Filter BEFORE building the index: no forbidden title, ID, score or body in recall/context.
  const allowed = eligibleDocuments(documents, scope);
  const rows = allowed.flatMap(d => d.chunks.map(c => ({...c, docId: d.id, title: d.title,
    version: d.version, effectiveFrom: d.effectiveFrom, effectiveTo: d.effectiveTo,
    roles: d.roles, policy: d.policy, tokens: tokenize(`${d.title} ${d.title} ${c.heading} ${c.text}`)})));
  const terms = [...new Set(tokenize(query))];
  const average = rows.reduce((n, r) => n + r.tokens.length, 0) / (rows.length || 1);
  const frequencies = new Map(terms.map(t => [t, rows.filter(r => r.tokens.includes(t)).length]));
  return rows.map(row => {
    let score = 0;
    for (const term of terms) {
      const tf = row.tokens.filter(t => t === term).length;
      if (!tf) continue;
      const df = frequencies.get(term);
      const idf = Math.log(1 + (rows.length - df + 0.5) / (df + 0.5));
      score += idf * tf * 2.2 / (tf + 1.2 * (0.25 + 0.75 * row.tokens.length / average));
    }
    const {tokens, ...publicRow} = row;
    return {...publicRow, score: Math.round(score * 1000) / 1000};
  }).filter(r => r.score > 0).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, limit);
}

const TOPICS = [
  ['monitor', /显示器|外接屏|显示屏/], ['laptop', /笔记本|电脑/], ['drone', /无人机/],
  ['reserve', /备用机|应急.*库存/], ['purchase', /采购|审批额度/], ['headphone', /耳机/],
];
const FACETS = [
  ['deposit', /押金|赔偿|费用|收费/], ['renew', /续借|续期|延期/], ['return', /归还.*(哪里|地点|流程)|哪里.*归还/],
  ['loss', /遗失|丢失/], ['stock', /几台|数量|库存|多少台/], ['budget', /审批|额度|采购/],
  ['duration', /多久|几天|时长|期限|最长|多少天|天数/], ['clean', /清洁|清洗/],
];

// Deliberately small ontology, documented as a first-version scope limit.
// It detects answer coverage, never chooses a canned paragraph or changes search ranking.
export function interpret(question) {
  const topics = TOPICS.filter(([, re]) => re.test(question)).map(([id]) => id);
  const facets = FACETS.filter(([, re]) => re.test(question)).map(([id]) => id);
  return {topics, facets, topic: topics[0], facet: facets[0]};
}

const FACT_PATTERNS = [
  ['monitor', 'duration', /显示器单次最长借用\s*(\d+)\s*天/, '天'],
  ['laptop', 'duration', /笔记本电脑单次最长借用\s*(\d+)\s*天/, '天'],
  ['drone', 'duration', /无人机单次最长借用\s*(\d+)\s*天/, '天'],
  ['monitor', 'renew', /显示器最多续借\s*(\d+)\s*次/, '次'],
  ['reserve', 'stock', /应急备用机数量为\s*(\d+)\s*台/, '台'],
  ['purchase', 'budget', /设备单次采购审批额度为\s*(\d+)\s*元/, '元'],
  ['equipment', 'return', /设备归还地点为([^。]+)\s*/, ''],
  ['equipment', 'loss', /设备遗失应在\s*(\d+)\s*小时内报告设备负责人/, '小时'],
  ['headphone', 'clean', /耳机归还前需(清洁耳罩)/, ''],
];

export function factsIn(chunk) {
  return FACT_PATTERNS.flatMap(([topic, facet, re, unit]) => {
    const m = chunk.text.match(re);
    return m ? [{topic, facet, value: m[1].trim() + unit, quote: m[0].trim(), chunkId: chunk.id}] : [];
  });
}

export function assess(question, retrieved) {
  const intent = interpret(question);
  if (intent.topics.length > 1 || intent.facets.length > 1) return {status: 'clarify', answer: '请一次询问一种设备的一项规则，便于逐条核对依据。', facts: []};
  if (!intent.facet || (!intent.topic && !['return', 'loss'].includes(intent.facet))) return {status: 'clarify', answer: '请说明设备和想了解的规则，例如「显示器最长能借多久」。', facts: []};
  const facts = retrieved.flatMap(factsIn).filter(f => f.facet === intent.facet &&
    (f.topic === intent.topic || f.topic === 'equipment'));
  if (!facts.length) return {status: 'insufficient', answer: '当前可访问且适用的资料没有给出这项规则。请向设备负责人补充确认，不能从相似内容推算答案。', facts: []};
  if (new Set(facts.map(f => f.value)).size > 1) return {status: 'conflict', answer: '找到同等生效、但规定不一致的依据。请设备负责人确认后再使用；本次不替你选一条。', facts};
  const fact = facts[0];
  const chunk = retrieved.find(c => c.id === fact.chunkId);
  // Keep qualifiers in the original paragraph, not just the numeric fact.
  return {status: 'answered', answer: chunk.text, facts: [fact]};
}

export function citationsFor(assessment, retrieved) {
  return [...new Set(assessment.facts.map(f => f.chunkId))].map(id => {
    const chunk = retrieved.find(c => c.id === id);
    return {...chunk, quote: assessment.facts.find(f => f.chunkId === id).quote};
  });
}

export function inspectCitations(citations, retrieved) {
  return citations.length > 0 && citations.every(c => {
    const source = retrieved.find(r => r.id === c.chunkId || r.id === c.id);
    return source && typeof c.quote === 'string' && c.quote.trim().length >= 4 && source.text.includes(c.quote);
  });
}

export function checkModelAnswer(output, assessment, retrieved) {
  if (!output || output.status !== 'answered' || typeof output.answer !== 'string' ||
      !output.answer.trim() || output.answer.length > 1200 || !Array.isArray(output.citations) || output.citations.length > 8) return {ok: false, reason: '结构不符合约定'};
  if (!inspectCitations(output.citations, retrieved)) return {ok: false, reason: '引用不存在或引文与来源不符'};
  const normalized = output.answer.replace(/\s/g, '');
  for (const fact of assessment.facts) {
    if (!normalized.includes(fact.value.replace(/\s/g, '')) ||
        !output.citations.some(c => c.chunkId === fact.chunkId && c.quote.includes(fact.quote))) return {ok: false, reason: '关键事实或支持该事实的引用缺失'};
  }
  // Known numeric assertions need both the expected value and the expected unit.
  const allowedNumbers = new Set(assessment.facts.flatMap(f => [...f.value.matchAll(/\d+\s*(?:天|次|台|元|小时)/g)].map(m => m[0].replace(/\s/g, ''))));
  const asserted = [...output.answer.matchAll(/\d+\s*(?:天|次|台|元|小时)/g)].map(m => m[0].replace(/\s/g, ''));
  if (asserted.some(n => !allowedNumbers.has(n))) return {ok: false, reason: '回答包含与本次关键事实不符的数值'};
  if (/不(?:能|可|允许).{0,8}(?:借用|续借)|无限|无需归还/.test(output.answer)) return {ok: false, reason: '回答与允许的业务事实相矛盾'};
  return {ok: true, reason: '固定业务事实与引用检查通过；其余语义仍需复核'};
}

export function retrieveRun(documents, input, role, mode = 'local-extractive') {
  const args = validateInput(input);
  const start = performance.now();
  const scope = {role, date: args.date, snapshot: args.snapshot};
  const eligible = eligibleDocuments(documents, scope);
  const retrieved = search(documents, args.question, scope);
  const assessment = assess(args.question, retrieved);
  return {id: globalThis.crypto.randomUUID(), createdAt: new Date().toISOString(), ...args, role, mode,
    versions: VERSIONS, status: assessment.status, answer: assessment.answer,
    citations: citationsFor(assessment, retrieved), retrieved, facts: assessment.facts,
    eligibleDocuments: eligible.length, stages: ['会话范围限定', '快照 / 生效版本选择', 'BM25 段落检索', '证据覆盖与冲突检查'],
    checks: {citation: assessment.facts.length ? 'matched' : 'not-applicable', keyFacts: assessment.facts.length ? 'extractive' : 'not-applicable', semantic: 'not-model-evaluated'},
    model: null, usage: null, rawAnswer: null, elapsedMs: Math.round((performance.now() - start) * 100) / 100};
}
