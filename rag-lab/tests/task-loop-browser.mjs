// Synthetic local Chrome checks. Never invokes a model or sends files off-origin.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/Users/mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const base=process.env.RAG_URL||'http://127.0.0.1:8877/rag-lab/';
const out=new URL('../evidence/task-loop-20261111/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome'}),checks=[];
const open=async(page,selector)=>{const locator=page.locator(selector);if(await locator.evaluate(e=>!e.open))await locator.locator(':scope > summary').click();};
async function download(page,id,name){const ready=page.waitForEvent('download');await page.locator(id).click();const path=new URL(name,out).pathname;await(await ready).saveAs(path);return readFile(path,'utf8');}
try {for(const width of [1280,768,390]){
 const context=await browser.newContext({viewport:{width,height:1000},acceptDownloads:true,reducedMotion:'reduce'});
 const page=await context.newPage(),errors=[],external=[];page.on('pageerror',error=>errors.push(error.message));page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(new URL(base).origin))external.push(r.url());});
 await page.goto(base);await page.locator('#result[aria-busy="false"]').waitFor();
 const initialHeadlineY=(await page.locator('#answerHeadline').boundingBox()).y;if(width===390){assert.ok(initialHeadlineY<850);for(const b of await page.locator('[data-question]').all()){assert.equal(await b.isVisible(),true);assert.ok((await b.boundingBox()).height>=44);}assert.equal(await page.locator('#question').evaluate(e=>getComputedStyle(e).fontSize),'16px');}
 await open(page,'#conditionSettings');await page.locator('#date').fill('2026-06-30');await page.locator('#staleRerun').click();await page.locator('#scopeDiff:not([hidden])').waitFor();
 assert.match(await page.locator('#scopeDiff').innerText(),/MON-2:p1.*MON-1:p1/);assert.match(await page.locator('#scopeDiff').innerText(),/结果已变化/);
 await page.screenshot({path:new URL(`rag-${width}-scope.png`,out).pathname,fullPage:true});
 await page.locator('#runButton').click();await page.locator('#result[aria-busy="false"]').waitFor();assert.equal(await page.locator('#scopeDiff').isHidden(),true);
 await page.locator('#question').fill('无人机最长能借多久？');await page.locator('#runButton').click();await page.locator('#result[aria-busy="false"]').waitFor();assert.equal(await page.locator('#scopeDiff').isHidden(),true);
 // Real local API admin result, downgrade, then verify all DOM and exported surfaces.
 await open(page,'#runtimeSettings');await page.locator('#runtime').selectOption('api');await page.locator('#role').selectOption('admin');await page.locator('#adminCredential').fill('synthetic-task-loop-admin-20261111');await page.locator('#question').fill('应急备用机有多少台？');await page.locator('#date').fill('2026-10-28');await page.locator('#runButton').click();await page.locator('#answerText').filter({hasText:'6 台'}).waitFor();
 await open(page,'.answer-draft');await page.locator('#exampleDraft').fill('管理草稿保留MARKER');
 await page.locator('#role').selectOption('employee');
 const denied=await page.locator('body').evaluate(e=>e.outerHTML);assert.doesNotMatch(denied,/ADM-RES|QY-RESERVE-ORCHID|6\s*台|管理草稿保留MARKER/);assert.equal(await page.locator('#exportButton').isDisabled(),true);
 await page.locator('#runButton').click();await page.locator('#result[aria-busy="false"]').waitFor();
 assert.match(await page.locator('#scopeDiff').innerText(),/旧答复及旧引文已清除/);assert.doesNotMatch(await page.locator('body').evaluate(e=>e.outerHTML),/ADM-RES|QY-RESERVE-ORCHID|6\s*台|管理草稿保留MARKER/);
 const employeeExport=await download(page,'#exportButton',`rag-${width}-employee.json`);assert.doesNotMatch(employeeExport,/ADM-RES|QY-RESERVE-ORCHID|6\s*台|管理草稿保留MARKER/);
 const employeeDraft=await download(page,'#downloadExampleAnswer',`rag-${width}-employee.md`);assert.doesNotMatch(employeeDraft,/ADM-RES|QY-RESERVE-ORCHID|6\s*台|管理草稿保留MARKER/);
 await page.screenshot({path:new URL(`rag-${width}-permission.png`,out).pathname,fullPage:true});
 // Re-authentication recovers the allowed in-memory history and its edited draft.
 await page.locator('#role').selectOption('admin');await page.locator('#adminCredential').fill('synthetic-task-loop-admin-20261111');await page.locator('#runButton').click();await page.locator('#answerText').filter({hasText:'6 台'}).waitFor();
 assert.ok(await page.locator('#historyList button').count()>=2);await page.locator('#historyList button').nth(1).click();assert.equal(await page.locator('#exampleDraft').inputValue(),'管理草稿保留MARKER');
 await page.locator('#showPersonal').click();
 assert.equal(await page.locator('#personalGrounding').getAttribute('data-status'),'empty-draft');
 await page.locator('#personalFiles').setInputFiles([{name:'synthetic-rule.txt',mimeType:'text/plain',buffer:Buffer.from('显示器单次最长借用 14 天。\n\n显示器最多续借1次。')},{name:'chinese-monitor.pdf',mimeType:'application/pdf',buffer:await readFile(new URL('./fixtures/chinese-monitor.pdf',import.meta.url))}]);
 await page.waitForFunction(()=>document.querySelectorAll('.personal-document').length===2);
 await page.locator('#personalQuestion').fill('显示器最长能借多久？');await page.locator('#personalSearch').click();await page.locator('#personalEvidence .source').first().waitFor();
 const sourceChecks=page.locator('#personalEvidence input[type=checkbox]');for(let i=0;i<await sourceChecks.count();i++)await sourceChecks.nth(i).check();
 await page.locator('#personalDraft').fill('拟答复：借12天，最多续借2次。');
 assert.match(await page.locator('#personalGrounding').innerText(),/12天.*未在当前所选引文/);assert.match(await page.locator('#personalGrounding').innerText(),/2次.*未在当前所选引文/);assert.match(await page.locator('#personalCitationCaution').innerText(),/数值或规定不同/);
 assert.equal(await page.locator('#personalExport').isEnabled(),true);const warningExport=await download(page,'#personalExport',`rag-${width}-warning-answer.md`);assert.match(warningExport,/12天/);assert.match(warningExport,/12天.*未在所选引文/);
 await page.locator('#personalDraft').fill('显示器可借２１　天，仍需核对适用范围。');assert.equal(await page.locator('#personalGrounding').getAttribute('data-status'),'lexical-match');
 assert.match(await page.locator('#personalGrounding').innerText(),/不代表语义正确/);
 // Keyboard changes selected evidence, and check updates immediately.
 for(let i=0;i<await sourceChecks.count();i++)await sourceChecks.nth(i).uncheck();
 await sourceChecks.first().focus();await page.keyboard.press('Space');assert.equal(await sourceChecks.first().isChecked(),true);
 for(let i=0;i<await sourceChecks.count();i++)await sourceChecks.nth(i).uncheck();assert.equal(await page.locator('#personalGrounding').getAttribute('data-status'),'no-citations');
 for(let i=0;i<await sourceChecks.count();i++)await sourceChecks.nth(i).check();
 await page.locator('#personalDraft').fill('拟答复可借12天。');await page.locator('#personalDraft').scrollIntoViewIfNeeded();
 await page.screenshot({path:new URL(`rag-${width}-grounding.png`,out).pathname});
 await page.locator('.personal-document input[type=text]').first().fill('同一显示器制度');await page.locator('.personal-document button').filter({hasText:'确认这份资料的信息'}).first().click();assert.equal(await page.locator('#personalGrounding').getAttribute('data-status'),'stale');await page.locator('#personalSearch').click();
 await page.locator('#personalDate').fill('2026-06-30');assert.equal(await page.locator('#personalGrounding').getAttribute('data-status'),'stale');assert.equal(await page.locator('#personalDraft').isEditable(),true);
 await page.locator('#personalSearch').click();assert.equal(await page.locator('#personalGrounding').getAttribute('data-status'),'unsupported');
 await page.locator('#personalDraft').fill('');assert.equal(await page.locator('#personalGrounding').getAttribute('data-status'),'empty-draft');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 const health=await(await page.request.get(new URL('/api/health',base).href)).json();assert.equal(health.modelConfigured,false);
 checks.push({width,pass:true,initialHeadlineY,realTxtAndChinesePdfImport:true,quoteSelection:true,perTokenWarnings:true,nonblockingExport:true,fullwidthNormalization:true,liveCitationKeyboardChange:true,staleRecompute:true,sourceMetadataRecompute:true,scopeDateDiff:true,noChangeAndNewQuestionNoDiff:true,permissionDowngradeDomAndExportsRedacted:true,authorizedHistoryAndDraftPreserved:true,reducedMotion:true,horizontalOverflow:false,pageErrors:errors,externalRequests:external.length,modelCalls:0});await context.close();
 }}finally{await browser.close();await writeFile(new URL('browser-result.json',out),JSON.stringify(checks,null,2));}
console.log(JSON.stringify(checks));
