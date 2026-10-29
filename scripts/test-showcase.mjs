import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {simulateOne} from '../assets/demo-preview/bundle-model.mjs';
import {sharedFixture,bundleArgs,bundleFixture} from '../content/showcase.mjs';
import {previewConditions} from '../suibianju/product.mjs';
import {studies,projects} from '../content/editorial.mjs';
import {createTastePreview,chooseTaste,authorizeTaste,revokeTaste,tasteSummary} from '../assets/demo-preview/taste-session.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');

const base=process.env.SHOWCASE_BASE_URL||'http://127.0.0.1:8811',out='.taste-skill/decisions-20261029/verified';
await fs.mkdir(out,{recursive:true});
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const generated=['index.html','data.json','app.js',...studies.map(s=>`cases/${s.id}/index.html`)];
const previous=await Promise.all(generated.map(file=>fs.readFile(file).then(hash)));
execFileSync(process.execPath,['scripts/update-content.mjs'],{stdio:'pipe'});
assert.deepEqual(await Promise.all(generated.map(file=>fs.readFile(file).then(hash))),previous,'Content generation must be repeatable');
for(const [adoption,expected]of [[.05,-.24],[.5,1.2]])assert.ok(Math.abs(simulateOne({...bundleArgs,adoption}).marginLift-expected)<1e-10);
const shared=sharedFixture(),unchanged=JSON.stringify(shared);
for(const [budget,count]of [[40,0],[85,1],[110,2]])assert.equal(previewConditions(shared,'c',{...shared.members[2].conditions,budget}).after.length,count);
assert.equal(JSON.stringify(shared),unchanged,'Budget previews must not mutate confirmed conditions');
const sample=JSON.parse(await fs.readFile('assets/demo-preview/eval-sample.json'));
assert.equal(sample.text.slice(sample.quoteOffset),sample.dimension.evidence[0]);
for(const project of projects.filter(p=>p.caseId))assert.equal(studies.find(s=>s.id===project.caseId)?.project,project.id,'Every design-process link must belong to its project');
const canonicalTaste=createTastePreview();
assert.deepEqual(Object.keys(canonicalTaste.comparison.variants[0]).filter(k=>canonicalTaste.comparison.variants[0][k]!==canonicalTaste.comparison.variants[1][k]),['typography']);
for(const scope of ['once','current','global']){const authorized=authorizeTaste(chooseTaste(canonicalTaste,'b'),scope);assert.equal(tasteSummary(authorized).once,scope==='once');assert.equal(tasteSummary(revokeTaste(authorized)).rule,null);}
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[],badResponses=[],calls=[],checks=[];
const record=name=>checks.push(name);
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 page.on('request',request=>calls.push(new URL(request.url()).pathname));
 page.on('response',response=>{if(response.url().startsWith(base)&&response.status()>=400)badResponses.push(response.url());});
 await page.goto(base+'/#selected',{waitUntil:'networkidle'});
 await page.locator('[data-eval-locate]:not(:disabled)').waitFor();
 await page.waitForFunction(()=>{const top=document.getElementById('selected').getBoundingClientRect().top;return top>0&&top<150;});
 assert.equal(await page.locator('.project-card').count(),15);
 assert.deepEqual(await page.locator('main>section[id]').evaluateAll(nodes=>nodes.slice(0,3).map(n=>n.id)),['top','about','selected']);
 assert.equal(await page.locator('.section-num,[data-num],.ai-view-num,.principle-num').count(),0);
 assert.equal(await page.locator('.pgroup-main .project-card').count(),9);
 assert.equal(await page.locator('.pgroup-cases .project-card').count(),3);
 assert.equal(await page.locator('.pgroup-poker .project-card').count(),3);
 assert.equal(await page.locator('#projects iframe,.embed-try-btn,.mini-interactive').count(),0);
 assert.ok(!calls.some(path=>/bundle-model|tasteroom\/directions|suibianju\/product/.test(path)),'Other previews must load only on demand');
 record('15 project cards, stable direct selected hash after async content, original poker group, explicit destinations and lazy native previews');
 const storageBefore=await page.evaluate(()=>JSON.stringify(Object.entries(localStorage).sort()));
 await page.locator('[data-eval-locate]').click();
 assert.equal(await page.locator('[data-eval-source-quote] mark').innerText(),sample.dimension.evidence[0]);
 assert.equal(await page.locator('.preview-score strong').innerText(),'2 / 5');
 assert.ok((await page.locator('[data-eval-status]').innerText()).includes('人工判断'));
 assert.equal(await page.locator('.preview-full-source').getAttribute('open'),null,'Long source is collapsed initially');
 await page.locator('[data-eval-review=unsupported]').click();assert.equal(await page.locator('[data-eval-verdict]').innerText(),'评语存疑');assert.equal(await page.locator('.preview-score strong').innerText(),'2 / 5');
 await page.locator('.preview-full-source summary').click();assert.equal(await page.locator('.preview-source-text').innerText(),sample.text);assert.equal(await page.locator('[data-eval-full-quote] mark').count(),1);await page.locator('.preview-full-source summary').click();
 await page.locator('#selected').screenshot({path:out+'/eval-1440.png'});
 await page.locator('[data-eval-locate]').click();assert.equal(await page.locator('[data-eval-source-quote] mark').count(),0);
 await page.locator('[data-eval-clear]').click();assert.equal(await page.locator('[data-eval-verdict]').innerText(),'尚未复核');
 record('Exact source, expandable full text and original comment; independent review and clearing never overwrite the saved score');
 await page.locator('[data-selected-id=taste]').click();await page.locator('[data-taste-direction=deconstructed]:not(:disabled)').waitFor();
 const posterTitle=await page.locator('[data-taste-poster] svg title').first().textContent();
 await page.locator('[data-taste-direction=deconstructed]').click();
 assert.ok((await page.locator('[data-taste-poster] metadata').first().textContent()).includes('deconstructed'));
 assert.equal(await page.locator('[data-taste-poster] svg title').first().textContent(),posterTitle);
 assert.ok((await page.locator('[data-selected-demo=taste]').getAttribute('href')).endsWith('direction=deconstructed'));
 assert.equal(await page.locator('[data-taste-memory]').innerText(),'未授权');
 const pair=await page.locator('[data-taste-poster] metadata').allTextContents();const variants=pair.map(v=>JSON.parse(v).canvas);assert.deepEqual(Object.keys(variants[0]).filter(k=>variants[0][k]!==variants[1][k]),['typography']);
 assert.equal(await page.locator('[data-taste-scope=current]').isDisabled(),true);
 await page.locator('[data-taste-choice=b]').click();assert.equal(await page.locator('[data-taste-memory]').innerText(),'未授权');
 await page.locator('[data-taste-scope=current]').click();assert.ok((await page.locator('[data-taste-memory]').innerText()).includes('工作场景'));
 await page.locator('#selected').screenshot({path:out+'/taste-1440.png'});
 await page.locator('[data-taste-revoke]').click();assert.equal(await page.locator('[data-taste-memory]').innerText(),'未授权');
 await page.locator('[data-taste-scope=once]').click();assert.ok((await page.locator('[data-taste-memory]').innerText()).includes('不形成长期规则'));
 await page.locator('[data-taste-choice=a]').click();assert.equal(await page.locator('[data-taste-memory]').innerText(),'未授权');
 await page.locator('[data-taste-scope=global]').click();assert.ok((await page.locator('[data-taste-memory]').innerText()).includes('全部场景'));
 await page.locator('[data-taste-skip]').click();assert.equal(await page.locator('[data-taste-memory]').innerText(),'未授权');assert.equal(await page.locator('[data-taste-choice][aria-pressed=true]').count(),0);
 record('Canonical one-variable comparison, explicit once/work/global consent, revoke, choice invalidation and skip without persistent memory');
 await page.locator('[data-selected-id=shared-choice]').click();await page.locator('[data-shared-budget="85"]:not(:disabled)').waitFor();
 for(const [budget,count]of [[40,0],[85,1],[110,2]]){await page.locator(`[data-shared-budget="${budget}"]`).click();assert.equal(await page.locator('[data-shared-count]').innerText(),String(count));assert.equal(await page.locator('[data-candidate][data-feasible=true]').count(),count);assert.equal(await page.locator('[data-shared-draft]').innerText(),'¥'+budget);assert.equal(await page.locator('.preview-confirmed-budget strong').innerText(),'¥40');}
 assert.equal(JSON.parse(await page.locator('#sharedPreviewInput').textContent()).members[2].conditions.budget,40);
 assert.ok((await page.locator('[data-shared-status]').innerText()).includes('尚未全员确认'));
 await page.locator('#selected').screenshot({path:out+'/shared-1440.png'});
 record('Budget 40/85/110 yields 0/1/2 options with confirmed conditions and votes untouched');
 await page.locator('[data-selected-id=bundles]').click();await page.locator('[data-bundle-adoption="0.5"]:not(:disabled)').waitFor();
 const c=bundleFixture.candidate,low=simulateOne({...c,adoption:.05}),high=simulateOne({...c,adoption:.5}),money=n=>(n<0?'−':'+')+'¥'+Math.abs(n).toFixed(3);
 assert.equal(await page.locator('[data-bundle-net]').innerText(),money(low.marginLift));
 await page.locator('.preview-discovery summary').click();assert.ok((await page.locator('.preview-discovery-facts').innerText()).includes(String(c.hitCount)));assert.ok((await page.locator('.preview-discovery-facts').innerText()).includes(String(c.matchedCount)));
 await page.locator('[data-bundle-adoption="0.5"]').click();
 assert.equal(await page.locator('[data-bundle-net]').innerText(),money(high.marginLift));assert.equal(await page.locator('[data-bundle-added]').innerText(),money(high.addedMargin));
 assert.equal(await page.locator('[data-bundle-loss]').innerText(),'−¥'+high.existingLoss.toFixed(3));
 await page.locator('[data-bundle-plan] summary').click();assert.ok((await page.locator('[data-bundle-plan-result]').innerText()).includes(money(high.marginLift)));
 await page.locator('#selected').screenshot({path:out+'/bundle-1440.png'});
 assert.equal(await page.evaluate(()=>JSON.stringify(Object.entries(localStorage).sort())),storageBefore,'Short interactions must not change durable visitor state');
 assert.ok(!calls.some(path=>path.startsWith('/api/')));
 record('Pinned mined candidate flows to the canonical ledger and current test plan; all four previews write no storage and call no model');
 const orders={all:['trust','taste','shared-choice','bundles'],ai:['trust','shared-choice','taste','bundles'],life:['taste','shared-choice','trust','bundles'],growth:['bundles','trust','shared-choice','taste']};
 for(const [direction,order]of Object.entries(orders)){await page.locator('#showcaseDirection').selectOption(direction);assert.deepEqual(await page.locator('.showcase-choice').evaluateAll(nodes=>nodes.map(n=>n.dataset.selectedId)),order);assert.equal(await page.locator('.showcase-choice[aria-selected=true]').getAttribute('data-selected-id'),order[0]);}
 await page.locator('#showcaseDirection').selectOption('all');await page.locator('[data-selected-id=trust]').focus();await page.keyboard.press('ArrowDown');assert.equal(await page.locator(':focus').getAttribute('data-selected-id'),'taste');await page.keyboard.press('End');assert.equal(await page.locator(':focus').getAttribute('data-selected-id'),'bundles');
 record('Four role orders, default active item and keyboard roving selection');
 const data=JSON.parse(await fs.readFile('data.json'));
 for(const id of ['filing','growth','pricing','fde']){const project=data.projects.find(p=>p.id===id),s=studies.find(s=>s.project===id);assert.equal(project.iterationUrl,`/cases/${s.id}/`);const html=await (await page.request.get(base+project.iterationUrl)).text();if(id!=='fde')assert.ok(html.includes(`href="${project.url}"`));assert.ok(html.includes(s.title.zh));}
 assert.equal(await page.locator('.ai-view-practice').count(),4);assert.equal(await page.locator('.ai-view-ref').count(),4,'No duplicate external references');
 record('Eight project-owned case pages, four opinion-to-practice links and public Agent/FDE workflow evidence without fabricated production traces');
 for(const project of data.projects){
  const card=page.locator(`[data-project-id="${project.id}"]`);
  if(project.url){assert.equal(await card.locator('[data-link-kind=demo]').getAttribute('href'),project.url);assert.equal(await card.locator('[data-link-kind=demo]').getAttribute('target'),'_blank');}
  else assert.equal(await card.locator('[data-link-kind=demo]').count(),0);
  if(project.url?.startsWith('/'))assert.ok((await page.request.get(base+project.url)).ok(),project.id+' must open the actual app');
  if(project.presentation.image){for(const path of [project.presentation.image,project.presentation.thumbnail])assert.ok((await page.request.get(base+path)).ok(),path);}
 }
 record('Nine internal apps, external quiz label, case-only entries and all real image resources');
 const imageLink=page.locator('#project-taste [data-preview-image]');await imageLink.click();await page.locator('dialog[open] img').waitFor();await page.waitForFunction(()=>document.querySelector('dialog img').naturalWidth>0);
 await page.keyboard.press('Escape');assert.equal(await page.locator('dialog[open]').count(),0);assert.ok(await imageLink.evaluate(el=>el===document.activeElement));
 await page.locator('#project-eval').hover();await page.locator('#project-eval').screenshot({path:out+'/library-card-1440.png'});
 record('Native image enlargement, Escape dismissal and focus return');
 await page.setViewportSize({width:1280,height:720});
 for(const id of ['trust','taste','shared-choice','bundles']){
  await page.locator(`[data-selected-id="${id}"]`).click();
  await page.locator('nav a[href="#selected"]').click();
  await page.waitForFunction(()=>{const button=document.querySelector('.showcase-panel:not([hidden]) [data-selected-demo]'),r=button.getBoundingClientRect();return r.top>=60&&r.bottom<innerHeight;});
 }
 record('Full-demo action is above the fold after the actual navigation click at 1280×720 for all four previews');
 await page.locator('[data-selected-id=taste]').click();await page.locator('[data-taste-choice=a]').press('Enter');await page.locator('[data-taste-scope=current]').press('Enter');assert.ok((await page.locator('[data-taste-memory]').innerText()).includes('工作场景'));await page.locator('[data-taste-revoke]').press('Enter');assert.equal(await page.locator('[data-taste-memory]').innerText(),'未授权');
 record('Keyboard selection, explicit scope and withdrawal work in the new preference flow');
 const metrics=[];
 for(const width of [1440,768,390]){
  await page.setViewportSize({width,height:width===390?844:1000});
  for(const palette of ['frost','copper','mist','indigo']){
   await page.evaluate(p=>document.documentElement.dataset.palette=p,palette);
   for(const id of ['trust','taste','shared-choice','bundles']){await page.locator(`[data-selected-id="${id}"]`).click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`${width}/${palette}/${id}: overflow`);}
   metrics.push({width,palette,previews:4,noOverflow:true});
   if(width===1440){await page.locator('[data-selected-id=trust]').click();await page.locator('#selected').screenshot({path:out+`/theme-${palette}-1440.png`});}
  }
  await page.evaluate(()=>document.documentElement.dataset.palette='frost');
  await page.locator('[data-selected-id=taste]').click();await page.locator('#selected').screenshot({path:out+`/taste-${width}.png`});
  if(width===390){await page.locator('[data-selected-id=shared-choice]').click();await page.locator('#selected').screenshot({path:out+'/shared-390.png'});await page.locator('#project-taste').screenshot({path:out+'/library-card-390.png'});}
 }
 await page.locator('#langToggle').click();assert.equal(await page.locator('#selectedTitle').innerText(),'Try a decision. See the design.');await page.locator('[data-selected-id=bundles]').click();await page.locator('[data-bundle-adoption="0.05"]').click();assert.ok((await page.locator('[data-bundle-status]').innerText()).includes('per covered order'));
 record('Three widths × four themes × four previews, English controls and reduced motion');
 for(const width of [1280,768,390]){
  await page.setViewportSize({width,height:900});
  for(const study of studies){await page.goto(base+`/cases/${study.id}/`,{waitUntil:'networkidle'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`case overflow: ${study.id}/${width}`);assert.equal(await page.locator('a[href="undefined"],a[href="null"]').count(),0);assert.equal(await page.locator('h1').innerText(),study.title.zh);assert.ok(await page.locator('h1').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))>await page.locator('.case-summary').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)));}
 }
 record('All eight reading pages at desktop/tablet/phone; correct headline hierarchy, project-specific copy, no undefined destinations or overflow');
 const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}}),fallback=await nojs.newPage();await fallback.goto(base+'/#selected');assert.equal(await fallback.locator('[data-selected-id][href]').count(),4);assert.equal(await fallback.locator('[data-project-id]').count(),15);assert.ok(await fallback.locator('#selectedTitle').isVisible());assert.equal(await fallback.locator('#project-poker-quiz').evaluate(el=>getComputedStyle(el).opacity),'1');await nojs.close();
 record('No-JavaScript static selected links and all fifteen cards');
 const failure=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});await failure.route('**/bundle-model.mjs',route=>route.abort());await failure.route('**/taste-crop.jpg',route=>route.abort());await failure.route('**/taste.jpg',route=>route.abort());
 const broken=await failure.newPage();await broken.goto(base+'/#selected',{waitUntil:'networkidle'});await broken.locator('[data-selected-id=bundles]').click();await broken.locator('[data-bundle-status]').filter({hasText:'暂时不可用'}).waitFor();assert.equal(await broken.locator('[data-selected-demo=bundle]').getAttribute('href'),'/bundle-lab/');
 await broken.locator('#project-taste').scrollIntoViewIfNeeded();await broken.locator('#project-taste .preview-image-failed').waitFor();await broken.locator('#project-taste [data-preview-image]').click();await broken.locator('.project-image-error:not([hidden])').waitFor();await broken.keyboard.press('Escape');await failure.close();
 record('Blocked enhancement and missing thumbnails/full images retain real destinations and recoverable messages');
 await page.goto(base+'/review.html?section=selected',{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('#localFrame').getAttribute('src'),'/#selected');
 assert.equal(await page.locator('#liveFrame').getAttribute('src'),'https://andyzhang666666.github.io/#selected');
 record('Existing comparison page points to this master and the actual public site');
 assert.deepEqual(errors,[]);assert.deepEqual(badResponses,[]);
 await fs.writeFile(out+'/report.json',JSON.stringify({passed:true,at:new Date().toISOString(),checks,layoutChecks:metrics,consoleErrors:errors,failedLocalResponses:badResponses},null,2));
 console.log(`PASS: ${checks.length} focused showcase checks; 48 preview/theme/width combinations; no console errors or failed local resources.`);
}finally{await browser.close()}
