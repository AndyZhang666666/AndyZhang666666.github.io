// Narrow release smoke: read-only UI checks, no full applications or model calls.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {directions} from '../content/editorial.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.SHOWCASE_BASE_URL||'http://127.0.0.1:8811';
const out=process.env.SHOWCASE_EVIDENCE_DIR||'.taste-skill/new-work-20261029/release-local';
const remote=base.startsWith('https://'),checks=[],errors=[],writes=[];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'}),page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(request.method()!=='GET')writes.push({method:request.method(),url:request.url()});});
 assert.ok((await page.goto(base+'/#selected',{waitUntil:'networkidle'})).ok());await page.locator('[data-agent-check]:not(:disabled)').waitFor();
 const storage=await page.evaluate(()=>JSON.stringify(Object.entries(localStorage).sort()));
 const resources=[];
 for(const path of ['assets/new-work-previews.mjs','assets/demo-showcase.mjs','assets/demo-showcase.css','data.json','content/evidence-zh.json','rag-lab/engine.mjs','rag-lab/public-corpus.json','agent-bench/samples/timeout-hardened.json']){
  const response=await page.request.get(base+'/'+path);assert.ok(response.ok(),path);
  const digest=hash(await response.body());assert.equal(digest,hash(await fs.readFile(path)),path+' must match this checkout');resources.push({path,sha256:digest});
 }
 checks.push('Published assets and data match the reviewed checkout byte-for-byte');
 for(const width of [1280,390]){
  await page.setViewportSize({width,height:width===390?844:900});
  for(const direction of directions){await page.locator('#showcaseDirection').selectOption(direction.id);assert.deepEqual(await page.locator('.showcase-choice:not([hidden])').evaluateAll(nodes=>nodes.map(n=>n.dataset.selectedId)),direction.order);assert.equal(await page.locator('[data-selected-id=trust]').isVisible(),true);assert.equal(await page.locator('.showcase-panel:not([hidden])').count(),1);}
  await page.locator('#showcaseDirection').selectOption('all');
  const reveal=page.locator('[data-agent-check]');if(await reveal.getAttribute('aria-expanded')!=='true')await reveal.click();assert.equal(await page.locator('.execution-final dd').allTextContents().then(values=>values.join(',')),'1,1,open');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await page.locator('#showcaseDirection').selectOption('ai');await page.locator('[data-selected-id=rag]').click();await page.locator('[data-rag-scope=historic]:not(:disabled)').waitFor();
  for(const [scope,days,citation]of [['historic',30,'MON-1:p1'],['revised',10,'MON-3:p1'],['present',14,'MON-2:p1']]){
   const old=await page.locator('[data-rag-answer-text]').innerText();await page.locator('[data-rag-scope="'+scope+'"]').click();assert.equal(await page.locator('[data-rag-answer]').getAttribute('data-stale'),'true');assert.equal(await page.locator('[data-rag-answer-text]').innerText(),old);await page.locator('[data-rag-run]').click();assert.ok((await page.locator('[data-rag-days]').innerText()).startsWith(String(days)));assert.ok((await page.locator('[data-rag-citation]').innerText()).includes(citation));
  }
  await page.locator('[data-rag-evidence] summary').click();assert.ok((await page.locator('[data-rag-quote]').innerText()).includes('14 天'));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await page.locator('#selected').screenshot({path:out+'/rag-'+width+'.png'});
 }
 checks.push('Both widths: four role-specific items, Eval always available, Agent reconciliation and RAG 30/10/14-day retrieval with stale-answer gating');
 await page.setViewportSize({width:1280,height:900});await page.locator('#showcaseDirection').selectOption('ai');await page.locator('[data-selected-id=trust]').focus();await page.keyboard.press('ArrowDown');assert.equal(await page.locator(':focus').getAttribute('data-selected-id'),'rag');await page.keyboard.press('End');assert.equal(await page.locator(':focus').getAttribute('data-selected-id'),'taste');
 assert.equal(await page.evaluate(()=>JSON.stringify(Object.entries(localStorage).sort())),storage);
 assert.deepEqual(writes,[]);checks.push('Keyboard skips hidden items; previews send no writes and change no local storage');
 await page.locator('#jdInput').fill('负责 Agent 工具工作流与 RAG 知识库交付。');await page.locator('#jdRun').click();await page.locator('#jdResult a[href="/cases/execution/"]').first().waitFor();assert.ok(await page.locator('#jdResult a[href="/cases/rag/"]').count());checks.push('Role evidence lookup links to both new project-owned cases');
 assert.equal(await page.locator('[data-project-id]').count(),17);
 for(const [id,route]of [['agent-bench','/agent-bench/'],['rag-lab','/rag-lab/']]){assert.equal(await page.locator('#project-'+id+' [data-link-kind=demo]').getAttribute('href'),route);assert.ok((await page.request.get(base+route)).ok());}
 for(const id of ['execution','rag'])assert.ok((await page.request.get(base+'/cases/'+id+'/')).ok());checks.push('All 17 projects remain, both complete apps and their own case pages are reachable');
 if(remote){for(const path of ['/agent-bench/backend/server.py','/rag-lab/server/server.mjs','/rag-lab/corpus/ADM-RES-1.md'])assert.equal((await page.request.get(base+path)).status(),404,path+' must remain unpublished');checks.push('Local backend and private corpus paths remain excluded from Pages');}
 assert.deepEqual(errors,[]);await fs.writeFile(out+'/report.json',JSON.stringify({passed:true,at:new Date().toISOString(),base,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),checks,resources,errors,writes},null,2)+'\n');console.log('PASS: '+checks.length+' release checks at '+base);
}finally{await browser.close()}
