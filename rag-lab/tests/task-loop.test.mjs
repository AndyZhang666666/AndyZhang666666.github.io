import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {numberUnits,checkDraftGrounding,citationCautions,scopeDiff,scopeBaseline} from '../task-loop.mjs';
import {newWorkspace,personalRun,exportWorkspace,workspaceMarkdown} from '../workspace.mjs';
import {retrieveRun} from '../engine.mjs';
import {loadCorpus} from '../server/corpus.mjs';
import {createApp} from '../server/server.mjs';

const citation=(id,text,extra={})=>({id,title:'虚构设备规则',text,quote:text,version:'1',effectiveFrom:'2026-01-01',...extra});
const quote=citation('q1','显示器单次最长借用 21 天；费用 １２０．５０ 元，续借 1 次，备用 2 台，报告时限 24 小时。');

test('draft grounding: explicit empty draft and no chosen quotes, without implicit support',()=>{
 assert.equal(checkDraftGrounding('',[quote]).status,'empty-draft');
 assert.equal(checkDraftGrounding('  ',[]).status,'empty-draft');
 const r=checkDraftGrounding('可借21天',[]);assert.equal(r.status,'no-citations');assert.deepEqual(r.unsupported.map(n=>n.token),['21天']);
 assert.equal(checkDraftGrounding('未填写数字',[]).status,'no-citations');
});
test('draft grounding: full width, whitespace, exact decimal normalization and large numbers',()=>{
 assert.deepEqual(numberUnits('２１\u3000天 00120.500 元 1 次 ２台 24\n小时').map(n=>n.token),['21天','120.5元','1次','2台','24小时']);
 assert.equal(checkDraftGrounding('21天，120.5元，１次，2 台，２４小时',[quote]).status,'lexical-match');
 assert.equal(checkDraftGrounding('9007199254740993元',[citation('large','9007199254740992元')]).status,'unsupported');
 assert.equal(checkDraftGrounding('12.51元',[quote]).status,'unsupported');
 assert.equal(checkDraftGrounding('2 1天',[quote]).status,'unsupported');
});
test('draft grounding: warn per occurrence, quote-only matching, selected references and stale recomputation',()=>{
 const full={...citation('s','原文21天，另有30天'),quote:'原文21天'};
 assert.deepEqual(checkDraftGrounding('21天、30天、30天',[full]).unsupported.map(n=>n.token),['30天','30天']);
 assert.equal(checkDraftGrounding('30天',[citation('other','30天')]).status,'lexical-match');
 assert.equal(checkDraftGrounding('21天',[quote],{stale:true}).status,'stale');
 assert.match(checkDraftGrounding('21天',[quote]).note,/不代表语义正确/);
});
test('citation caution: shared units and unrelated topics, facets, entities remain separate',()=>{
 assert.deepEqual(citationCautions([citation('a','显示器单次最长借用 14 天'),citation('b','无人机单次最长借用 7 天')]),[]);
 assert.deepEqual(citationCautions([citation('a','运费20元'),citation('b','押金30元')]),[]);
 assert.deepEqual(citationCautions([citation('a','A区显示器单次最长借用 14 天'),citation('b','B区显示器单次最长借用 7 天')]),[]);
 assert.deepEqual(citationCautions([citation('a','显示器单次最长借用 14 天',{title:'A区设备规则'}),citation('b','显示器单次最长借用 7 天',{title:'B区设备规则'})]),[]);
 assert.deepEqual(citationCautions([citation('a','显示器单次最长借用 14 天'),citation('b','显示器最多续借 1 次')]),[]);
});
test('citation caution: same supported topic values and effective intervals advise without adjudicating',()=>{
 const a=citation('a','显示器单次最长借用 14 天');
 const b=citation('b','显示器单次最长借用 21 天');
 const values=citationCautions([a,b]);assert.equal(values.length,1);assert.match(values[0].message,/不判定哪条优先/);assert.deepEqual(values[0].citationIds,['a','b']);
 const intervals=citationCautions([a,{...a,id:'c',effectiveFrom:'2026-07-01'}]);assert.equal(intervals.length,1);assert.match(intervals[0].message,/生效期间不同/);
 assert.deepEqual(citationCautions([a,{...a,id:'c'}]),[]);
 assert.equal(citationCautions([citation('same','显示器单次最长借用 14 天；显示器单次最长借用 21 天')]).length,1);
 assert.deepEqual(citationCautions([citation('a','显示器单次最长借用 ０１．５０ 天'),citation('b','显示器单次最长借用 1.5天')]),[]);
 assert.equal(citationCautions([citation('a','显示器单次最长借用 1.5 天'),citation('b','显示器单次最长借用 2.5 天')]).length,1);
});
const docs=await loadCorpus();
const input={question:'显示器最长能借多久？',date:'2026-10-28',snapshot:'baseline',generation:'extractive'};
const run=(patch={},role='employee')=>retrieveRun(docs,{...input,...patch},role,'original-example');
test('scope diff: actual retrieval rerun explains date, evidence version and result changes',()=>{
 const prior=run();const next=run({date:'2026-06-30'});const d=scopeDiff(prior,next);
 assert.deepEqual(d.changes,['date']);assert.equal(d.evidenceChanged,true);assert.equal(d.resultChanged,true);
 assert.match(d.message,/2026-10-28.*2026-06-30/);assert.match(d.message,/MON-2:p1/);assert.match(d.message,/MON-1:p1/);assert.match(d.message,/14\s?天/);assert.match(d.message,/30\s?天/);
 const snapshot=scopeDiff(prior,run({snapshot:'revised'}));assert.deepEqual(snapshot.changes,['snapshot']);assert.equal(snapshot.evidenceChanged,true);
 assert.equal('retrieved' in d,false);assert.equal('answer' in d.previous,false);
});
test('scope diff: no diff for unchanged conditions, new question, task facts, mode, failed run or unrelated predecessor',()=>{
 const a=run();assert.equal(scopeDiff(a,run()),null);
 assert.equal(scopeDiff(a,run({question:'无人机最长能借多久？',date:'2026-06-30'})),null);
 assert.equal(scopeDiff({...a,taskId:'R01'},{...run({date:'2026-06-30'}),taskId:'R02'}),null);
 assert.equal(scopeDiff({...a,taskFacts:{used:'0'}},{...run({date:'2026-06-30'}),taskFacts:{used:'1'}}),null);
 assert.equal(scopeDiff(a,{...run({date:'2026-06-30'}),mode:'local-extractive'}),null);
 assert.equal(scopeDiff(a,{...run({date:'2026-06-30'}),generation:'model'}),null);
 assert.equal(scopeDiff({...a,status:'failed'},run({date:'2026-06-30'})),null);
 assert.equal(scopeDiff(null,a),null);
});
test('scope diff: permission change never serializes historical evidence, answer or draft',()=>{
 const admin={...run({},'admin'),answer:'SECRET_ANSWER_987元',facts:[{value:'SECRET_FACT'}],userDraft:'SECRET_DRAFT',citations:[citation('SECRET_ID','SECRET_QUOTE',{title:'SECRET_TITLE',version:'SECRET_VERSION'})]};
 const employee=run({date:'2026-06-30'});const d=scopeDiff(admin,employee);
 assert.equal(d.previousRedacted,true);assert.equal(d.evidenceChanged,null);assert.doesNotMatch(JSON.stringify(d),/SECRET_/);
 const safe=scopeBaseline(admin);assert.doesNotMatch(JSON.stringify(safe),/SECRET_/);assert.doesNotMatch(JSON.stringify(scopeDiff(safe,employee)),/SECRET_/);
 // A credential transition can also redact a previous result even when the role label stays the same.
 assert.equal(scopeDiff(safe,{...employee,role:'admin'}).previousRedacted,true);
});
test('workspace integration: warning survives export and never blocks an editable unsupported draft',()=>{
 const w=newWorkspace();w.question=input.question;w.documents=[{id:'U1',title:'测试规则',text:'显示器单次最长借用 21 天。',confirmed:false,version:'',policy:'',effectiveFrom:'',effectiveTo:'',bytes:60}];
 const r=personalRun(w);w.selected=[r.retrieved[0].id];w.draft='我拟答复为12天';
 const report=exportWorkspace(w,r);assert.equal(report.answerDraft,w.draft);assert.equal(report.groundingCheck.status,'unsupported');assert.match(workspaceMarkdown(report),/12天.*未在所选引文/);
 w.draft='21天';assert.equal(exportWorkspace(w,r).groundingCheck.status,'lexical-match');
 w.selected=[];assert.equal(exportWorkspace(w,r).groundingCheck.status,'no-citations');
});
test('new module is explicitly public in both hosts, while private resources stay denied',async()=>{
 const preview=await readFile(new URL('../../scripts/preview.mjs',import.meta.url),'utf8');assert.match(preview,/ragFiles=new Set\([^\n]*'task-loop\.mjs'/);
 const server=await createApp({model:null,adminToken:'synthetic-credential-long-enough'});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{const base=`http://127.0.0.1:${server.address().port}/rag-lab/`;assert.equal((await fetch(base+'task-loop.mjs')).status,200);for(const path of ['server/server.mjs','tests/task-loop.test.mjs','evidence/task-loop-20261111/baseline-node-tests.txt','corpus/ADM-RES-1.md'])assert.equal((await fetch(base+path)).status,404);}
 finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
