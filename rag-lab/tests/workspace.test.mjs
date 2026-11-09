import test from 'node:test';import assert from 'node:assert/strict';
import {newWorkspace,validateWorkspace,personalRun,exportWorkspace,signature}from '../workspace.mjs';
import {TASKS,TASK_DOCUMENTS,taskRun}from '../task-catalog.mjs';import{readFile}from'node:fs/promises';
const docs=JSON.parse(await readFile(new URL('../public-corpus.json',import.meta.url))).documents;
function own(){const w=newWorkspace();w.documents=[{id:'USR-1',title:'自己的设备规则',text:'显示器单次最长借用 21 天。',policy:'loan',version:'1',effectiveFrom:'2026-01-01',confirmed:true}];w.question='显示器最长能借多久？';return w;}
test('personal unknown scope is evidence only; confirmed supported facts remain source bound',()=>{let w=own();let r=personalRun(w);assert.equal(r.status,'evidence');w.confirmedRules=true;r=personalRun(w);assert.equal(r.status,'answered');assert.match(r.answer,/21 天/);w.documents[0].effectiveFrom='';assert.equal(personalRun(w).status,'evidence');});
test('personal edits make output stale without mutating old evidence',()=>{const w=own(),r=personalRun(w);w.selected=[r.retrieved[0].id];w.draft='人工补写';let e=exportWorkspace(w,r);assert.equal(e.author,'用户编辑；不是模型生成');assert.ok(!e.documents);w.question='别的问题';assert.throws(()=>exportWorkspace(w,r),/重新检索/);assert.equal(r.question,'显示器最长能借多久？');});
test('invalid period/oversized documents reject rather than replacing workspace',()=>{const w=own();w.documents[0].effectiveTo='2025-01-01';assert.throws(()=>validateWorkspace(w));w.documents[0].effectiveTo=null;w.documents[0].text='x'.repeat(200001);assert.throws(()=>validateWorkspace(w));});
test('task catalog has 12 complete editable examples, extension keeps original corpus untouched',()=>{assert.equal(TASKS.length,12);assert.equal(docs.length,12);assert.equal(TASK_DOCUMENTS.length,12);assert.ok(TASK_DOCUMENTS.every(d=>d.roles.includes('employee')&&!d.id.startsWith('ADM-')));for(const t of TASKS){const r=taskRun(docs,t,{question:t.question,date:t.date||'2026-10-28',snapshot:t.snapshot||'baseline'},{borrowed:'2026-10-20',due:'2026-11-01',used:t.used||'0',booking:t.booking||'no'});assert.equal(r.taskId,t.id);assert.ok(r.answer&&r.taskNext.length);assert.ok(!JSON.stringify(r).includes('ADM-'));}});
test('renew facts change outcome; not simply a canned success per preset',()=>{const t=TASKS.find(t=>t.id==='R06'),i={question:t.question,date:'2026-10-28',snapshot:'baseline'};assert.equal(taskRun(docs,t,i,{}).status,'clarify');assert.equal(taskRun(docs,t,i,{borrowed:'2026-10-20',due:'2026-11-01',used:'0',booking:'no'}).status,'answered');assert.equal(taskRun(docs,t,i,{borrowed:'2026-10-20',due:'2026-11-01',used:'1',booking:'no'}).status,'insufficient');assert.equal(taskRun(docs,t,i,{borrowed:'2026-10-20',due:'2026-11-01',used:'0',booking:'yes'}).status,'insufficient');});

test('task supplements remain scoped by effective date; no canned loan for tablet',()=>{
 const i={question:'显示器可以续借几次？',date:'2026-06-01',snapshot:'baseline'},f={borrowed:'2026-05-20',due:'2026-06-20',used:'0',booking:'no'};
 const r=taskRun(docs,TASKS.find(t=>t.id==='R06'),i,f);assert.equal(r.status,'insufficient');assert.ok(!r.citations.some(c=>c.docId==='TASK-REN'));
 const old=taskRun(docs,TASKS.find(t=>t.id==='R08'),{...i,question:'设备归还地点在哪里？',date:'2026-10-28'},{});
 const revised=taskRun(docs,TASKS.find(t=>t.id==='R08'),{...i,question:'设备归还地点在哪里？',date:'2026-11-02'},{});
 assert.match(old.answer,/一楼/);assert.match(revised.answer,/二楼/);assert.notEqual(old.citations[0].id,revised.citations[0].id);
 assert.equal(taskRun(docs,TASKS.find(t=>t.id==='R12'),{...i,question:'平板电脑能借多久？'},{}).status,'insufficient');
});
test('own backup restores sources atomically but never restores a valid answer',async()=>{
 const {restoreWorkspace,recognizedRules}=await import('../workspace.mjs');const w=own();const r=personalRun(w);w.selected=[r.retrieved[0].id];w.draft='人工草稿';const full=exportWorkspace(w,r,{includeSources:true}),restored=restoreWorkspace(full);
 assert.equal(restored.documents[0].text,w.documents[0].text);assert.equal(restored.draft,w.draft);assert.notEqual(restored.id,w.id);assert.deepEqual(restored.runs,[]);assert.ok(recognizedRules(w.documents[0]).length);
 assert.throws(()=>restoreWorkspace(exportWorkspace(w,r)),/带来源/);full.documents[0].effectiveFrom='bad';assert.throws(()=>restoreWorkspace(full));assert.equal(w.documents[0].effectiveFrom,'2026-01-01');
});

test('unknown-date sources remain searchable beside known newer versions of the same policy',()=>{
 const w=own();w.documents.push({...w.documents[0],id:'USR-UNKNOWN',version:'',effectiveFrom:'',confirmed:false,text:'显示器单次最长借用 99 天。'});w.documents[0].text='显示器单次最长借用 14 天。';const r=personalRun(w);
 assert.equal(r.status,'evidence');assert.ok(r.retrieved.some(c=>c.docId==='USR-UNKNOWN'&&c.applicability==='unconfirmed'&&c.effectiveFrom===null));assert.ok(r.retrieved.some(c=>c.docId==='USR-1'));assert.match(r.gaps.join(' '),/尚未确认/);
});

test('untrusted backup metadata cannot coerce approval or alias a document identity',async()=>{
 const {restoreWorkspace}=await import('../workspace.mjs');const w=own();w.confirmedRules=true;w.documents[0].confirmed='false';assert.throws(()=>personalRun(w),/文档字段无效/);w.documents[0].confirmed=true;w.documents.push({...w.documents[0]});assert.throws(()=>validateWorkspace(w),/编号重复/);w.documents.pop();w.runs=[null];assert.throws(()=>validateWorkspace(w),/旧运行/);
 const original=own(),r=personalRun(original),report=exportWorkspace(original,r,{includeSources:true});report.workspaceState.confirmedRules='false';assert.throws(()=>restoreWorkspace(report));assert.equal(original.confirmedRules,false);
});

test('exports disclose a carried-over draft instead of presenting it as a current supported answer',async()=>{
 const {workspaceMarkdown}=await import('../workspace.mjs');const w=own();w.confirmedRules=true;let r=personalRun(w);w.runs=[r];w.draft='旧借期21天';w.draftSignature=r.signature;w.documents[0].text+=' 设备遗失应在 24 小时内报告设备负责人。';w.revision++;w.question='显示器丢了多久内报告？';r=personalRun(w);
 const report=exportWorkspace(w,r);assert.equal(report.draftNeedsReview,true);assert.equal(report.draftSourceRunId,w.runs[0].id);assert.match(workspaceMarkdown(report),/尚未按本次依据确认/);assert.ok(!JSON.stringify(report).includes('documents'));
 w.draftSignature=r.signature;assert.equal(exportWorkspace(w,r).draftNeedsReview,false);
});

test('two conflicting supported facts within one paragraph are never collapsed to the first match',()=>{
 const w=own();w.confirmedRules=true;w.documents[0].text='显示器单次最长借用14天。\n显示器单次最长借用21天。';const r=personalRun(w);assert.equal(r.status,'conflict');assert.deepEqual(r.facts.map(f=>f.value).sort(),['14天','21天']);assert.match(r.gaps.join(' '),/规定不一致/);
});
