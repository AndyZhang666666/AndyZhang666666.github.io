import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.SHOWCASE_BASE_URL||'http://127.0.0.1:8811',out='.taste-skill/principles';await fs.mkdir(out,{recursive:true});
const data=JSON.parse(await fs.readFile('data.json'));
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[],checks=[];
try{
 const p=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});p.on('pageerror',error=>errors.push(error.message));
 await p.goto(base+'/#about',{waitUntil:'networkidle'});await p.locator('#principleGrid[data-practice-ready=true]').waitFor();
 assert.equal(await p.locator('[data-principle]').count(),3);
 assert.deepEqual(await p.locator('#principleGrid .principle-title').allTextContents(),data.about.principles.map(p=>p.zh));
 assert.deepEqual(await p.locator('#principleGrid .principle-desc').allTextContents(),data.about.principles.map(p=>p.dz));
 for(const link of await p.locator('.practice-link').evaluateAll(nodes=>nodes.map(n=>({href:n.getAttribute('href'),target:n.target})))){assert.equal(link.target,'_blank');assert.ok((await p.request.get(new URL(link.href,base).href)).ok());}
 checks.push('All three original statements retained with three real work destinations');
 const layouts=[];
 for(const width of [1440,768,390]){
  await p.setViewportSize({width,height:width===390?844:1000});
  for(const palette of ['frost','copper','mist','indigo']){
   await p.evaluate(value=>document.documentElement.dataset.palette=value,palette);await p.locator('#principleGrid').scrollIntoViewIfNeeded();
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,width+'/'+palette+' overflow');
   const boxes=await p.locator('[data-principle]').evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}}));
   if(width===1440){assert.ok(boxes[0].h>boxes[1].h);assert.ok(boxes[1].x>boxes[0].x);assert.ok(boxes[2].y>boxes[1].y);}
   if(width===390)assert.ok(boxes[0].y<boxes[1].y&&boxes[1].y<boxes[2].y);
   layouts.push({width,palette,noOverflow:true});
   if(width===1440)await p.locator('#principleGrid').screenshot({path:out+'/'+palette+'-1440.png'});
  }
  await p.evaluate(()=>document.documentElement.dataset.palette='frost');await p.locator('#principleGrid').screenshot({path:out+'/principles-'+width+'.png'});
 }
 checks.push('Asymmetric desktop composition, responsive tablet/phone and all four themes');
 await p.locator('#langToggle').click();assert.deepEqual(await p.locator('#principleGrid .principle-title').allTextContents(),data.about.principles.map(p=>p.en));
 assert.deepEqual(await p.locator('#principleGrid .principle-desc').allTextContents(),data.about.principles.map(p=>p.de));
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);await p.locator('#principleGrid').screenshot({path:out+'/english-390.png'});
 await p.locator('.practice-link').first().focus();await p.keyboard.press('Tab');assert.ok(await p.locator('.practice-link').nth(1).evaluate(el=>el===document.activeElement));
 checks.push('English content and keyboard reading order remain usable');
 await p.setViewportSize({width:1440,height:1000});await p.emulateMedia({reducedMotion:'no-preference'});await p.locator('#principleGrid').scrollIntoViewIfNeeded();
 await p.locator('[data-principle=problem]').hover({position:{x:80,y:90}});await p.waitForFunction(()=>Math.abs(parseFloat(document.querySelector('[data-principle=problem]').style.getPropertyValue('--practice-ry')))>0.05);
 assert.ok((await p.locator('[data-principle=problem]').evaluate(el=>getComputedStyle(el).backdropFilter)).includes('blur'));
 await p.emulateMedia({reducedMotion:'reduce'});await p.waitForFunction(()=>getComputedStyle(document.querySelector('[data-principle=problem]')).transform==='none');
 assert.equal(await p.locator('#principleGrid').evaluate(el=>el.getAnimations({subtree:true}).length),0);
 checks.push('Pointer depth/blur material work and reduced motion cancels movement');
 const nojs=await browser.newContext({javaScriptEnabled:false}),fallback=await nojs.newPage();await fallback.goto(base+'/#about');assert.equal(await fallback.locator('[data-principle]').count(),3);assert.equal(await fallback.locator('.practice-link').count(),3);assert.equal(await fallback.locator('[data-principle=problem]').evaluate(el=>getComputedStyle(el).opacity),'1');await nojs.close();
 checks.push('Static principle text and links remain visible without JavaScript');
 assert.deepEqual(errors,[]);await fs.writeFile(out+'/report.json',JSON.stringify({passed:true,at:new Date().toISOString(),checks,layouts,errors},null,2));console.log('PASS: '+checks.length+' principle checks; three widths × four themes; original copy, destinations, keyboard and reduced motion.');
}finally{await browser.close()}
