import assert from 'node:assert/strict';import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import {directions} from '../content/editorial.mjs';
const base=process.env.SHOWCASE_BASE_URL||'http://127.0.0.1:8820',out=process.env.SHOWCASE_EVIDENCE_DIR||'.taste-skill/four-selected-20261031',checks=[],errors=[],writes=[];
await fs.mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome',headless:true});
try{
 const c=await b.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),p=await c.newPage(),calls=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{calls.push(new URL(r.url()).pathname);if(r.method()!=='GET')writes.push(r.url());});
 await p.goto(base+'/#selected',{waitUntil:'networkidle'});await p.locator('[data-eval-locate]:not(:disabled)').waitFor();
 const storage=await p.evaluate(()=>JSON.stringify(Object.entries(localStorage).sort()));
 assert.equal(await p.locator('[data-project-id]').count(),17);
 assert.deepEqual(await p.locator('main>section[id]').evaluateAll(xs=>xs.slice(0,3).map(x=>x.id)),['top','about','selected']);
 assert.ok(!calls.some(path=>/tasteroom\/(directions|app)|bundle-model|commute-compare\/_next|llm-output-eval\/_next/.test(path)));
 await p.locator('[data-eval-locate]').click();assert.equal(await p.locator('[data-eval-source-quote] mark').count(),1);
 await p.locator('[data-eval-review=unsupported]').click();assert.ok((await p.locator('.preview-score strong').innerText()).includes('2'));
 await p.locator('[data-selected-id=taste]').click();await p.locator('[data-taste-direction=deconstructed]:not(:disabled)').click();
 assert.ok((await p.locator('[data-taste-canvas] metadata').textContent()).includes('deconstructed'));
 assert.equal(await p.locator('[data-selected-demo=taste]').getAttribute('href'),'/tasteroom/?direction=deconstructed');
 await p.locator('[data-selected-id=bundles]').click();await p.locator('[data-bundle-adoption="0.5"]:not(:disabled)').click();assert.ok((await p.locator('[data-bundle-net]').innerText()).startsWith('+'));
 await p.locator('[data-bundle-adoption="0.05"]').click();assert.ok((await p.locator('[data-bundle-net]').innerText()).startsWith('−'));
 assert.equal(await p.locator('[data-selected-demo=bundle]').getAttribute('href'),'/bundle-lab/simulate/');
 await p.locator('[data-selected-id=commute]').click();await p.locator('[data-commute-focus=fastest]:not(:disabled)').click();assert.ok((await p.locator('[data-commute-status]').innerText()).includes('打车'));
 assert.equal(await p.evaluate(()=>JSON.stringify(Object.entries(localStorage).sort())),storage);assert.deepEqual(writes,[]);
 checks.push('Four native interactions are isolated, correct and lazy; complete-app destinations preserve supported state only');
 for(const w of [1440,768,390]){await p.setViewportSize({width:w,height:1000});for(const palette of ['frost','copper','mist','indigo']){await p.evaluate(v=>document.documentElement.dataset.palette=v,palette);for(const d of directions){await p.locator('#showcaseDirection').selectOption(d.id);assert.deepEqual(await p.locator('[data-selected-id]:not([hidden])').evaluateAll(xs=>xs.map(x=>x.dataset.selectedId)),d.order);assert.equal(await p.locator('.showcase-panel:not([hidden])').getAttribute('data-preview'),d.order[0]);}for(const id of ['trust','taste','bundles','commute']){await p.locator(`[data-selected-id=${id}]`).click();assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${w}/${palette}/${id}`);} }await p.locator('#showcaseDirection').selectOption('all');await p.evaluate(()=>document.documentElement.dataset.palette='frost');await p.locator('#selected').screenshot({path:out+`/showcase-${w}.png`});}
 checks.push('Desktop, tablet, mobile; all four themes, all directions and panels have no horizontal overflow');
 await p.setViewportSize({width:1440,height:1000});await p.locator('#showcaseDirection').selectOption('all');await p.locator('[data-selected-id=trust]').focus();await p.keyboard.press('ArrowDown');assert.equal(await p.locator(':focus').getAttribute('data-selected-id'),'taste');await p.keyboard.press('End');assert.equal(await p.locator(':focus').getAttribute('data-selected-id'),'commute');await p.keyboard.press('Home');assert.equal(await p.locator(':focus').getAttribute('data-selected-id'),'trust');
 const image=p.locator('#project-taste [data-preview-image]');await image.click();await p.locator('.project-image-dialog').waitFor();await p.keyboard.press('Escape');assert.ok(await image.evaluate(el=>el===document.activeElement));
 checks.push('Keyboard tabs, Home/End and real-image enlargement preserve focus; reduced motion keeps all tasks operable');
 for(const url of ['/llm-output-eval/','/tasteroom/','/bundle-lab/simulate/','/commute-compare/','/cases/trust/','/cases/taste/','/cases/bundles/','/cases/commute/','/agent-bench/','/rag-lab/'])assert.ok((await p.request.get(base+url)).ok(),url);
 const nojs=await b.newContext({javaScriptEnabled:false}),n=await nojs.newPage();await n.goto(base+'/');assert.equal(await n.locator('#selected [data-selected-demo]').count(),4);assert.equal(await n.locator('[data-project-id]').count(),17);await nojs.close();checks.push('Static HTML has all four entry points and all 17 projects without JavaScript; all relevant paths return 200');
 assert.deepEqual(errors,[]);
 await fs.writeFile(out+'/showcase-check.json',JSON.stringify({passed:true,checks,errors,writes},null,2));console.log('PASS: '+checks.length+' integrated showcase checks');
}finally{await b.close();}
