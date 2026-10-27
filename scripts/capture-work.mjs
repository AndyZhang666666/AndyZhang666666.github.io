import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from '/Users/mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const base='http://127.0.0.1:8811',dir='assets/work';
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const capture=async file=>{await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:dir+'/'+file,type:'jpeg',quality:90});};
const go=async path=>page.goto(base+path,{waitUntil:'networkidle'});
try{
 await go('/llm-output-eval/');await page.locator('.evidence-link').first().click();await page.locator('.evidence-context mark').waitFor();
 await page.evaluate(()=>window.scrollTo(0,190));await capture('eval-review.jpg');
 await go('/demos/filing-eval/#f05');await page.locator('#desk').waitFor();await capture('filing-review.jpg');

 await go('/tasteroom/?direction=swiss');await page.locator('#directionPreview svg').waitFor();assert.equal(await page.locator('#explicitCount').innerText(),'0');
 await page.locator('#rememberDirection').click();await page.locator('#startComparison').click();await page.locator('#comparisonDimension').selectOption('typography');
 const circles=await page.locator('#comparisonVariants svg circle').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return{width:r.width,height:r.height}}));assert.equal(circles.length,2);for(const r of circles)assert.ok(Math.abs(r.width-r.height)<.8,'changing the font must not distort artwork geometry');
 await page.locator('[data-comparison-side=b]').click();await page.locator('#comparisonPanel').evaluate(e=>e.scrollIntoView({block:'start'}));await capture('taste-comparison.jpg');
 await page.locator('#closeComparison').click();await page.evaluate(()=>scrollTo(0,0));await capture('taste-memory.jpg');
 await page.locator('[data-direction=deconstructed]').click();await page.screenshot({path:'.taste-skill/delivery/taste-deconstructed1440.png'});
 await page.locator('.poster-content-editor summary').click();
 // At the form's actual maximum lengths, both CJK and wide Latin input must remain inside the artwork.
 for(const token of ['字','W']){
  for(const [id,n] of [['editCategory',32],['editTitle',36],['editSubtitle',100],['editFooter',40]])await page.locator('#'+id).fill(token.repeat(n));
  await page.locator('#updateContent').click();
  for(const d of ['swiss','deconstructed']){await page.locator('[data-direction='+d+']').click();const escaped=await page.locator('#directionPreview svg').evaluate(svg=>{const bounds=svg.getBoundingClientRect();return[...svg.querySelectorAll('text')].filter(t=>{const r=t.getBoundingClientRect();return r.left<bounds.left-.8||r.right>bounds.right+.8||r.top<bounds.top-.8||r.bottom>bounds.bottom+.8}).map(t=>t.textContent)});assert.deepEqual(escaped,[],d+' text must fit the rendered SVG');}
 }

 await go('/suibianju/');await page.locator('#quick').click();await page.locator('[data-action=understand]').click();await page.locator('[data-action=submit]').click();
 for(const role of ['a','b','c']){await page.locator('[data-action=role][data-id='+role+']').click();await page.locator('[data-candidate=r1] [data-choice=yes]').click();}
 assert.ok((await page.locator('.status-title').innerText()).includes('已确定'));await page.locator('.workspace').evaluate(e=>e.scrollIntoView({block:'start'}));await capture('shared-decision.jpg');
 await page.locator('[data-action=conflict]').click();await page.locator('[data-action=prepare-plan]').first().click();assert.ok(await page.locator('.draft-preview').isVisible());
 assert.ok((await page.locator('.status-title').innerText()).includes('还没有'));await page.locator('.workspace').evaluate(e=>e.scrollIntoView({block:'end'}));await capture('shared-preview.jpg');

 await go('/bundle-lab/simulate/');await capture('bundle-ledger.jpg');await go('/bundle-lab/bundles/');await capture('bundle-candidates.jpg');
 await go('/cases/taste/');await page.locator('#langToggle').click();assert.equal(await page.locator('h1').innerText(),'Find what you liked.');
 await go('/review.html');await page.locator('#project').selectOption('/llm-output-eval/');await page.getByRole('button',{name:'原版',exact:true}).click();assert.equal(await page.locator('iframe').getAttribute('src'),'http://127.0.0.1:8812/llm-output-eval/');await page.getByRole('button',{name:'更新版',exact:true}).click();assert.equal(await page.locator('iframe').getAttribute('src'),'/llm-output-eval/');
 for(const width of [1440,768,390]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,'comparison overflow '+width);}
 assert.deepEqual(errors,[]);

 const motion={};
 for(const reduce of [false,true]){
  const c=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:reduce?'reduce':'no-preference'}),p=await c.newPage();
  await p.goto(base+'/tasteroom/?direction=swiss',{waitUntil:'networkidle'});await p.locator('[data-direction=deconstructed]').click();
  const art=await p.locator('#directionPreview').evaluate(e=>e.getAnimations().filter(a=>a.playState==='running').map(a=>a.effect.getTiming().duration));
  assert.equal(art.some(n=>n===240),!reduce,'poster motion preference');
  await p.goto(base+'/llm-output-eval/',{waitUntil:'networkidle'});await p.locator('.replay-picker select').first().selectOption({index:1});
  const results=await p.locator('.eval-results').evaluate(e=>e.getAnimations().filter(a=>a.playState==='running').map(a=>a.effect.getTiming().duration));
  assert.equal(results.some(n=>n===220),!reduce,'result motion preference');
  motion[reduce?'reduced':'normal']={art,results};await c.close();
 }
 await fs.writeFile('.taste-skill/delivery/capture-report.json',JSON.stringify({passed:true,at:new Date().toISOString(),screenshots:8,customTextBounds:['32/36/100/40 CJK chars','32/36/100/40 wide Latin chars'],motion,pageErrors:errors},null,2));
 console.log('PASS: 8 current product screenshots, direct preview without implicit memory, long custom copy fits, bilingual case headings, isolated Demo comparison, finite and reduced motion.');
}finally{await browser.close();}
