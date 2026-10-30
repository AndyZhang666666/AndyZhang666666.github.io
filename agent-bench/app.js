'use strict';
const $ = s => document.querySelector(s);
const Replay = window.AgentReplay;
const labels = {running:'执行中', awaiting_confirmation:'待确认', succeeded:'已完成', failed:'运行失败', denied:'已拒绝', needs_input:'待补充', unknown:'结果未知', cancelled:'已取消', conflict:'版本冲突'};
const names = {query_ticket:'查询工单',submit_change:'提交变更',operation_status:'核实原操作',start:'创建独立沙盒',preview:'等待确认',confirm:'留档中的批准',final:'最终回复',concurrent_update:'工单版本变化',model_error:'模型请求失败',parse_error:'解析失败',invalid_call:'无效工具参数'};
const shortNames={start:'初始化',query_ticket:'查询工单',preview:'等待批准',confirm:'已记录批准',submit_change:'提交变更',operation_status:'核实原操作',final:'最终回复',concurrent_update:'版本变化'};
const policyName = p => p === 'baseline' ? '基础策略' : '可靠策略';
const caseTitles = {timeout:'响应丢失',permission:'权限不足',conflict:'批准后版本变化'};
const briefs = {
  timeout:'提交变更时没有收到回执。下一步应该重试，还是先核实？',
  permission:'当前身份只能查看。比较两种策略如何处理权限边界。',
  conflict:'批准与提交之间，工单可能被其他处理人更新。',
  normal:'工具正常，身份有修改权限。先看一次完整的正常流程。',
  missing:'任务没有说明目标处理组。观察策略如何处理缺失信息。',
  transient:'工单查询可能暂时不可用。观察重试与停止的边界。',
  unavailable:'工单查询持续不可用。观察是否能在有限次数内停止。',
  duplicate:'同一个操作被重复投递。检查跟进记录是否也会重复。',
  cancel:'确认之前选择停止。检查取消与业务数据的关系。',
  interrupted:'执行过程被中断。观察如何从持久化记录恢复。'
};
const lessons = {
  timeout:'响应超时，不等于没有写入。两条记录的最终数据库都已更新；差别是基础策略停在结果未知，可靠策略查询原操作后确认了完成。',
  permission:'正确拒绝也可以符合案例预期。两条策略都没有越权写入；可靠策略先识别只读权限，基础策略的修改请求被服务端拦住。',
  conflict:'批准只对当时的参数和版本有效。工单更新后，需要重新读取，并对新版本再次取得批准。',
  duplicate:'去重是共同的服务端底线。同一个已确认操作重复投递，两条策略都只增加一条记录。',
  cancel:'取消停止后续工作，不撤销已经提交的效果。本例在写入之前取消，因此没有业务变更。',
  interrupted:'恢复依靠保存的原操作标识。本例两条记录都查询了原操作，没有通过新增一条记录来猜测是否成功。',
  missing:'缺少目标处理组时，请求补充才是安全的结果。不能为了完成任务猜一个组。',
  transient:'有限重试可以处理短暂故障，但每次尝试和最终结果都需要留档。',
  unavailable:'正确停止可以符合案例预期，任务仍然没有完成。这两个判断需要分别呈现。',
  normal:'正常任务两条策略都能完成。差异需要在异常和边界中观察，不应预设基础策略必然失败。'
};
let catalog, caseId='timeout', records=[], rendered=[], source='example', localConfig=null;
let busy=false, playing=false, playToken=0, replayActive=true, started=false, cursor=0;
let activePolicy='hardened', selectedEvent=null, checkpointPaused=false, bundled=true;
let updatedFields=new Map();
const restoreKey='agent-bench-runs-v1';
function el(tag, className, text) {const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;}
function fail(message) {$('#error').textContent=message;$('#error').hidden=false;}
function clearError() {$('#error').hidden=true;}
function mode(kind) {
  source=kind;
  const messages={
    example:['示例演示 · 不调用 AI','原创程序策略记录，只读回放；不计入模型评测。'],
    program:['本地程序测试 · 实际写入 SQLite','确定性程序选择工具，不调用 AI；每条策略拥有独立工单。'],
    model:['真实模型运行 · 本地工单沙盒','模型选择工具，服务端鉴权；仅写入本次隔离数据库。'],
    'model-replay':['真实记录回放 · 只读','导入的模型留档，非现场生成；来源由文件声明，未经签名认证。'],
    'program-replay':['程序记录回放 · 非 AI','导入的程序测试记录，不调用工具，不计入模型评测。']
  };
  const [title,help]=messages[kind]||messages.example;
  $('#source-label').textContent=title;$('#source-help').textContent=help;
}
function lessonForRecords() {return replayActive&&bundled?lessons[records[0].run.case.id]||'根据留档事件与判据复核。':'分别核对最终快照、结束声明与逐项判据。以下复盘依据本次留档；导入来源不等于真实性认证。';}
function currentCase() {return catalog?.cases.find(c=>c.id===caseId);}
function updateTask(c, initial) {
  $('#case-title').textContent=caseTitles[c.id]||c.title;
  $('#task').textContent=c.task;
  $('#condition').textContent=briefs[c.id]||'只读查看本次运行的任务、事件与数据。';
  const t=initial||{id:'T102',title:'样品包装破损',group:'客服组',status:'open',notes:[]};
  const dl=$('#initial-ticket');dl.replaceChildren();
  for(const [name,value] of [['工单',t.id+' · '+t.title],['处理组',t.group],['状态 / 记录',(t.status==='open'?'打开':t.status)+' / '+t.notes.length+' 条']]) {
    const row=el('div');row.append(el('dt','',name),el('dd','',value));dl.append(row);
  }
}
function stopPlayback() {playToken++;playing=false;}
function selectCase() {
  stopPlayback();busy=false;started=false;cursor=0;checkpointPaused=false;replayActive=true;selectedEvent=null;bundled=true;
  records=structuredClone(catalog.pairs[caseId]);rendered=records.map(()=>0);mode('example');clearError();
  $('#import-record').value='';$('#import-status').textContent='';
  updateTask(currentCase(),records[0].initial);
  $('#play-status').textContent='点击「开始逐步回放」，在关键节点停下来核对。';
  controls();render();
}
function controls() {
  const ready=!!catalog;
  $('#case-select').disabled=!ready||busy;
  document.querySelectorAll('[data-case]').forEach(b=>{b.disabled=!ready||busy;b.setAttribute('aria-pressed',String(b.dataset.case===caseId));});
  $('#watch').disabled=!ready||busy;
  $('#watch').textContent=playing?'暂停播放':!replayActive?'观看示例':!started?'开始逐步回放':cursor>=Replay.maxSteps(records)?'重新回放':'继续播放';
  $('#previous').disabled=busy||!replayActive||cursor<=0;
  $('#next').disabled=!ready||busy||(replayActive&&cursor>=Replay.maxSteps(records));
  $('#finish').disabled=!ready||busy||(replayActive&&started&&cursor>=Replay.maxSteps(records));
  $('#run-program').disabled=!localConfig||!currentCase()||busy||playing;
  $('#run-model').disabled=!localConfig?.model_configured||!currentCase()||busy||playing;
  $('#restore').disabled=busy||playing;
  $('#import-record').disabled=busy;
}
function eventText(e) {
  if(e.kind==='reply')return e.result.summary||'记录没有最终回复内容。';
  if(['TIMEOUT','INTERRUPTED'].includes(e.result.code))return '没有收到提交回执；此时不能断言没有写入。';
  if(e.result.deduplicated)return '同一操作已处理，返回原回执；没有新增记录。';
  if(e.name==='operation_status')return e.result.status==='committed'?'查到原操作已提交，不再重复写入。':e.result.message||'原操作尚未确认提交。';
  if(e.name==='submit_change'&&e.result.ok)return '变更已提交，新增一条跟进记录。';
  if(e.name==='query_ticket'&&e.result.ok)return `读取工单 v${e.result.ticket.version}；${e.result.can_edit?'当前身份可修改':'当前身份只读'}。`;
  if(e.name==='confirm')return '留档中的操作者批准了当时的具体参数和版本。此次回放没有提交批准。';
  return e.result.message||'查看这条事件的原始结果。';
}
function allReplayed() {return started&&cursor>=Replay.maxSteps(records);}
function audited() {return replayActive?allReplayed()&&records.every(Replay.terminal):records.length&&records.every(Replay.terminal);}
function stateFor(r,index) {
  if(replayActive&&!started)return {text:'尚未开始',tone:'neutral'};
  const count=replayActive?Replay.countAt(r,cursor):r.events.length;
  if(count<r.events.length) {
    const observed=Replay.observed(r,count);
    return {text:observed.uncertain?'回执待核实':playing?'回放中':'停在第 '+count+' 项',tone:observed.uncertain?'warning':'neutral'};
  }
  const state=r.run.state;
  return {text:labels[state]||state,tone:state==='unknown'?'warning':state==='succeeded'?'good':['failed','conflict'].includes(state)?'bad':'neutral'};
}
function ticketData(t, initial, updated={}) {
  const dl=el('dl','ticket-data');
  for(const [name,value,changed,key] of [['处理组',t.group,t.group!==initial.group,'group'],['状态',t.status==='open'?'打开':t.status,t.status!==initial.status,'status'],['跟进记录',t.notes.length+' 条',t.notes.length!==initial.notes.length,'notes']]) {
    const row=el('div');row.append(el('dt','',name),el('dd',(changed?'changed ':'')+(updated[key]?'just-updated':''),value));dl.append(row);
  }
  return dl;
}
function replayColumn(index,r) {
  const policy=r.run.policy,count=Replay.countAt(r,cursor),state=stateFor(r,index);
  const column=el('article','result replay-result');column.dataset.policy=policy;column.id='lane-'+policy;
  column.dataset.active=String(policy===activePolicy||records.length===1);
  column.setAttribute('role','tabpanel');column.setAttribute('aria-labelledby','tab-'+policy);
  const top=el('div','result-top');top.append(el('h3','',policyName(policy)),el('span','state '+state.tone,state.text));
  column.append(top,el('p','strategy',policy==='baseline'?'工具出错后，停止并报告。':'先核对权限，异常后查询、核实与恢复。'));
  const receipt=Replay.receipt(r,cursor),receiptBox=el('div','receipt '+receipt.tone);
  receiptBox.append(el('span','field-label','工具返回了什么'),el('strong','',receipt.title),el('p','',receipt.detail));column.append(receiptBox);
  const observation=Replay.observed(r,cursor),final=audited();
  const dataBox=el('div','business-state'+(observation.uncertain&&!final?' uncertain':''));
  dataBox.append(el('span','field-label',final?'数据库最终快照 · 留档核验':'当时已读到的工单'));
  dataBox.append(ticketData(final?r.ticket:observation.ticket,r.initial,updatedFields.get(policy)));
  const known=observation.ticket;
  const basis=final?`Agent 最后已知：v${known.version} · ${known.group} · ${known.notes.length} 条${observation.uncertain?'，此后结果未核实。':'，有工具记录支持。'}`:observation.uncertain?`待核实 · 以上为上次读取的 v${known.version}，不能当作当前数据库结果。`:observation.evidence?`依据：事件 ${observation.evidence} 的工单快照 · v${known.version}`:'初始快照 · 尚未读取工具记录';
  dataBox.append(el('p','state-basis'+(observation.uncertain?' warning':''),basis));column.append(dataBox);
  const trackHeader=el('div','track-heading');trackHeader.append(el('span','field-label','已回放事件'),el('span','event-count',count+' / '+r.events.length));column.append(trackHeader);
  const list=el('ol','event-track');
  for(let i=0;i<count;i++) {
    const event=r.events[i],li=el('li'),button=el('button','event-node');
    const selected=selectedEvent?.policy===policy&&selectedEvent.index===i;
    button.dataset.focus=policy+'-'+i;button.setAttribute('aria-pressed',String(selected));button.setAttribute('aria-controls','event-inspector');button.setAttribute('aria-label',policyName(policy)+' · 事件 '+(i+1)+' · '+(names[event.name]||event.name));
    if(i===count-1)button.classList.add('latest');
    if(event.result.code)button.classList.add('has-notice');
    button.append(el('span','event-number',String(i+1).padStart(2,'0')),el('span','event-name',shortNames[event.name]||names[event.name]||event.name));
    button.addEventListener('click',()=>{selectedEvent={policy,index:i};render();$('#event-inspector').scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});});li.append(button);list.append(li);
  }
  if(!count)list.append(el('li','track-empty','回放开始后，点击任意已发生的事件查看证据。'));
  column.append(list);
  if(allReplayed()&&!Replay.terminal(r))column.append(el('p','muted','留档在此处结束，尚无终局判定；回放不会替你批准或继续执行。'));
  if(final)column.append(el('p','case-result '+(r.evaluation.passed?'good':'bad'),(r.evaluation.passed?'符合案例预期':'未符合案例预期')+' · '+(labels[r.run.state]||r.run.state)));
  return column;
}
function actionButton(label,action,primary=false) {const b=el('button',primary?'primary':'',label);b.disabled=busy&&!label.startsWith('停止');b.addEventListener('click',action);return b;}
function localColumn(index,r) {
  const policy=r.run.policy,column=el('article','result');column.dataset.policy=policy;
  const state=stateFor(r,index),top=el('div','result-top');top.append(el('h3','',policyName(policy)),el('span','state '+state.tone,state.text));column.append(top);
  column.append(el('p','strategy',policy==='baseline'?'直接执行；工具出错后停止并报告。':'核实权限、有限重试、查询原操作后恢复。'),ticketData(r.ticket,r.initial));
  column.append(el('p','result-summary',r.run.state==='awaiting_confirmation'?'尚未写入。核对具体变更后，选择确认或取消。':r.run.state==='running'?'正在执行；以下为已持久化的数据。':r.run.reply?.summary||'提交回执未知；先核实原操作。'));
  if(r.run.state==='awaiting_confirmation') {
    const box=el('div','approval'),a=r.run.pending;
    box.append(el('p','',`请确认：${a.ticket_id} v${a.expected_version} → ${a.group}；添加「${a.note}」；保持工单打开。`));
    const actions=el('div','actions');actions.append(actionButton('确认此变更',()=>localAction(index,'confirm',{digest:r.approval_digest}),true),actionButton('取消后续步骤',()=>localAction(index,'cancel',{})));box.append(actions);column.append(box);
  }
  if(r.run.state==='unknown') {const actions=el('div','actions');actions.append(actionButton('查询原操作并恢复',()=>localAction(index,'recover',{}),true),actionButton('停止后续步骤',()=>localAction(index,'cancel',{})));column.append(actions);}
  if(r.run.state==='running')column.append(actionButton('停止后续步骤',()=>localAction(index,'cancel',{})));
  const list=el('ol','timeline');for(const e of r.events.filter(e=>e.kind!=='reply').slice(-3)){const li=el('li','',names[e.name]||e.name);li.append(el('small','',eventText(e)));list.append(li);}column.append(list);
  if(Replay.terminal(r))appendRecordDetails(column,r);
  return column;
}
function appendRecordDetails(container,r) {
  const checks=el('details','grade-details');checks.append(el('summary','',`逐项判据 · ${r.evaluation.passed?'符合预期':'未符合预期'}`));
  const list=el('ul','checks');for(const c of r.evaluation.checks){const li=el('li');li.append(el('strong',c.passed?'pass':'fail',(c.passed?'通过 · ':'未通过 · ')+c.label),el('span','check-detail',c.detail));list.append(li);}checks.append(list);container.append(checks);
  const raw=el('details','record-details');raw.append(el('summary','','工具轨迹与版本'));
  const m=r.evaluation.metrics;
  raw.append(el('p','meta',`运行 ${r.run.id} · ${r.run.mode==='model'?'模型 '+(r.run.model||'未知'):'程序策略'} · 总经过 ${m.elapsed_ms??'未知'} ms · 工具 ${m.tool_calls??'未知'} 次 · 模型 ${m.model_calls??'未知'} 次 · Token ${m.usage?.total_tokens??'未知'}`));
  raw.append(el('p','meta',`任务 1；实际完成 ${m.successes??'未知'}；符合案例预期 ${m.case_passes??Number(r.evaluation.passed)}；运行失败 ${m.run_failures??'未知'}；越权尝试 ${m.unauthorized_attempts??'未知'}；实际越权写入 ${m.unauthorized_writes??'未知'}；重复写入 ${m.duplicate_writes??'未知'}；需人工接管 ${m.human_takeovers??'未知'}。`));
  const pre=el('pre','raw',JSON.stringify({source:r.source,versions:r.run.versions,events:r.events,operations:r.operations},null,2));pre.tabIndex=0;pre.setAttribute('aria-label',policyName(r.run.policy)+'原始记录');raw.append(pre);container.append(raw);
  const button=el('button','export','导出这次运行 JSON');button.addEventListener('click',()=>exportRecord(r));container.append(button);
}
function renderInspector() {
  const r=records.find(r=>r.run.policy===selectedEvent?.policy),e=r?.events[selectedEvent?.index];
  const visible=replayActive&&e&&selectedEvent.index<Replay.countAt(r,cursor);
  $('#event-inspector').hidden=!visible;if(!visible)return;
  $('#event-position').textContent=policyName(r.run.policy)+' / 事件 '+(selectedEvent.index+1);
  $('#event-title').textContent=names[e.name]||e.name;$('#event-description').textContent=eventText(e);
  $('#event-boundary').textContent=e.kind==='human'?'这是已记录的人工操作；点击事件不会产生新的批准。':'只展示工具调用与可见结果，不展示模型隐藏思维链。';
  $('#event-json').textContent=JSON.stringify(e,null,2);
  const facts=$('#event-facts');facts.replaceChildren();
  const ticket=e.result.operation?.ticket||e.result.ticket,operation=e.result.operation;
  const fields=[];if(e.result.code)fields.push(['返回代码',e.result.code]);
  if(ticket)fields.push(['快照版本','v'+ticket.version],['处理组',ticket.group],['跟进记录',ticket.notes.length+' 条']);
  if(operation)fields.push(['原操作标识',operation.id]);
  for(const [key,value]of fields){const row=el('div');row.append(el('span','field-label',key),el('span',key==='原操作标识'?'operation-id':'',value));facts.append(row);}
}
function recapMarkdown() {
  const out=['# Agent 执行复盘', '', $('#source-label').textContent, $('#source-help').textContent, '', '任务：'+records[0].run.case.task, '', lessonForRecords(), ''];
  for(const r of records){const recap=Replay.recap(r);out.push('## '+policyName(r.run.policy),'运行：'+r.run.id,'来源：'+r.source,'结束状态：'+(labels[recap.state]||recap.state),'符合案例预期：'+(recap.passed?'是':'否'),'异常：'+(recap.anomaly?eventText(recap.anomaly):'未记录工具异常。'),'处理：'+(recap.resolution?eventText(recap.resolution):recap.reply),'最终数据：'+recap.ticket.group+' / '+recap.ticket.status+' / '+recap.ticket.notes.length+' 条记录','Agent 回复：'+recap.reply,'',...recap.checks.map(c=>(c.passed?'[通过] ':'[未通过] ')+c.label+'：'+c.detail),'');}
  out.push('边界：依据已有记录只读复盘，不调用模型、不重新执行工具。文件声明不等于真实性认证；播放速度不是运行耗时。');return out.join('\n');
}
function renderVerdict() {
  const container=$('#verdict');container.hidden=!audited();if(container.hidden){container.replaceChildren();return;}
  const heading=el('div','recap-heading'),title=el('div');title.append(el('span','field-label','最终核验 / 本例复盘'),el('h2','','看最终数据，再判断是否完成。'));title.lastChild.id='verdict-title';
  const md=el('button','', '下载复盘 Markdown');md.addEventListener('click',()=>download(recapMarkdown(),'agent-bench-recap.md','text/markdown'));heading.append(title,md);
  const passed=records.filter(r=>r.evaluation.passed).length;
  const note=el('p','recap-count',`本例 ${records.length} 条策略记录中，${passed} 条符合预期。${source==='example'?'这是程序案例对照，不是模型成功率。':'判据来自这份留档；浏览器没有重新判分。'}`);
  const lesson=el('p','lesson',lessonForRecords());
  const cards=el('div','recap-grid');
  for(const r of records){const recap=Replay.recap(r),card=el('article','recap-card');card.dataset.policy=r.run.policy;card.append(el('h3','',policyName(r.run.policy)));
    const dl=el('dl','recap-facts');for(const [key,value]of [['异常',recap.anomaly?eventText(recap.anomaly):'未记录工具异常。'],['处理',recap.resolution?eventText(recap.resolution):recap.reply],['实际影响',`${recap.ticket.group} · ${recap.ticket.status==='open'?'工单打开':recap.ticket.status} · ${recap.ticket.notes.length} 条跟进记录`],['结束声明',recap.reply]]){const row=el('div');row.append(el('dt','',key),el('dd','',value));dl.append(row);}card.append(dl);appendRecordDetails(card,r);cards.append(card);}
  container.replaceChildren(heading,note,lesson,cards);
}
function render() {
  const focused=document.activeElement?.dataset.focus;
  const disclosures=new Map([...document.querySelectorAll('#comparison details, #verdict details')].map(d=>[(d.closest('[data-policy]')?.dataset.policy||'')+d.className,d.open]));
  $('#comparison').dataset.live=String(!replayActive);$('#comparison').replaceChildren(...records.map((r,i)=>replayActive?replayColumn(i,r):localColumn(i,r)));
  const total=Replay.maxSteps(records);$('#progress').max=Math.max(1,total);$('#progress').value=replayActive?cursor:total;
  $('#step-label').textContent=replayActive?(started?`${cursor} / ${total} 项事件`:'尚未开始'): '本地执行';
  const checkpoint=replayActive&&started?Replay.checkpoint(records,cursor):null,box=$('#checkpoint');box.hidden=!replayActive;
  if(replayActive){const title=allReplayed()?'记录已回放，下面核对实际影响。':checkpoint?.title||(!started?'先看回执，再下结论。':'继续沿着事件核对。');const body=allReplayed()?'轨道已到各自的留档终点。最终快照、结束状态和案例判据分别呈现。':checkpoint?.body||(!started?'回放会在关键异常处暂停。也可以用上一步、下一步逐项检查。':'点击已回放的事件，可以查看它的工具结果与证据。');box.replaceChildren(el('strong','',title),el('p','',body));box.classList.toggle('at-checkpoint',!!checkpoint&&!allReplayed());}
  const overview=$('#result-overview');overview.hidden=!started||!replayActive;overview.replaceChildren(...records.map((r,i)=>{const row=el('div'),s=stateFor(r,i);row.append(el('span','',policyName(r.run.policy)),el('strong',s.tone,s.text));return row;}));
  $('.policy-tabs').hidden=!replayActive||records.length<2;
  document.querySelectorAll('[data-policy-tab]').forEach(b=>{const active=b.dataset.policyTab===activePolicy;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});
  renderInspector();renderVerdict();
  document.querySelectorAll('#comparison details, #verdict details').forEach(d=>{d.open=disclosures.get((d.closest('[data-policy]')?.dataset.policy||'')+d.className)||false;});
  if(focused)document.querySelector('[data-focus="'+focused+'"]')?.focus({preventScroll:true});
}
function ensureReplay() {
  if(!replayActive){records=structuredClone(catalog.pairs[caseId]);cursor=0;started=false;selectedEvent=null;replayActive=true;bundled=true;mode('example');updateTask(currentCase(),records[0].initial);}
}
function setCursor(value) {
  const previous=cursor;const old=records.map(r=>audited()?r.ticket:Replay.observed(r,cursor).ticket);cursor=Math.max(0,Math.min(value,Replay.maxSteps(records)));started=true;rendered=records.map(r=>Replay.countAt(r,cursor));
  updatedFields=new Map(records.map((r,i)=>{const t=audited()?r.ticket:Replay.observed(r,cursor).ticket;return [r.run.policy,{group:old[i].group!==t.group,status:old[i].status!==t.status,notes:old[i].notes.length!==t.notes.length}];}));
  let chosen=records.find(r=>r.run.policy===activePolicy&&cursor<=r.events.length)||records.find(r=>cursor<=r.events.length)||records.at(-1);
  selectedEvent=cursor?{policy:chosen.run.policy,index:Math.min(cursor,chosen.events.length)-1}:null;
  render();updatedFields.clear();controls();
  if(cursor!==previous){$('#comparison').classList.remove('step-change');void $('#comparison').offsetWidth;$('#comparison').classList.add('step-change');}
}
function describePosition() {
  if(allReplayed())return '播放结束 · 已到留档终点，可查看最终核验与复盘。';
  if(!cursor)return '已回到起点；没有重新执行工具。';
  return `已暂停 · 第 ${cursor} 项事件${checkpointPaused?' · 关键节点，继续前先核对证据':''}`;
}
function orientTo(selector) {requestAnimationFrame(()=>$(selector).scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));}
async function play() {
  if(busy)return;if(playing){stopPlayback();$('#play-status').textContent=describePosition();controls();render();return;}
  ensureReplay();if(allReplayed()){cursor=0;started=false;selectedEvent=null;}
  const first=!started;playing=true;checkpointPaused=false;const token=++playToken;controls();if(first)orientTo('.result-heading');
  while(token===playToken&&cursor<Replay.maxSteps(records)){
    setCursor(cursor+1);
    const checkpoint=Replay.checkpoint(records,cursor);
    if(checkpoint&&!allReplayed()){playing=false;checkpointPaused=true;$('#play-status').textContent=describePosition();controls();render();return;}
    $('#play-status').textContent=allReplayed()?describePosition():`只读回放中 · 第 ${cursor} 项事件`;
    await new Promise(resolve=>setTimeout(resolve,850));
  }
  if(token!==playToken)return;playing=false;controls();render();$('#play-status').textContent=describePosition();
}
function seek(value) {if(busy||!catalog)return;stopPlayback();ensureReplay();checkpointPaused=false;setCursor(value);$('#play-status').textContent=describePosition();}
function switchPolicy(policy,focus=false) {activePolicy=policy;const r=records.find(r=>r.run.policy===policy);if(r&&cursor>0)selectedEvent={policy,index:Replay.countAt(r,cursor)-1};render();if(focus)document.querySelector('[data-policy-tab="'+policy+'"]')?.focus();}
async function api(path,body) {
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),35000);
  try{const response=await fetch('/api/'+path,{method:body===undefined?'GET':'POST',headers:body===undefined?{}:{'Content-Type':'application/json','X-Bench-Request':'1'},body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal});const data=await response.json();if(!response.ok)throw new Error(data.message||'本地接口请求失败。');return data;}
  catch(error){if(error.name==='AbortError')throw new Error('接口等待超时；请刷新并恢复原运行，不能把超时当作未写入。');throw error;}finally{clearTimeout(timeout);}
}
function saveIds(){try{localStorage.setItem(restoreKey,JSON.stringify(records.map(r=>r.run.id)));$('#restore').hidden=false;}catch{/* Browser references are optional; server data persists. */}}
async function drive() {
  let guard=0;while(records.some(r=>r.run.state==='running')&&guard++<30){for(let i=0;i<records.length;i++)if(records[i].run.state==='running'){records[i]=await api('runs/'+records[i].run.id+'/step',{});rendered[i]=records[i].events.length;saveIds();render();await new Promise(resolve=>setTimeout(resolve,120));}}
  $('#play-status').textContent=records.some(r=>r.run.state==='awaiting_confirmation')?'核对具体变更后确认，或取消后续步骤。':records.some(r=>r.run.state==='unknown')?'结果未知；先查询原操作。':'执行已停止 · 查看最终数据与判据';
}
async function startLocal(kind) {
  if(busy)return;busy=true;stopPlayback();clearError();controls();
  try{records=await api('pairs',{case_id:caseId,request_id:crypto.randomUUID(),mode:kind});rendered=records.map(r=>r.events.length);replayActive=false;started=true;selectedEvent=null;bundled=false;mode(kind);updateTask(records[0].run.case,records[0].initial);saveIds();render();await drive();}
  catch(e){fail(e.message+' 运行记录保留在本地；使用「恢复上次本地运行」重新读取。');}finally{busy=false;controls();render();}
}
async function localAction(index,action,body) {
  if(busy&&action==='cancel'){try{records[index]=await api('runs/'+records[index].run.id+'/cancel',{});rendered[index]=records[index].events.length;render();}catch(e){fail(e.message);}return;}
  if(busy)return;busy=true;clearError();controls();render();
  try{records[index]=await api('runs/'+records[index].run.id+'/'+action,body);rendered[index]=records[index].events.length;await drive();}catch(e){fail(e.message);}finally{busy=false;controls();render();}
}
async function restore() {
  if(busy)return;busy=true;stopPlayback();clearError();controls();
  try{const ids=JSON.parse(localStorage.getItem(restoreKey));if(!Array.isArray(ids)||ids.length!==2)throw new Error('没有可恢复的运行。');records=await Promise.all(ids.map(id=>api('runs/'+id)));caseId=records[0].run.case.id;$('#case-select').value=caseId;updateTask(records[0].run.case,records[0].initial);rendered=records.map(r=>r.events.length);replayActive=false;started=true;selectedEvent=null;bundled=false;mode(records[0].run.mode);render();await drive();}catch(e){fail(e.message);}finally{busy=false;controls();render();}
}
function download(data,filename,type) {const url=URL.createObjectURL(new Blob([data],{type})),a=el('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function exportRecord(record) {download(JSON.stringify(record,null,2),'agent-bench-'+record.run.id+'.json','application/json');}
function validRecord(r) {
  const ticket=t=>t&&typeof t.group==='string'&&typeof t.status==='string'&&typeof t.title==='string'&&typeof t.id==='string'&&Number.isInteger(t.version)&&Array.isArray(t.notes)&&t.notes.every(n=>typeof n==='string');
  return r?.schema==='agent-bench-record-v1'&&r.run&&typeof r.run.id==='string'&&['baseline','hardened'].includes(r.run.policy)&&Object.hasOwn(labels,r.run.state)&&['program','model'].includes(r.run.mode)&&['example','program-test','model-run'].includes(r.source)&&ticket(r.initial)&&ticket(r.ticket)&&Array.isArray(r.events)&&r.events.length>0&&r.events.length<=300&&r.events.every(e=>e&&typeof e.name==='string'&&typeof e.kind==='string'&&e.result&&typeof e.result==='object'&&(!e.result.ticket||ticket(e.result.ticket))&&(!e.result.operation?.ticket||ticket(e.result.operation.ticket)))&&typeof r.evaluation?.passed==='boolean'&&Array.isArray(r.evaluation.checks)&&r.evaluation.checks.length<=20&&r.evaluation.checks.every(c=>typeof c.label==='string'&&typeof c.detail==='string'&&typeof c.passed==='boolean')&&r.evaluation.metrics&&Array.isArray(r.operations)&&r.run.case&&typeof r.run.case.id==='string'&&typeof r.run.case.task==='string'&&typeof r.run.case.title==='string';
}
async function importRecord(event) {
  if(busy)return;
  try{const file=event.target.files[0];if(!file)return;if(file.size>1048576)throw new Error('记录超过 1 MB 上限。');const r=JSON.parse(await file.text());if(!validRecord(r))throw new Error('这不是有效的本项目运行记录。');
    stopPlayback();clearError();records=[r];rendered=[0];cursor=0;started=false;replayActive=true;selectedEvent=null;bundled=false;activePolicy=r.run.policy;checkpointPaused=false;
    caseId=r.run.case.id;$('#case-select').value=caseId;mode(r.source==='example'?'example':r.run.mode==='model'?'model-replay':'program-replay');updateTask(r.run.case,r.initial);controls();render();$('#play-status').textContent='导入成功 · 点击开始，或直接查看留档结果。';$('#import-status').textContent='已在浏览器读取记录，可逐步只读回放。来源和判分来自文件声明；离线重算请使用 rescore 命令。';
  }catch(e){fail('无法回放：'+e.message);}
}
async function load() {
  clearError();$('#retry-load').hidden=true;
  try{const response=await fetch('./samples/examples.json');if(!response.ok)throw new Error('案例文件不可用。');catalog=await response.json();if(catalog.schema!=='agent-bench-examples-v1')throw new Error('案例版本无法读取。');$('#case-select').replaceChildren(...catalog.cases.map(c=>{const o=el('option','',caseTitles[c.id]||c.title);o.value=c.id;return o;}));$('#case-select').value=caseId;$('#versions').textContent='界面：逐步回放 · 留档应用 '+catalog.versions.app+' · 案例 '+catalog.versions.cases+' · 判分 '+catalog.versions.grader;selectCase();}
  catch(e){catalog=null;controls();fail('读取案例失败，请重新加载。'+e.message);$('#retry-load').hidden=false;$('#play-status').textContent='案例读取失败；可重新加载。';return;}
  if(['localhost','127.0.0.1'].includes(location.hostname))try{localConfig=await api('config');$('#local-info').textContent='已连接本地 API。程序测试实际写入 SQLite；真实模型只在服务端配置后启用。';$('#run-model').textContent=localConfig.model_configured?'真实模型运行':'真实模型运行（未配置）';try{$('#restore').hidden=!localStorage.getItem(restoreKey);}catch{}controls();}catch{/* Static local preview has no API; examples remain usable. */}
}
$('#case-select').addEventListener('change',e=>{caseId=e.target.value;selectCase();});
for(const button of document.querySelectorAll('[data-case]'))button.addEventListener('click',()=>{caseId=button.dataset.case;$('#case-select').value=caseId;selectCase();});
$('#watch').addEventListener('click',play);$('#previous').addEventListener('click',()=>seek(cursor-1));$('#next').addEventListener('click',()=>seek(replayActive?cursor+1:1));$('#finish').addEventListener('click',()=>{seek(replayActive?Replay.maxSteps(records):Replay.maxSteps(catalog.pairs[caseId]));orientTo(audited()?'#verdict':'.result-heading');});
for(const button of document.querySelectorAll('[data-policy-tab]')){button.addEventListener('click',()=>switchPolicy(button.dataset.policyTab));button.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();switchPolicy(e.key==='Home'?'baseline':e.key==='End'?'hardened':activePolicy==='baseline'?'hardened':'baseline',true);}});}
$('#run-program').addEventListener('click',()=>startLocal('program'));$('#run-model').addEventListener('click',()=>startLocal('model'));$('#restore').addEventListener('click',restore);$('#import-record').addEventListener('change',importRecord);$('#retry-load').addEventListener('click',load);
load();
