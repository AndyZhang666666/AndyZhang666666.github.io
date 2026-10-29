import {retrieveRun, validateInput, SNAPSHOTS} from './engine.mjs';

const $ = id => document.getElementById(id);
const labels = {answered: '找到适用依据', insufficient: '资料不足', conflict: '依据冲突', clarify: '需要澄清', failed: '运行失败'};
const modeNames = {'original-example': '原创示例 · 无模型调用', 'local-extractive': '本地真实检索 · 规则摘录', 'local-model': '本地真实模型调用', 'local-model-failed': '本地模型阶段失败', 'local-evidence-gate': '本地证据检查 · 未调用模型'};
const roleName = role => role === 'admin' ? '设备管理员' : '普通员工';
const node = (tag, text, className) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (className) el.className = className; return el; };
let documents = [];
let currentRun = null;
let history = [];
let employeeToken = null;
let apiAvailable = false;
let busy = false;
matchMedia('(max-width: 650px)').addEventListener('change', event => {
  if (!event.matches) $('conditionSettings').open = true;
});

function getInput() {
  return {question: $('question').value.trim(), date: $('date').value, snapshot: $('snapshot').value,
    generation: $('runtime').value === 'model' ? 'model' : 'extractive'};
}

function hidePrivateHistory() {
  if ($('role').value === 'employee' || $('runtime').value === 'example') {
    history = history.filter(run => run.role !== 'admin' || run.mode === 'original-example');
    if (currentRun?.role === 'admin' && currentRun.mode !== 'original-example') {
      currentRun = null;
      $('sources').replaceChildren(node('p', '身份范围已改变，请重新查找。', 'empty-evidence'));
      $('citationLinks').replaceChildren(); $('retrieval').replaceChildren(); $('runDetails').replaceChildren(); $('process').replaceChildren();
      $('answerHeadline').textContent = '请重新查找'; $('answerText').textContent = '当前界面已清除管理会话的结果。';
      $('runScope').textContent = ''; $('answerNote').textContent = ''; $('exportButton').disabled = true;
      $('answerStatus').textContent = '等待查找';
    }
    renderHistory();
  }
}

function syncSettings() {
  const runtime = $('runtime').value;
  const local = runtime !== 'example';
  $('modeLabel').textContent = !local ? '原创示例模式' : runtime === 'model' ? '本地模型模式' : '本地 API 模式';
  $('modeDescription').textContent = !local ? '浏览器文本检索 · 规则摘录 · 无模型调用' : runtime === 'model' ? '服务端检索与范围检查 · 真实模型需本项目配置' : '服务端范围检查 · 真实 BM25 检索 · 无模型调用';
  const admin = $('role').value === 'admin';
  $('adminSettings').hidden = !local || !admin;
  if (!admin) $('adminCredential').value = '';
  $('scopeHint').textContent = !local && admin ? '公开示例可切换角色，但不含管理原文。请本地启动 API 并使用独立管理凭据验证该范围。' :
    '日期固定，不随电脑时钟变化。快照是两份独立的虚构资料版本。';
  if (local && admin) $('runtimeSettings').open = true;
  hidePrivateHistory();
}

function markStale() {
  if (busy) return;
  $('stale').hidden = !currentRun;
  $('error').hidden = true;
  syncSettings();
  const question = $('question').value.trim();
  document.querySelectorAll('[data-question]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.question === question)));
}

function setBusy(value) {
  busy = value;
  $('runButton').disabled = value;
  $('runButton').firstChild.textContent = value ? ($('runtime').value === 'model' ? '检索与生成…' : '正在查找…') : '查找依据';
  $('result').setAttribute('aria-busy', String(value));
  // Keep the run's conditions fixed while a response is in flight.
  for (const id of ['question', 'role', 'date', 'snapshot', 'runtime', 'adminCredential', 'historical']) $(id).disabled = value;
  document.querySelectorAll('[data-question]').forEach(b => b.disabled = value);
  $('liveStatus').textContent = value ? '正在按当前条件查找依据。' : '';
}

async function api(path, options = {}, token) {
  const response = await fetch(path, {...options, signal: AbortSignal.timeout(16000), headers: {
    ...(options.body ? {'Content-Type': 'application/json'} : {}), ...(token ? {Authorization: `Bearer ${token}`} : {}), ...options.headers,
  }});
  const data = await response.json();
  return {response, data};
}

async function sessionToken() {
  if ($('role').value === 'admin') {
    const token = $('adminCredential').value;
    if (!token) throw new Error('管理范围需要本地独立凭据。请在「运行方式与演示边界」输入本项目管理凭据。');
    const {response, data} = await api('/api/whoami', {}, token);
    if (!response.ok || data.role !== 'admin') throw new Error('管理会话验证失败，请检查本项目管理凭据。');
    return token;
  }
  if (!employeeToken) {
    const {response, data} = await api('/api/session', {method: 'POST', body: '{}'});
    if (!response.ok) throw new Error(data.error?.message || '员工会话创建失败，可重试。');
    employeeToken = data.token;
  }
  return employeeToken;
}

async function run({focus = true} = {}) {
  if (busy) return;
  $('error').hidden = true;
  let input;
  try { input = validateInput(getInput()); }
  catch (error) { showError(error.message); return; }
  setBusy(true);
  try {
    let result;
    if ($('runtime').value === 'example') {
      result = retrieveRun(documents, input, $('role').value, 'original-example');
    } else {
      if (!apiAvailable) throw new Error('本地 API 未连接。请按 README 启动服务后，从本机地址打开页面。');
      const token = await sessionToken();
      const {response, data} = await api('/api/run', {method: 'POST', body: JSON.stringify(input)}, token);
      if (data.run) result = data.run;
      if (response.status === 401) employeeToken = null;
      if (!response.ok && !result) throw new Error(data.error?.message || '接口失败，请重试。');
      if (data.error) showError(data.error.message);
    }
    currentRun = result;
    history = [structuredClone(result), ...history.filter(r => r.id !== result.id)].slice(0, 5);
    render(result);
    $('stale').hidden = true;
    if (focus) $('answerHeadline').focus({preventScroll: true});
    $('liveStatus').textContent = `${labels[result.status]}。${result.facts?.[0]?.value ?? ''}`;
  } catch (error) {
    showError(['AbortError', 'TimeoutError'].includes(error.name) ? '本次请求超时，输入和条件已保留。请重试。' : error instanceof TypeError ? '本地接口连接失败，输入和条件已保留。请确认服务仍在运行后重试。' : error.message || '读取失败，输入和条件已保留。请重试。');
    $('stale').hidden = !currentRun;
  } finally { setBusy(false); }
}

function showError(message) { $('error').textContent = message; $('error').hidden = false; }

function headline(run) {
  if (run.status === 'answered') {
    const fact = run.facts[0];
    if (fact?.facet === 'duration') return `单次最长 ${fact.value}`;
    if (fact?.facet === 'renew') return `最多续借 ${fact.value}`;
    if (fact?.facet === 'stock') return `应急预留 ${fact.value}`;
    return '找到了一条适用规则';
  }
  return {insufficient: '这项规则，还缺依据。', conflict: '两份依据，给了不同答案。', clarify: '先把问题说具体一点。', failed: '这次没有完成回答。'}[run.status];
}

function render(run) {
  $('answerStatus').textContent = labels[run.status];
  $('answerStatus').dataset.kind = run.status;
  $('runScope').textContent = `${roleName(run.role)} · ${run.date} · ${SNAPSHOTS[run.snapshot]}`;
  $('answerHeadline').textContent = headline(run);
  $('answerText').textContent = run.answer || run.error?.message || '本次未生成回答。';
  $('runMode').textContent = modeNames[run.mode] ?? run.mode;
  $('exportButton').disabled = false;
  $('answerNote').textContent = run.mode === 'original-example' && run.role === 'admin' ?
    '公开示例不含管理原文。验证管理员与员工的真实差异，请启动本地 API 并使用独立管理凭据。' :
    run.status === 'answered' ? run.mode === 'local-model' ? '引用与固定关键事实已检查；其他语义仍需复核。这不是模型准确率结论。' :
      '这是从原文生成的规则摘录。点击引用核对段落；没有调用模型，也不计入模型评测。' :
    run.status === 'conflict' ? '两份通知同日生效，未记录替代关系。允许查看冲突，不代表系统能消解冲突。' :
    run.status === 'failed' ? '检索已完成，生成阶段未完成。右侧保留的是找到的依据，不是已通过检查的模型答案。' :
    '只说明本次范围下缺少依据，不断言其他范围一定存在规则，也不泄露不可访问资料的标题或内容。';

  $('citationLinks').replaceChildren(); $('sources').replaceChildren();
  $('evidenceTitle').textContent = run.status === 'failed' ? '本次找到的依据' : '这次使用的依据';
  $('evidenceCount').textContent = run.citations.length ? `${run.citations.length} 个段落` : '无支持段落';
  if (!run.citations.length) $('sources').append(node('p', '没有找到足以支持结论的段落。相似的资料仍可在下方技术详情中检查。', 'empty-evidence'));
  run.citations.forEach((source, index) => {
    const button = node('button', `[${index + 1}] ${source.title} · v${source.version}`);
    button.type = 'button'; button.dataset.citation = source.id; button.setAttribute('aria-controls', `source-${index}`);
    button.addEventListener('click', () => locateSource(index)); $('citationLinks').append(button);
    const article = node('article', undefined, 'source'); article.id = `source-${index}`; article.tabIndex = -1;
    article.append(node('h3', `[${index + 1}] ${source.title}`));
    article.append(node('p', `v${source.version} · 自 ${source.effectiveFrom} 生效${source.effectiveTo ? `，至 ${source.effectiveTo} 前有效` : ''} · ${source.id}`, 'source-meta'));
    const quote = node('blockquote');
    const position = source.text.indexOf(source.quote);
    if (position >= 0) {
      quote.append(document.createTextNode(source.text.slice(0, position)), node('mark', source.quote), document.createTextNode(source.text.slice(position + source.quote.length)));
    } else quote.textContent = source.text;
    article.append(quote);
    article.append(node('p', `为什么可用：${roleName(run.role)}可访问；截至 ${run.date} 适用；属于「${SNAPSHOTS[run.snapshot]}」的本次检索。`, 'source-reason'));
    $('sources').append(article);
  });
  const process = node('ol', undefined, 'process'); run.stages.forEach(s => process.append(node('li', s))); $('process').replaceChildren(process);
  const detail = $('runDetails'); detail.replaceChildren();
  const rows = [
    ['运行模式', modeNames[run.mode]], ['可用资料', `${run.eligibleDocuments} 份（先限制范围，再建立本次索引）`],
    ['检索片段', `${run.retrieved.length} 个 · BM25 / 中文二元词`], ['数据 / 索引', `${run.versions.corpus} / ${run.versions.index}`],
    ['Prompt / 检查', `${run.versions.prompt} / ${run.versions.judge}`], ['引用检查', run.status === 'failed' ? '找到的依据可定位；模型引用未通过 / 未完成验证' : run.checks.citation === 'matched' ? '引用存在，引文与原文匹配' : '不适用'],
    ['关键事实', run.checks.keyFacts === 'matched' ? '已按固定业务事实检查；其他语义待复核' : run.checks.keyFacts === 'extractive' ? '按适用原文摘录；没有生成质量分数' : run.checks.keyFacts === 'not-passed' ? '模型检查未通过 / 未运行' : '不适用'],
    ['模型 / 用量', run.model ? `${run.model} / ${run.usage ? JSON.stringify(run.usage) : '未取得用量'}` : '未调用 · 用量不适用'],
    ['本次耗时', `${run.elapsedMs} ms（当前设备，不代表在线模型延迟）`], ['记录编号', run.id],
  ];
  for (const [label, value] of rows) detail.append(node('dt', label), node('dd', value ?? '不适用'));
  $('retrieval').replaceChildren();
  for (const item of run.retrieved) {
    const details = node('details', undefined, 'retrieved');
    details.append(node('summary', `${item.title} · ${item.id} · BM25 ${item.score}`));
    details.append(node('p', item.text));
    details.append(node('p', `v${item.version} · ${item.effectiveFrom} 生效`, 'score'));
    $('retrieval').append(details);
  }
  renderHistory();
}

function locateSource(index) {
  const el = $(`source-${index}`);
  if (!el) return;
  el.classList.remove('focused'); void el.offsetWidth; el.classList.add('focused');
  el.focus({preventScroll: true});
  el.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest'});
}

function renderHistory() {
  const holder = $('historyList'); holder.className = 'history-list'; holder.replaceChildren();
  for (const item of history) {
    const button = node('button'); button.type = 'button'; button.setAttribute('aria-pressed', String(item.id === currentRun?.id));
    button.append(node('span', item.facts[0]?.value && item.status === 'answered' ? item.facts[0].value : labels[item.status]), node('small', `${item.date} · ${item.snapshot === 'baseline' ? '原始' : '修订'} · ${roleName(item.role)}`));
    button.addEventListener('click', () => {
      if (busy) return;
      // Never re-expose a privileged run after the viewer leaves that session.
      if (item.role === 'admin' && item.mode !== 'original-example' && ($('role').value !== 'admin' || $('runtime').value === 'example')) return;
      currentRun = structuredClone(item);
      $('question').value = item.question; $('date').value = item.date; $('snapshot').value = item.snapshot; $('role').value = item.role;
      $('runtime').value = item.mode === 'original-example' ? 'example' : item.generation === 'model' ? 'model' : 'api';
      syncSettings(); $('stale').hidden = true; $('error').hidden = true;
      render(currentRun); $('answerHeadline').focus({preventScroll: true});
    }); holder.append(button);
  }
}

function publicRedact(run) {
  // Public examples contain no private documents. Redact common strings in typed input anyway.
  return JSON.parse(JSON.stringify(run).replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '[REDACTED_EMAIL]')
    .replace(/Bearer\s+[\w.-]+/gi, 'Bearer [REDACTED]').replace(/\bsk-[\w-]+/g, '[REDACTED_KEY]')
    .replace(/(?<!\d)1[3-9]\d{9}(?!\d)/g, '[REDACTED_PHONE]'));
}

$('queryForm').addEventListener('submit', event => { event.preventDefault(); run(); });
document.querySelectorAll('[data-question]').forEach(button => button.addEventListener('click', () => {
  $('question').value = button.dataset.question; markStale(); run();
}));
for (const id of ['role', 'date', 'snapshot', 'runtime']) $(id).addEventListener('change', markStale);
$('question').addEventListener('input', markStale);
$('historical').addEventListener('click', () => { $('date').value = '2026-06-30'; markStale(); run(); });
$('exportButton').addEventListener('click', async () => {
  if (!currentRun) return;
  try {
    let record = publicRedact(currentRun);
    if (currentRun.mode !== 'original-example') {
      const token = await sessionToken();
      const {response, data} = await api(`/api/runs/${currentRun.id}/export`, {}, token);
      if (!response.ok) throw new Error(data.error?.message || '导出失败');
      record = data;
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(record, null, 2)], {type: 'application/json'}));
    const a = node('a'); a.href = url; a.download = `rag-run-${currentRun.id}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('liveStatus').textContent = '已导出脱敏记录。';
  } catch (error) { showError(error.message); }
});

async function initialize() {
  try {
    if (matchMedia('(max-width: 650px)').matches) $('conditionSettings').open = false;
    const response = await fetch('./public-corpus.json');
    if (!response.ok) throw new Error('示例资料读取失败，请刷新重试。');
    const data = await response.json(); documents = data.documents;
    // Probe only a local origin, never contact an unconfigured hosted backend.
    if (['127.0.0.1', 'localhost', '[::1]'].includes(location.hostname)) {
      try {
        const {response, data} = await api('/api/health');
        apiAvailable = response.ok && data.service === 'rag-lab-local';
        if (apiAvailable) {
          $('runtime').options[1].disabled = false; $('runtime').options[2].disabled = false;
          $('apiHint').textContent = `已连接当前本机 API。${data.modelConfigured ? '模型已配置，实际生成仍需本次运行验证。' : '本项目未配置模型；可先使用真实检索与规则摘录，模型联调待验证。'}`;
        }
      } catch { /* static preview: remain in explicitly labelled example mode */ }
    }
    syncSettings(); await run({focus: false});
  } catch (error) { setBusy(false); showError(error.message); $('answerHeadline').textContent = '资料暂时无法读取'; }
}
initialize();
