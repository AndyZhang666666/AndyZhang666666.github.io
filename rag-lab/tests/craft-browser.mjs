import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/Users/mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const base=process.env.RAG_URL||'http://127.0.0.1:8868/rag-lab/';
const out=new URL('../evidence/craft-20261112/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome'});const checks=[];
try{for(const width of [1440,1024,390]){
 const page=await browser.newPage({viewport:{width,height:1000},acceptDownloads:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.locator('#result[aria-busy=false]').waitFor();
 if(width===1440){for(const path of ['citation-inspector.mjs','workbench.css','vendor/floating-ui.mjs','vendor/floating-ui.LICENSE.txt'])assert.equal((await page.request.get(base+path)).status(),200);for(const path of ['server/server.mjs','node_modules/@floating-ui/dom/package.json','tests/craft-browser.mjs'])assert.equal((await page.request.get(base+path)).status(),404);}
 assert.equal(await page.locator('[data-question]').count(),6);assert.equal(await page.locator('#scenarioChoices').getAttribute('open'),'');
 await page.screenshot({path:fileURLToPath(new URL(`rag-${width}-initial.png`,out))});
 const citation=page.locator('#citationLinks button').first();await citation.click();await page.locator('#citation-inspector').waitFor();assert.match(await page.locator('#citation-inspector').innerText(),/14/);
 await page.keyboard.press('Escape');assert.equal(await page.locator('#citation-inspector').count(),0);assert.equal(await citation.evaluate(e=>e===document.activeElement),true);
 await citation.click();await page.locator('#date').evaluate(e=>{e.value='2026-06-30';e.dispatchEvent(new Event('change',{bubbles:true}));});assert.equal(await page.locator('#citation-inspector').count(),0);
 await page.locator('#staleRerun').click();assert.equal(await page.locator('#scenarioChoices').getAttribute('open'),null);assert.match(await page.locator('#answerHeadline').innerText(),/30天/);
 await citation.click();await page.locator('#citation-inspector button').last().click();assert.equal(await page.locator('#source-0').evaluate(e=>e===document.activeElement),true);
 await page.locator('#showPersonal').click();assert.equal(await page.locator('#personalGrid').getAttribute('data-empty'),'true');assert.equal(await page.locator('#personalDraft').isVisible(),false);assert.equal(await page.locator('#personalRestoreFile').count(),1);
 await page.locator('.personal-input>details').first().locator('summary').click();await page.locator('#personalTitleInput').fill('虚构测试 · 显示器制度');await page.locator('#personalPaste').fill('显示器单次最长借用21天。\n\n归还请到设备台。');await page.locator('#personalAddText').click();await page.locator('.personal-document').waitFor();assert.equal(await page.locator('#personalGrid').getAttribute('data-empty'),'false');
 await page.locator('#personalQuestion').fill('显示器最长借用多久？');await page.locator('#personalSearch').click();await page.locator('#personalEvidence .source').first().waitFor();
 await page.locator('#personalEvidence input[type=checkbox]').first().check();assert.equal(await page.locator('#personalDraft').inputValue(),'');assert.match(await page.locator('#personalSelectedSummary').innerText(),/1/);assert.match(await page.locator('#personalNotice').innerText(),/尚未加入草稿/);
 await page.getByRole('button',{name:'就地核对原文'}).first().click();assert.match(await page.locator('#citation-inspector').innerText(),/21天/);await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'把这段加入草稿'}).first().click();assert.match(await page.locator('#personalDraft').inputValue(),/21天/);
 await page.locator('#personalDraft').fill('依据当前原文，拟答复21天。');const draft=await page.locator('#personalDraft').inputValue();
 if(width<768){await page.locator('[data-personal-pane=evidence]').click();await page.locator('[data-personal-pane=draft]').click();assert.equal(await page.locator('#personalDraft').inputValue(),draft);}
 const download=page.waitForEvent('download');await page.locator('#personalExport').click();await(await download).saveAs(fileURLToPath(new URL(`rag-${width}-answer.md`,out)));
 if(width<768)await page.locator('[data-personal-pane=input]').click();
 await page.locator('#personalFiles').setInputFiles(fileURLToPath(new URL('fixtures/damaged.pdf',import.meta.url)));await page.waitForFunction(()=>/损坏/.test(document.getElementById('personalNotice').textContent));assert.equal(await page.locator('#personalDraft').inputValue(),draft);assert.equal(await page.locator('.personal-document').count(),1);
 await page.locator('#personalQuestion').fill('另一个问题');assert.equal(await page.locator('#personalExport').isDisabled(),true);
 if(width<768)await page.locator('[data-personal-pane=draft]').click();await page.screenshot({path:fileURLToPath(new URL(`rag-${width}-personal.png`,out))});
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
 checks.push({width,pass:true,scope:'new UI task, citation cleanup, independent adoption/insertion, draft protection, export',paidModelCalls:0});await page.close();
}}finally{await browser.close();await writeFile(new URL('result.json',out),JSON.stringify(checks,null,2));}
console.log(JSON.stringify(checks));
