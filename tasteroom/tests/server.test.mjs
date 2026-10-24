import test from 'node:test';import assert from 'node:assert/strict';
process.env.NODE_ENV='test';const {server}=await import('../server.mjs');await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
test('server serves app, reports mock and rejects credentials/source leakage',async()=>{assert.equal((await fetch(base)).status,200);assert.equal((await(await fetch(base+'/api/config')).json()).mode,'mock');assert.equal((await fetch(base+'/api/feedback',{method:'POST'})).status,503);assert.equal((await fetch(base+'/.env')).status,404);assert.equal((await fetch(base+'/server.mjs')).status,404);assert.equal((await fetch(base+'/tests/engine.test.mjs')).status,404);});
test.after(()=>new Promise(r=>server.close(r)));
