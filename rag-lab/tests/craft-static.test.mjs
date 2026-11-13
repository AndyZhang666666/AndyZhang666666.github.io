import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../server/server.mjs';

test('citation assets are served explicitly without widening private directories',async()=>{
 const server=await createApp({model:null,adminToken:'fictional-ui-boundary-test'});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}/rag-lab/`;
 try{
  for(const [path,type]of [['citation-inspector.mjs','text/javascript'],['workbench.css','text/css'],['vendor/floating-ui.mjs','text/javascript'],['vendor/floating-ui.LICENSE.txt','text/plain']]){
   const response=await fetch(base+path);assert.equal(response.status,200,path);assert.ok(response.headers.get('content-type').startsWith(type));assert.ok((await response.text()).length>20);
  }
  for(const path of ['server/server.mjs','tests/craft-static.test.mjs','node_modules/@floating-ui/dom/package.json','vendor/../../server/server.mjs'])assert.equal((await fetch(base+path)).status,404,path);
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
