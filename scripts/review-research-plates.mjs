import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base=process.env.STUDIO_BASE || 'http://127.0.0.1:8973';
const captures=process.env.RESEARCH_CAPTURE;
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:940},reducedMotion:'no-preference'});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
page.setDefaultTimeout(7000);
const book=page.locator('#thesis-order-flow'),wear=page.locator('#thesis-wearable');
const act=(figure,key)=>figure.locator('[data-act="'+key+'"]');
const seek=async(figure,n)=>{await act(figure,'range').focus();await act(figure,'range').press('Home');for(let i=0;i<n;i++)await act(figure,'range').press('ArrowRight');};
async function open(figure){
  const hash=await figure.getAttribute('id');
  await page.goto(base+'/#'+hash,{waitUntil:'domcontentloaded'});
  await figure.locator('output').waitFor();
  await page.waitForFunction(id=>{const y=document.getElementById(id).getBoundingClientRect().y;return y>=0 && y<innerHeight*.34;},hash,{timeout:9000});
}
async function shot(figure,name){
  if(!captures)return;
  await fs.mkdir(captures,{recursive:true});
  await page.evaluate(()=>document.activeElement?.blur());
  await figure.screenshot({path:path.join(captures,name+'.png'),animations:'disabled'});
}
try{
  await page.goto(base+'/#thesis-order-flow',{waitUntil:'domcontentloaded'});
  await book.locator('output').waitFor();await open(book);
  assert.match(await book.locator('output').innerText(),/5000.00 × 38/);
  await act(book,'range').focus();await act(book,'range').press('End');assert.match(await book.locator('output').innerText(),/5000.00 × 1[　 ]/);
  await act(book,'reset').click();await act(book,'ask').click();await act(book,'play').click();
  await page.waitForFunction(()=>document.querySelector('#thesis-order-flow input').value==='50');
  assert.match(await book.locator('output').innerText(),/5000.25 × 21/);assert.match(await book.locator('[data-r=imbalance]').innerText(),/\+28.8%/);
  assert.ok((await book.locator('[data-base-ask]').getAttribute('d')).length>10);
  await act(book,'levels').click();await book.locator('select').selectOption('2');
  assert.deepEqual(await book.locator('.rp-buy td').allTextContents(),['4999.50','94']);
  await act(book,'cumulative').click();assert.deepEqual(await book.locator('.rp-buy td').allTextContents(),['4999.50','200']);
  await book.locator('.rp-illustration svg').scrollIntoViewIfNeeded();
  const spot=await book.locator('.rp-illustration svg').evaluate(svg=>{
    const pt=svg.createSVGPoint();pt.x=385;pt.y=154;const xy=pt.matrixTransform(svg.getScreenCTM());return {x:xy.x,y:xy.y};
  });
  await page.mouse.click(spot.x,spot.y);assert.equal(await book.locator('select').inputValue(),'4');
  await book.locator('select').selectOption('2');
  await shot(book,'ucl-desktop');
  await open(wear);await seek(wear,1);await act(wear,'pin').click();
  await seek(wear,3);assert.match(await wear.locator('[data-r=comparison]').innerText(),/\+48°/);
  await act(wear,'back').click();assert.match(await wear.locator('[data-r=comparison]').innerText(),/\+4°/);assert.equal(await wear.locator('[data-node=back]').getAttribute('r'),'8');
  await act(wear,'arm').click();assert.equal(await wear.locator('[data-ghost-arm]').getAttribute('visibility'),'visible');
  await shot(wear,'bristol-desktop');
  await act(wear,'play').click();await page.waitForFunction(()=>document.querySelector('#thesis-wearable input').value==='8');
  await act(wear,'play').click();await page.waitForFunction(()=>Number(document.querySelector('#thesis-wearable input').value)>=1);
  await act(wear,'play').click();const held=await act(wear,'range').inputValue();await page.waitForTimeout(500);assert.equal(await act(wear,'range').inputValue(),held);
  await act(wear,'play').click();await page.waitForTimeout(360);
  const motionToggle=page.locator('.research-motion-toggle');
  await motionToggle.evaluate(b=>b.click());const paused=await act(wear,'range').inputValue();await page.waitForTimeout(420);
  assert.equal(await act(wear,'range').inputValue(),paused);await motionToggle.evaluate(b=>b.click());
  await act(wear,'reset').click();assert.equal(await wear.locator('[data-ghost-arm]').getAttribute('visibility'),'hidden');
  await page.emulateMedia({reducedMotion:'reduce'});await act(wear,'play').click();assert.equal(await act(wear,'range').inputValue(),'8');
  await page.locator('#langToggle').evaluate(b=>b.click());await page.waitForFunction(()=>document.documentElement.lang==='en');
  assert.match(await wear.locator('.instrument-title').innerText(),/Movement/);
  assert.match(await act(book,'ask').innerText(),/Ask/);
  assert.equal(await book.locator('select option:checked').textContent(),'Level '+(Number(await book.locator('select').inputValue())+1));
  for(const language of ['en','zh']){
    if(language==='zh')await page.locator('#langToggle').evaluate(b=>b.click());
    for(const width of [360,390,768,820,821,1024,1440]){
      await page.setViewportSize({width,height:850});
      for(const palette of ['frost','mist','copper','indigo']){
        await page.locator('#paletteSwitch [data-palette="'+palette+'"]').evaluate(b=>b.click());
        for(const fig of [book,wear]){
          const fits=await fig.evaluate(el=>el.scrollWidth<=el.clientWidth+1 && [...el.querySelectorAll('button,select,input')].every(c=>{const x=c.getBoundingClientRect(),f=el.getBoundingClientRect();return x.width>0&&x.left>=f.left-1&&x.right<=f.right+1;}));
          assert.ok(fits,language+' '+width+' '+palette+' '+await fig.getAttribute('id'));
        }
      }
    }
  }
  await page.setViewportSize({width:390,height:844});await page.locator('#paletteSwitch [data-palette=frost]').evaluate(b=>b.click());
  await open(book);await act(book,'ask').click();await act(book,'play').click();await shot(book,'ucl-mobile');
  await open(wear);await seek(wear,1);await act(wear,'pin').click();await seek(wear,3);await shot(wear,'bristol-mobile');
  assert.deepEqual(errors,[]);
  console.log('Pass: both deep links, bid and ask withdrawals, depths and tiers, motion and reference comparison, pause/reset, language, four palettes and seven widths.');
}finally{await browser.close();}
