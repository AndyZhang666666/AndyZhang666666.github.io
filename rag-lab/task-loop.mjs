// Advisory checks only. These never authorize a source or validate answer semantics.
import {factsIn} from './engine.mjs';

const textOf = citation => typeof citation.quote === 'string' ? citation.quote : citation.text || '';
const normalize = text => String(text ?? '').normalize('NFKC');
const decimal = value => {
  const [whole, fraction = ''] = value.split('.');
  const integer = whole.replace(/^0+(?=\d)/, '');
  const tail = fraction.replace(/0+$/, '');
  return integer + (tail ? `.${tail}` : '');
};

export function numberUnits(text) {
  // Whitespace is allowed between number and unit, never inside a number.
  return [...normalize(text).matchAll(/(?<![\d.])\d+(?:\.\d+)?\s*(?:小时|天|元|次|台)(?![\d])/gu)]
    .map(match => ({token: match[0].replace(/^(\d+(?:\.\d+)?)/, decimal).replace(/\s/g, ''), raw: match[0], index: match.index}));
}

export function checkDraftGrounding(draft, citations = [], {stale = false} = {}) {
  const supported = new Set(citations.flatMap(c => numberUnits(textOf(c)).map(n => n.token)));
  const unsupported = numberUnits(draft).filter(n => !supported.has(n.token));
  const boundary = '只核对数字与单位是否出现在所选引文中；文字匹配不代表语义正确。';
  const status = !String(draft ?? '').trim() ? 'empty-draft' : stale ? 'stale' : !citations.length ? 'no-citations' : unsupported.length ? 'unsupported' : 'lexical-match';
  const notes = {
    'empty-draft': '草稿为空，尚无可检查内容。',
    'no-citations': '尚未选择依据；请先勾选本次引用。',
    stale: '资料或条件已更改，所选旧引文不能代表当前依据；请重新查找。',
    unsupported: '以下数字未在当前所选引文中找到，请核对或补充依据。',
    'lexical-match': numberUnits(draft).length ? '草稿中的数字与单位均能在所选引文找到。' : '草稿中没有可检查的阿拉伯数字与支持单位。',
  };
  return {status, unsupported, note: `${notes[status]}${boundary}`};
}

const topicNames = {monitor:'显示器',laptop:'笔记本电脑',drone:'无人机',reserve:'应急备用机',purchase:'设备采购',equipment:'设备',headphone:'耳机'};
const facetNames = {duration:'借期',renew:'续借次数',stock:'备用数量',budget:'采购额度',loss:'遗失报告时限',return:'归还地点',calendar:'计日方式',clean:'清洁要求'};
function advisoryFacts(id,text) {
  // Reuse the frozen engine's supported topic/rule grammar. Temporary integer
  // placeholders let that same grammar recognize normalized decimal values here,
  // without changing retrieval, engine facts or any rule calculation.
  const numbers = new Map();
  const masked = text.replace(/\d+(?:\.\d+)?(?=\s*(?:小时|天|元|次|台))/gu, value => {
    const key = String(9000000000000 + numbers.size);numbers.set(key,value);return key;
  });
  const restore = value => value.replace(/\d+/g, n => numbers.get(n) ?? n);
  return factsIn({id,text:masked}).map(f => {
    const value = restore(f.value);
    return {...f,quote:restore(f.quote),value:numberUnits(value)[0]?.token || value};
  });
}
function entities(citation, text, fact) {
  const at = text.indexOf(fact.quote);
  const prefix = text.slice(0, at).split(/[。；;\n]/).at(-1).trim();
  // A named place/company/model in a title, or a qualified subject in the sentence,
  // narrows the rule. Do not equate it to a different entity's numeric assertion.
  const names = (citation.title || '').match(/(?:[A-Za-z0-9]+(?:区|公司|部门|项目)|[\p{Script=Han}]{2,8}(?:公司|部门|项目)|(?:型号|机型)\s*[A-Za-z0-9-]+)/gu) || [];
  return JSON.stringify([prefix, ...names]);
}

export function citationCautions(citations = []) {
  const groups = new Map();
  for (const c of citations) {
    const text = normalize(textOf(c));
    for (const fact of advisoryFacts(c.id,text)) {
      const key = `${fact.topic}:${fact.facet}:${entities(c,text,fact)}`;
      const rows = groups.get(key) || [];
      rows.push({c, fact}); groups.set(key, rows);
    }
  }
  const cautions = [];
  for (const rows of groups.values()) {
    const values = new Set(rows.map(({fact}) => normalize(fact.value).replace(/\s/g, '')));
    const intervals = new Set(rows.map(({c}) => JSON.stringify([c.effectiveFrom || null,c.effectiveTo || null])));
    if (values.size < 2 && intervals.size < 2) continue;
    const {topic,facet} = rows[0].fact;
    cautions.push({topic:`${topicNames[topic] || topic} · ${facetNames[facet] || facet}`,
      citationIds:[...new Set(rows.map(({c}) => c.id))],
      message:`${topicNames[topic] || topic}的${facetNames[facet] || facet}${values.size > 1 ? '数值或规定不同' : ''}${values.size > 1 && intervals.size > 1 ? '，且' : ''}${intervals.size > 1 ? '生效期间不同或未完整声明' : ''}。可能涉及不同适用范围；请在答复中写明适用对象与期间，并核对原文，本页不判定哪条优先。`});
  }
  return cautions;
}

const stable = value => JSON.stringify(value && typeof value === 'object' && !Array.isArray(value)
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, value[key]])) : value ?? null);
const scope = run => ({date:run.date,snapshot:run.snapshot,role:run.role});
const roleName = role => role === 'admin' ? '设备管理员' : '普通员工';
const scopeName = run => `${run.date} / ${run.snapshot === 'baseline' ? '原始快照' : '修订快照'} / ${roleName(run.role)}`;
const evidence = run => (run.citations || []).map(c => `${c.id} / v${c.version}`).join('；') || '无支持引文';
const evidenceKey = run => stable((run.citations || []).map(c => [c.id,c.version,c.quote]));
const resultName = run => {
  const status = {answered:'找到适用依据',insufficient:'资料不足',conflict:'依据冲突',clarify:'需要澄清'}[run.status] || run.status;
  const values = run.status === 'answered' ? [...new Set((run.facts || []).map(f => f.value))].join('、') : '';
  return `${status}${values ? `（${values}）` : ''}`;
};

export function scopeBaseline(run) {
  if (!run) return null;
  // No previous answer, title, ID, quote, version, fact, or edited draft survives
  // an identity transition. Only comparison eligibility and public conditions remain.
  return {question:run.question,taskId:run.taskId,taskFacts:structuredClone(run.taskFacts),generation:run.generation,mode:run.mode,
    ...scope(run),status:run.status,scopeOnly:true};
}

export function scopeDiff(previous, current) {
  if (!previous || !current || previous.status === 'failed' || current.status === 'failed' ||
      previous.question !== current.question || previous.taskId !== current.taskId ||
      stable(previous.taskFacts) !== stable(current.taskFacts) || previous.mode !== current.mode || previous.generation !== current.generation) return null;
  const changes = ['date','snapshot','role'].filter(key => previous[key] !== current[key]);
  if (!changes.length) return null;
  const identityChanged = previous.role !== current.role || previous.scopeOnly;
  const evidenceChanged = identityChanged ? null : evidenceKey(previous) !== evidenceKey(current);
  const resultChanged = identityChanged ? null : previous.answer !== current.answer || previous.status !== current.status;
  return {previous:scope(previous),current:scope(current),changes,evidenceChanged,resultChanged,previousRedacted:Boolean(identityChanged),
    message:`同一问题的条件变化：${scopeName(previous)} → ${scopeName(current)}。${identityChanged
      ? '身份或权限范围已变，旧答复及旧引文已清除，不比较或导出旧内容。'
      : `适用引文/版本${evidenceChanged ? '已变化' : '未变化'}：${evidence(previous)} → ${evidence(current)}；结果${resultChanged ? '已变化' : '未变化'}：${resultName(previous)} → ${resultName(current)}。`}` +
      (identityChanged ? ` 本次可用引文/版本：${evidence(current)}。本次结果：${resultName(current)}。` : '')};
}
