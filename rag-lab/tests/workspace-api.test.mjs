import test from 'node:test';import assert from'node:assert/strict';import{createApp}from'../server/server.mjs';
test('personal API is session-owned and no-model; static PDF dependency and capabilities are available',async()=>{
 let paidCalls=0;const s=await createApp({model:null,fetchImpl:()=>{paidCalls++;throw Error('unexpected model call');}});await new Promise(r=>s.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+s.address().port;
 const call=async(path,token,body,method)=>{const r=await fetch(base+path,{method:method||(body?'POST':'GET'),headers:{...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});return{status:r.status,data:await r.json()};};
 try{
  const cap=await call('/api/capabilities');assert.equal(cap.data.modelEnabled,false);
  const t=(await call('/api/session',null,{})).data.token,u=(await call('/api/session',null,{})).data.token;
  const id=(await call('/api/workspaces',t,{})).data.workspace.id;
  assert.equal((await call('/api/workspaces/'+id+'/documents',u,{title:'x',text:'private'})).status,404);
  assert.equal((await call('/api/workspaces/'+id+'/documents',t,{title:'自己的规则',text:'显示器单次最长借用 21 天。',policy:'loan',version:'1',effectiveFrom:'2026-01-01',confirmed:true})).status,201);
  const r=await call('/api/workspaces/'+id+'/run',t,{question:'显示器最长能借多久？',date:'2026-10-28',confirmedRules:true});assert.equal(r.status,200);assert.match(r.data.run.answer,/21 天/);
  assert.equal((await call('/api/workspaces/'+id+'/export',u)).status,404);
  const saved=await call('/api/workspaces/'+id+'/draft',t,{runId:r.data.run.id,draft:'用户整理的答复',notes:'待确认',selected:[r.data.run.retrieved[0].id]},'PUT');assert.equal(saved.status,200);
  const exported=await call('/api/workspaces/'+id+'/export',t);assert.equal(exported.status,200);assert.equal(exported.data.answerDraft,'用户整理的答复');assert.equal(exported.data.evidence.length,1);
  assert.equal((await call('/api/workspaces/'+id+'/draft',t,{runId:r.data.run.id,draft:'x',notes:'',selected:['ADM-FAKE:p1']},'PUT')).status,400);
  assert.equal((await call('/api/workspaces/'+id+'/run',t,{question:'x',date:'2026-10-28',generation:'model'})).status,503);
  const asset=await fetch(base+'/rag-lab/vendor/pdf.mjs');assert.equal(asset.status,200);
  assert.equal((await fetch(base+'/rag-lab/corpus/ADM-RES-1.md')).status,404);
  assert.equal(paidCalls,0);
 }finally{s.closeAllConnections();await new Promise(r=>s.close(r));}
});

test('versioned task endpoint uses session scope and current facts; no model or client role elevation',async()=>{
 const s=await createApp({model:null});await new Promise(r=>s.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+s.address().port;
 const session=await fetch(base+'/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}).then(r=>r.json());
 const call=body=>fetch(base+'/api/tasks/run',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.token},body:JSON.stringify(body)});
 try{const input={taskId:'R06',question:'显示器可以续借几次？',date:'2026-10-28',snapshot:'baseline',generation:'extractive',facts:{borrowed:'2026-10-20',due:'2026-11-01',used:'0',booking:'no'}};
 let response=await call(input);assert.equal(response.status,200);let run=(await response.json()).run;assert.equal(run.status,'answered');assert.equal(run.role,'employee');assert.ok(run.citations.some(c=>c.docId==='TASK-REN'));
 response=await call({...input,facts:{...input.facts,booking:'yes'}});assert.equal((await response.json()).run.status,'insufficient');
 assert.equal((await call({...input,role:'admin'})).status,400);assert.equal((await call({...input,generation:'model'})).status,503);
 run=(await (await call({...input,taskId:'R10',question:'应急备用机有多少台？',facts:{}})).json()).run;assert.equal(run.role,'employee');assert.equal(run.status,'insufficient');assert.ok(!JSON.stringify(run).includes('ADM-'));
 }finally{s.closeAllConnections();await new Promise(r=>s.close(r));}
});

test('configured-but-disabled model never reaches an upstream endpoint',async()=>{
 let calls=0;const s=await createApp({model:{url:'http://127.0.0.1/responses',name:'synthetic-config-only',key:'synthetic-key'},enableModel:false,fetchImpl:()=>{calls++;throw Error('must not call');}});await new Promise(r=>s.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+s.address().port;
 try{const t=await fetch(base+'/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}).then(r=>r.json());const r=await fetch(base+'/api/run',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+t.token},body:JSON.stringify({question:'显示器最长能借多久？',date:'2026-10-28',snapshot:'baseline',generation:'model'})});const b=await r.json();assert.equal(r.status,503);assert.equal(b.error.code,'model_disabled');assert.equal(b.run.status,'failed');assert.ok(b.run.retrieved.length);assert.equal(calls,0);}finally{s.closeAllConnections();await new Promise(r=>s.close(r));}
});
