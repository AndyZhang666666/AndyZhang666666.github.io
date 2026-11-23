import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
const base=process.env.STUDIO_BASE||'http://127.0.0.1:8971';
const capture=process.env.STUDIO_CAPTURE,errors=[];
const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
const page=await context.newPage();page.setDefaultTimeout(7000);
page.on('pageerror',e=>errors.push(e.message));
const go=async url=>{await page.goto(base+url,{waitUntil:'domcontentloaded'});};
const visible=async sel=>page.locator(sel).first().waitFor({state:'visible'});
async function download(button){
 const promise=page.waitForEvent('download');await page.locator(button).click();const result=await promise;return fs.readFile(await result.path(),'utf8');
}
async function photo(name){if(capture){await fs.mkdir(capture,{recursive:true});await page.screenshot({path:path.join(capture,name+'.png'),timeout:15000});}}
async function cover(name){
 if(!capture)return;
 await page.setViewportSize({width:1120,height:700});await page.locator(name==='credits'?'.ledger':'.work-layout').evaluate(el=>window.scrollTo({top:el.getBoundingClientRect().top+scrollY-(el.classList.contains('ledger')?135:28),behavior:'instant'}));await photo(name);
 const png=await fs.readFile(path.join(capture,name+'.png'));
 const webp=await page.evaluate(async data=>{const i=new Image();i.src='data:image/png;base64,'+data;await i.decode();const c=document.createElement('canvas');c.width=i.width;c.height=i.height;c.getContext('2d').drawImage(i,0,0);return c.toDataURL('image/webp',.88).split(',')[1];},png.toString('base64'));
 await fs.mkdir('assets/studio-covers',{recursive:true});await fs.writeFile('assets/studio-covers/'+name+'.webp',Buffer.from(webp,'base64'));
}
async function taps(){
 await go('/studio/menu/');await page.locator('#query').waitFor();await page.locator('#mode').selectOption('wide');
 assert.match(await page.locator('#totals').innerText(),/−2/);await cover('menu');
 await page.locator('.change-row').first().click();assert.ok((await page.locator('#query').inputValue()).length>0);
 await page.locator('#imports summary').click();await page.locator('#importText').fill('Mushroom pita | mushroom pocket');await page.locator('#import').click();
 await page.locator('#mode').selectOption('alias');assert.match(await page.locator('#menus').innerText(),/Mushroom pita/);
 const menu=JSON.parse(await download('#export'));assert.ok(menu.rows.some(r=>r.q==='mushroom pocket'&&r.status==='won'));
 await go('/studio/script/');await page.locator('#reveal').selectOption('5');await page.locator('#next').click();
 await page.locator('#draft').fill('她也许记错了。');await cover('script');await page.locator('#accept').click();
 assert.match(await download('#export'),/她也许记错了/);await page.locator('#undo').click();assert.doesNotMatch(await download('#export'),/她也许记错了/);
 await page.locator('#own').click();await page.locator('#who').fill('Lin');await page.locator('#what').fill('The key is gone');await page.locator('#scenes').fill('Door\n【知情】The key is gone.\n\nTable\nThey open the drawer.');await page.locator('#firstReveal').fill('2');
 await page.locator('#importer button[type=submit],#importer button:not([type])').first().click();await page.locator('#next').click();await page.locator('#type').selectOption('omit');await page.locator('#accept').click();assert.match(await download('#export'),/Lin/);
 await go('/studio/credits/');await page.locator('#hold').waitFor();assert.equal(JSON.parse(await download('#saveQuote')).total,36);
 await page.locator('#hold').click();assert.equal(await page.locator('#hold').isDisabled(),true);assert.equal(JSON.parse(await download('#saveQuote')).available,108);await page.locator('[data-shot="1-1"][data-action=done]').click();
 await page.locator('#setup summary').click();await page.locator('#day').fill('2026-11-25');await page.locator('#advance').click();
 await page.locator('[data-shot="1-2"][data-action=failed]').click();await page.locator('[data-shot="1-2"][data-action=retry]').click();await page.locator('[data-shot="1-2"][data-action=done]').click();await page.locator('[data-shot="1-3"][data-action=cancelled]').click();
 const receipt=JSON.parse(await download('#receipt'));assert.deepEqual([receipt.charged,receipt.expired,receipt.available.paid],[24,6,78]);
 if(await page.locator('#setup').getAttribute('open')!==null)await page.locator('#setup summary').click();await cover('credits');
}
async function home(){
 await page.setViewportSize({width:1440,height:900});await go('/');
 await page.locator('.workdesk summary').first().focus();await page.keyboard.press('Enter');await visible('.paper-script[open] .paper-insert a');await page.keyboard.press('Escape');assert.equal(await page.locator('.paper-file[open]').count(),0);
 await page.locator('.paper-menu summary').click();assert.equal(await page.locator('.paper-menu .paper-insert a').count(),3);await page.keyboard.press('Escape');
 await page.evaluate(()=>{document.activeElement.blur();scrollTo({top:0,behavior:'instant'});});await photo('home-desktop');
 await page.locator('[data-eval-locate]').click();
 await page.locator('[data-eval-review=needs_context]').click();assert.equal(await page.locator('[data-eval-review=needs_context]').getAttribute('aria-pressed'),'true');
 await page.locator('[data-selected-id=taste]').click();await page.locator('[data-taste-direction=deconstructed]').click();assert.match(await page.locator('[data-selected-demo=taste]').getAttribute('href'),/direction=deconstructed/);
 await page.locator('[data-selected-id=bundles]').click();await page.locator('[data-bundle-adoption="0.5"]').click();assert.equal(await page.locator('[data-bundle-adoption="0.5"]').getAttribute('aria-pressed'),'true');
 await page.locator('[data-selected-id=rag]').click();await page.locator('[data-rag-scope=revised]').click();await page.locator('[data-rag-run]').click();
 await page.waitForFunction(()=>document.querySelector('[data-rag-answer]').innerText.includes('10'));
 await page.locator('[data-selected-id=taste]').click();
 await page.locator('#presentationToggle').click();await visible('#studioRoute');await page.locator('#studioRoute').selectOption('ai');
 await visible('.film-score');assert.match(await page.locator('.film-score').innerText(),/2/);
 await page.locator('#nextAct').click();await page.locator('#citeLine').click();await visible('.film-excerpt mark');await page.locator('#nextAct').click();
 await page.locator('#filmOpinion').fill('片段长度影响本次判断');assert.match(await download('#exportNote'),/片段长度/);
 await page.locator('#studioRoute').selectOption('strategy');await page.locator('#filmRule').selectOption('wide');await page.locator('#nextAct').click();assert.match(await page.locator('.film-metrics').innerText(),/−2/);
 await photo('strategy-screen');await page.locator('#nextAct').click();await page.locator('[data-decision="2"]').click();assert.equal(await page.locator('[data-decision="2"]').getAttribute('aria-pressed'),'true');
 await page.locator('#studioRoute').selectOption('growth');await page.locator('#filmRate').selectOption('0.5');await page.locator('#nextAct').click();await visible('.film-accounts');await page.locator('#studioFilm h3').focus();await page.keyboard.press('ArrowRight');await visible('.film-score');await page.keyboard.press('Escape');
 await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-presentation'));assert.equal(await page.locator('[data-selected-id][aria-selected=true]').getAttribute('data-selected-id'),'taste');
 const u=page.locator('#thesis-order-flow'),b=page.locator('#thesis-wearable');await u.locator('.instrument').waitFor();
 await u.locator('input').focus();await page.keyboard.press('End');assert.match(await u.locator('output').innerText(),/5000.00 × 1[　 ]/);assert.match(await u.locator('output').innerText(),/0.25/);await u.locator('[data-act=reset]').click();assert.match(await u.locator('output').innerText(),/× 38/);
 await b.locator('[data-act=next]').click();await b.locator('[data-act=back]').click();assert.match(await b.locator('[data-study-arm]').getAttribute('transform'),/-24/);assert.equal(await b.locator('[data-node=back]').getAttribute('r'),'8');await b.scrollIntoViewIfNeeded();await photo('wearable');await b.locator('[data-act=reset]').click();
 await page.locator('[data-library-filter=strategy]').click();
 assert.equal(await page.locator('.project-card:not([hidden])[data-project-id]').count(),1);
 await visible('#project-menu-search');await page.locator('[data-library-filter=all]').click();
 const directory=await page.locator('.project-card[data-project-id]').count();assert.equal(directory,22);
 for(const id of ['scene-revision','menu-search','generation-quote']){
  const img=page.locator('#project-'+id+' img');await img.scrollIntoViewIfNeeded();await img.evaluate(im=>im.decode());assert.equal(await img.evaluate(im=>im.naturalWidth),1120);
 }
 for(const name of ['ai-product','strategy-product','growth-commerce']){const pdf=await context.request.get(base+'/assets/cv/'+name+'.pdf');assert.equal(pdf.status(),200);assert.equal((await pdf.body()).subarray(0,4).toString(),'%PDF');}
 await page.locator('#langToggle').click();await page.waitForFunction(()=>document.documentElement.lang==='en');assert.match(await b.locator('.instrument-title').innerText(),/Movement/);
 await page.locator('#langToggle').click();await page.waitForFunction(()=>document.documentElement.lang!=='en');
 for(const width of [360,390,768,820,821,1024,1440]){
  await page.setViewportSize({width,height:850});
  for(const palette of ['frost','mist','copper','indigo']){
   await page.locator('#paletteSwitch [data-palette="'+palette+'"]').evaluate(el=>el.click());
   assert.equal(await page.locator('html').getAttribute('data-palette'),palette);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'home overflow '+width+' '+palette);
  }
 }
 await page.setViewportSize({width:390,height:844});await page.locator('#paletteSwitch [data-palette=frost]').evaluate(el=>el.click());await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await photo('home-mobile');
 await page.locator('.studio-switch select').selectOption('bundles');assert.equal(await page.locator('[data-selected-id][aria-selected=true]').getAttribute('data-selected-id'),'bundles');
 for(const folder of ['menu','script','credits']){
  await go('/studio/'+folder+'/?lang=en');await page.locator('.work-layout').waitFor();assert.equal(await page.locator('html').getAttribute('lang'),'en');
  for(const width of [360,390,768,1024]){await page.setViewportSize({width,height:820});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),folder+' overflow '+width);}
 }
 await go('/studio-review.html');await page.locator('[data-mode=both]').click();await visible('#old');await page.frameLocator('#old').locator('#selected').waitFor({state:'attached'});
 const motion=await browser.newContext({viewport:{width:1280,height:850},reducedMotion:'no-preference'});
 const moving=await motion.newPage();await moving.goto(base+'/',{waitUntil:'domcontentloaded'});await moving.locator('.paper-menu summary').click();
 const feedback=moving.locator('.paper-menu .paper-insert');assert.equal(await feedback.evaluate(e=>getComputedStyle(e).animationName),'desk-unfold');
 await moving.emulateMedia({reducedMotion:'reduce'});assert.equal(await feedback.evaluate(e=>getComputedStyle(e).animationName),'none');
 await motion.close();
 assert.match(await page.locator('.routes a').last().getAttribute('href'),/^https:\/\/andyzhang/i);
}
try{await taps();console.log('Passed three product flows, file exports and accounting.');await home();assert.deepEqual(errors,[]);console.log('Passed paper desk, three tours, research instruments, palette/width matrix, mobile switch, languages and frozen comparison.');}
finally{await browser.close();}
