'use strict';
const $ = s => document.querySelector(s);
const labels = {running:'执行中', awaiting_confirmation:'待确认', succeeded:'已完成', failed:'运行失败', denied:'已拒绝', needs_input:'待补充', unknown:'结果未知', cancelled:'已取消', conflict:'版本冲突'};
const names = {query_ticket:'查询工单',submit_change:'提交变更',operation_status:'核实原操作',start:'创建独立沙盒',preview:'等待确认',confirm:'批准具体变更',final:'最终回复',concurrent_update:'工单版本发生变化',model_error:'模型请求失败',parse_error:'解析失败',invalid_call:'无效工具参数'};
let catalog, caseId = 'timeout', records = [], rendered = [], source = 'example', localConfig = null, busy = false, playing = false, paused = false, playToken = 0;
const restoreKey = 'agent-bench-runs-v1';
function el(tag, className, text) { const n = document.createElement(tag); if (className) n.className = className; if (text !== undefined) n.textContent = text; return n; }
function fail(message) { $('#error').textContent = message; $('#error').hidden = false; }
function clearError() { $('#error').hidden = true; }
function mode(kind) {
  source = kind;
  const messages = {
    example:['示例演示 · 不调用 AI','原创程序策略记录，只读播放；不计入模型评测。'],
    program:['本地程序测试 · 实际写入 SQLite','确定性程序选择工具，不调用 AI；每版拥有独立工单。'],
    model:['真实模型运行 · 本地工单沙盒','模型选择工具，服务端鉴权；仅写入本次隔离数据库。'],
    'model-replay':['真实记录回放 · 只读','播放导入的模型留档，不代表本次现场生成；来源由文件声明，未作签名认证。'],
    'program-replay':['程序记录回放 · 非 AI','播放导入的程序测试记录，不调用工具，不计入模型评测。']
  };
  const [title, help] = messages[kind] || messages.example;
  $('#source-label').textContent = title; $('#source-help').textContent = help;
}
function currentCase() { return catalog.cases.find(c => c.id === caseId); }
function selectCase() {
  playToken++; playing = false; paused = false; busy = false; $('#pause').hidden = true;
  records = []; rendered = []; mode('example'); clearError();
  const c = currentCase();
  $('#case-title').textContent = c.title; $('#task').textContent = c.task; $('#condition').textContent = c.condition;
  $('#play-status').textContent = '选好案例，点击「观看示例」。'; $('#verdict').hidden = true;
  $('#watch').textContent = '观看示例'; controls(); render();
}
function controls() {
  $('#case-select').disabled = busy || playing;
  $('#watch').disabled = busy || playing;
  $('#run-program').disabled = !localConfig || busy || playing;
  $('#run-model').disabled = !localConfig?.model_configured || busy || playing;
}
function ticketFor(r, count) {
  if (!r) return {group:'客服组', status:'open', notes:[]};
  if (count >= r.events.length) return r.ticket;
  let ticket = r.initial;
  for (const e of r.events.slice(0, count)) if (e.result.operation?.ticket) ticket = e.result.operation.ticket;
  return ticket;
}
function eventText(e) {
  if (e.kind === 'reply') return e.result.summary;
  if (e.result.code === 'TIMEOUT' || e.result.code === 'INTERRUPTED') return '没有收到回执；此时不能断言未写入。';
  if (e.result.deduplicated) return '同一操作已处理，返回原回执；没有新增记录。';
  if (e.name === 'operation_status') return e.result.status === 'committed' ? '查到原操作已提交，不再重复写。' : '原操作尚未提交。';
  if (e.name === 'submit_change' && e.result.ok) return '变更已提交，新增一条跟进记录。';
  if (e.name === 'query_ticket' && e.result.ok) return `工单 v${e.result.ticket.version}；${e.result.can_edit ? '当前身份可修改' : '当前身份只读'}。`;
  return e.result.message || '工具返回完成。';
}
function resultColumn(index, r) {
  const policy = r?.run.policy || (index === 0 ? 'baseline' : 'hardened');
  const column = el('article','result'); column.dataset.policy = policy;
  const count = r ? (rendered[index] ?? r.events.length) : 0;
  const done = r && count >= r.events.length && !playing && !['running','awaiting_confirmation'].includes(r.run.state);
  const live = source === 'program' || source === 'model';
  const top = el('div','result-top'); top.append(el('h3','', policy === 'baseline' ? '基础版' : '加固版'));
  const state = !r ? '等待观看' : (count < r.events.length ? '播放中' : labels[r.run.state] || r.run.state);
  top.append(el('span','state ' + (done && r.evaluation.passed ? 'good' : done && ['failed','unknown','conflict'].includes(r.run.state) ? 'bad' : ''),state));
  column.append(top,el('p','strategy',policy === 'baseline' ? '直接执行；工具出错后停止并报告。' : '核实权限、有限重试、查询原操作后恢复。'));
  const t = ticketFor(r,count), dl = el('dl','ticket-data');
  for (const [label,value,changed] of [['处理组',t.group,t.group !== '客服组'],['工单状态',t.status === 'open' ? '打开' : t.status,false],['新增记录',t.notes.length+' 条',t.notes.length > 0]]) {
    const wrap = el('div'); wrap.append(el('dt','',label),el('dd',changed ? 'changed' : '',value)); dl.append(wrap);
  }
  column.append(dl);
  let summary = '这里会显示最后的工单数据。每版使用独立沙盒。';
  if (r) summary = count < r.events.length ? '正在查看记录；最终判定将在播放结束后显示。' : r.run.state === 'awaiting_confirmation' ? '尚未写入。核对下面的具体变更后，选择确认或取消。' : r.run.state === 'running' ? '正在执行。当前显示已持久化的数据，最终判定将在结束后显示。' : r.run.reply?.summary || '提交回执未知，数据库可能已改变。请核实原操作后再继续。';
  column.append(el('p','result-summary' + (!r ? ' empty' : ''),summary));
  if (r && live && r.run.state === 'awaiting_confirmation') {
    const box = el('div','approval'), a = r.run.pending;
    box.append(el('p','',`请确认：${a.ticket_id} v${a.expected_version} → ${a.group}；添加「${a.note}」；保持工单打开。`));
    const actions = el('div','actions');
    actions.append(actionButton('确认此变更',()=>localAction(index,'confirm',{digest:r.approval_digest}),true),actionButton('取消后续步骤',()=>localAction(index,'cancel',{})));
    box.append(actions); column.append(box);
  }
  if (r && live && r.run.state === 'unknown') {
    const actions = el('div','actions'); actions.append(actionButton('查询原操作并恢复',()=>localAction(index,'recover',{}),true),actionButton('停止后续步骤',()=>localAction(index,'cancel',{}))); column.append(actions);
  }
  if (r && live && r.run.state === 'running') column.append(actionButton('停止后续步骤',()=>localAction(index,'cancel',{})));
  const list = el('ol','timeline');
  const visible = r ? r.events.slice(0,count).filter(e=>e.kind!=='reply') : [];
  for (const e of visible.slice(-3)) {const item=el('li','',names[e.name] || e.name);item.append(el('small','',eventText(e)));list.append(item);}
  if (!visible.length) list.append(el('li','',r ? '准备读取记录' : '执行记录会出现在这里'));
  column.append(list);
  if (r && done) {
    const checks = el('details'); checks.append(el('summary','',`为什么这样判 · ${r.evaluation.passed ? '通过' : '未通过'}`));
    const ul = el('ul','checks');
    for (const c of r.evaluation.checks) {const li=el('li'); li.append(el('strong',c.passed?'pass':'fail',(c.passed?'通过 · ':'未通过 · ')+c.label),el('span','check-detail',c.detail));ul.append(li);}
    checks.append(ul); column.append(checks);
    const raw = el('details'); raw.append(el('summary','','工具轨迹与版本'));
    const m=r.evaluation.metrics;
    raw.append(el('p','meta',`运行 ${r.run.id} · ${r.run.mode==='model'?'模型 '+(r.run.model||'未知'):'程序策略'} · 总经过 ${m.elapsed_ms ?? '未知'} ms · 工具 ${m.tool_calls} 次 · 模型 ${m.model_calls} 次 · Token ${m.usage?.total_tokens ?? '未知'}`));
    raw.append(el('p','meta',`任务 1；实际完成 ${m.successes}；符合案例预期 ${m.case_passes ?? Number(r.evaluation.passed)}；运行失败 ${m.run_failures}；越权尝试 ${m.unauthorized_attempts}；实际越权写入 ${m.unauthorized_writes}；重复写入 ${m.duplicate_writes}；需人工接管 ${m.human_takeovers}。`));
    raw.append(el('pre','raw',JSON.stringify({source:r.source,versions:r.run.versions,events:r.events,operations:r.operations},null,2))); column.append(raw);
    const download=el('button','export','导出这次运行 JSON');download.addEventListener('click',()=>exportRecord(r));column.append(download);
  }
  return column;
}
function actionButton(label,action,primary=false) {const b=el('button',primary?'primary':'',label);b.disabled=busy&&!label.startsWith('停止');b.addEventListener('click',action);return b;}
function render() {
  const container=$('#comparison'),open=new Map();
  container.querySelectorAll('.result').forEach(c=>open.set(c.dataset.policy,[...c.querySelectorAll('details')].map(d=>d.open)));
  container.replaceChildren(...(records.length ? records : [null,null]).map((r,i)=>resultColumn(i,r)));
  container.querySelectorAll('.result').forEach(c=>c.querySelectorAll('details').forEach((d,i)=>d.open=open.get(c.dataset.policy)?.[i]||false));
  if (records.length && !playing && records.every((r,i)=>(rendered[i]??r.events.length)>=r.events.length && r.run.state!=='running' && r.run.state!=='awaiting_confirmation')) {
    $('#verdict').hidden=false;
    const first=records[0],last=records.at(-1);
    const c=first.run.case.id;
    const explanation={timeout:'响应超时，不等于没有写入。看最终数据和原操作回执，才能判断是否完成。',duplicate:'去重是服务端的共同底线。同一个已确认操作重复投递，两版都只新增一条记录。',permission:'越权尝试与越权写入是两件事。两版都经过服务端鉴权，不能为了对比而关闭检查。',conflict:'确认只对当时的参数和版本有效。工单变了，就要重新查询并确认。',cancel:'取消只停止后续工作。本例在写入前取消，所以没有业务变更。',interrupted:'恢复靠的是保存的原操作标识。查到已提交后，不能再新增一条记录。',missing:'缺少目标组时，安全的结果是请求补充，而不是猜一个组。',transient:'有限重试可以处理短暂失败，但不等于可以无限重试。',unavailable:'一直失败的工具，需要明确停止。没有写入也应如实报告任务未执行。',normal:'两版都可以完成正常任务。差别要在异常里检验，而不是预设基础版失败。'};
    const total=records.length, passed=records.filter(r=>r.evaluation.passed).length;
    $('#verdict').replaceChildren(el('strong','',`本次对照：${passed} / ${total} 项符合案例预期。 `),document.createTextNode(explanation[c]||'查看最终数据、工具事件与逐项判据。'));
    if(source==='example') $('#verdict').append(document.createTextNode(' 这是程序策略示例，不是模型成功率。'));
  } else $('#verdict').hidden=true;
}
async function watch() {
  clearError(); mode('example'); records=structuredClone(catalog.pairs[caseId]);rendered=records.map(()=>0);playing=true;paused=false;
  const token=++playToken;$('#pause').hidden=false;$('#pause').textContent='暂停';$('#play-status').textContent='只读播放示例记录…';controls();render();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  while (token===playToken && rendered.some((n,i)=>n<records[i].events.length)) {
    if (!paused || reduced) {rendered=rendered.map((n,i)=>reduced?records[i].events.length:Math.min(n+1,records[i].events.length));render();}
    await new Promise(resolve=>setTimeout(resolve,reduced?0:320));
  }
  if(token!==playToken)return;
  playing=false;$('#pause').hidden=true;$('#play-status').textContent='播放结束 · 可展开判据或换个案例';$('#watch').textContent='重新观看示例';controls();render();
}
async function api(path,body) {
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),35000);
  try {
    const response=await fetch('/api/'+path,{method:body===undefined?'GET':'POST',headers:body===undefined?{}:{'Content-Type':'application/json','X-Bench-Request':'1'},body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal});
    const data=await response.json(); if(!response.ok)throw new Error(data.message||'本地接口请求失败。');return data;
  } catch(error) {if(error.name==='AbortError')throw new Error('接口等待超时；请刷新并恢复原运行，不能把超时当作未写入。');throw error;}finally{clearTimeout(timeout);}
}
function saveIds(){try{localStorage.setItem(restoreKey,JSON.stringify(records.map(r=>r.run.id)));$('#restore').hidden=false;}catch{/* Saving browser references is optional; server data still persists. */}}
async function drive() {
  let guard=0;
  while(records.some(r=>r.run.state==='running') && guard++<30) {
    for(let i=0;i<records.length;i++)if(records[i].run.state==='running') {
      records[i]=await api('runs/'+records[i].run.id+'/step',{});rendered[i]=records[i].events.length;saveIds();render();
      await new Promise(resolve=>setTimeout(resolve,120));
    }
  }
  $('#play-status').textContent=records.some(r=>r.run.state==='awaiting_confirmation')?'核对具体变更后确认，或取消后续步骤。':records.some(r=>r.run.state==='unknown')?'结果未知；先查询原操作。':'执行已停止 · 查看最终数据与判据';
}
async function startLocal(kind) {
  if(busy)return;busy=true;playToken++;clearError();controls();
  try {records=await api('pairs',{case_id:caseId,request_id:crypto.randomUUID(),mode:kind});rendered=records.map(r=>r.events.length);mode(kind);saveIds();render();await drive();}
  catch(e){fail(e.message+' 运行记录保留在本地；使用「恢复上次本地运行」重新读取。');}
  finally{busy=false;controls();render();}
}
async function localAction(index,action,body) {
  if(busy&&action==='cancel') {try{records[index]=await api('runs/'+records[index].run.id+'/cancel',{});rendered[index]=records[index].events.length;render();}catch(e){fail(e.message);}return;}
  if(busy)return;busy=true;clearError();controls();render();
  try {records[index]=await api('runs/'+records[index].run.id+'/'+action,body);rendered[index]=records[index].events.length;await drive();}
  catch(e){fail(e.message);}finally{busy=false;controls();render();}
}
async function restore() {
  if(busy)return;busy=true;clearError();controls();
  try {const ids=JSON.parse(localStorage.getItem(restoreKey));if(!Array.isArray(ids)||ids.length!==2)throw new Error('没有可恢复的运行。');records=await Promise.all(ids.map(id=>api('runs/'+id)));caseId=records[0].run.case.id;$('#case-select').value=caseId;$('#task').textContent=records[0].run.case.task;$('#case-title').textContent=records[0].run.case.title;$('#condition').textContent=records[0].run.case.condition;rendered=records.map(r=>r.events.length);mode(records[0].run.mode);render();await drive();}
  catch(e){fail(e.message);}finally{busy=false;controls();render();}
}
function exportRecord(record) {const data=JSON.stringify(record,null,2),url=URL.createObjectURL(new Blob([data],{type:'application/json'})),a=el('a');a.href=url;a.download='agent-bench-'+record.run.id+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function validRecord(r) {
  const states=Object.keys(labels);
  return r?.schema==='agent-bench-record-v1' && r.run && states.includes(r.run.state) && ['program','model'].includes(r.run.mode) && ['example','program-test','model-run'].includes(r.source) && r.initial && r.ticket && typeof r.ticket.group==='string' && Array.isArray(r.ticket.notes) && r.events?.length<=300 && r.events.every(e=>e && typeof e.name==='string' && typeof e.result==='object' && e.result) && r.evaluation?.checks?.length<=20 && r.evaluation.checks.every(c=>typeof c.label==='string' && typeof c.detail==='string' && typeof c.passed==='boolean') && r.evaluation.metrics && Array.isArray(r.operations) && r.run.case;
}
async function importRecord(event) {
  if(busy||playing)return;
  try {const file=event.target.files[0];if(!file)return;if(file.size>1048576)throw new Error('记录超过 1 MB 上限。');const r=JSON.parse(await file.text());if(!validRecord(r))throw new Error('这不是有效的本项目运行记录。');records=[r];rendered=[0];playing=true;playToken++;mode(r.source==='example'?'example':r.run.mode==='model'?'model-replay':'program-replay');$('#task').textContent=r.run.case.task;$('#case-title').textContent=r.run.case.title;$('#condition').textContent=r.run.case.condition;controls();
    const token=playToken;while(rendered[0]<r.events.length&&token===playToken){rendered[0]++;render();await new Promise(resolve=>setTimeout(resolve,matchMedia('(prefers-reduced-motion: reduce)').matches?0:200));}playing=false;controls();render();$('#import-status').textContent='已在浏览器完成只读回放。记录的来源和判分来自文件声明；离线重算请使用 rescore 命令。';
  }catch(e){playing=false;controls();fail('无法回放：'+e.message);}
}
async function load() {
  clearError();$('#retry-load').hidden=true;
  try {const response=await fetch('./samples/examples.json');if(!response.ok)throw new Error('案例文件不可用。');catalog=await response.json();if(catalog.schema!=='agent-bench-examples-v1')throw new Error('案例版本无法读取。');$('#case-select').replaceChildren(...catalog.cases.map(c=>{const o=el('option','',c.title);o.value=c.id;return o;}));$('#case-select').value=caseId;$('#versions').textContent='应用 '+catalog.versions.app+' · 案例 '+catalog.versions.cases+' · 判分 '+catalog.versions.grader;selectCase();
  }catch(e){fail('读取案例失败，请重新加载。'+e.message);$('#retry-load').hidden=false;return;}
  if(['localhost','127.0.0.1'].includes(location.hostname)) {
    try {localConfig=await api('config');$('#local-info').textContent='已连接本地 API。程序测试实际写入 SQLite；真实模型只在服务端配置后启用。';$('#run-model').textContent=localConfig.model_configured?'真实模型运行':'真实模型运行（未配置）';try{$('#restore').hidden=!localStorage.getItem(restoreKey);}catch{}controls();}catch{/* Static local preview has no API; examples remain usable. */}
  }
}
$('#case-select').addEventListener('change',e=>{caseId=e.target.value;selectCase();});$('#watch').addEventListener('click',watch);$('#pause').addEventListener('click',()=>{paused=!paused;$('#pause').textContent=paused?'继续播放':'暂停';});$('#run-program').addEventListener('click',()=>startLocal('program'));$('#run-model').addEventListener('click',()=>startLocal('model'));$('#restore').addEventListener('click',restore);$('#import-record').addEventListener('change',importRecord);$('#retry-load').addEventListener('click',load);
load();
