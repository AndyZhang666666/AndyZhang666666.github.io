import assert from 'node:assert/strict';
const{chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const url=process.env.TEST_URL||'http://127.0.0.1:8804/';
const b=await chromium.launch({headless:true,channel:'chrome'});const p=await b.newPage({viewport:{width:1440,height:1000}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
try{
 await p.goto(url);await p.waitForLoadState('networkidle');await p.waitForFunction(()=>document.querySelectorAll('#projectGrid .project-card').length===15);
 for(const id of ['poker-ev-calculator','poker-bankroll-sim','growth-experiment-lab','pricing-model-sim','bundle-lab','llm-output-eval'])assert.ok(await p.locator('#projectGrid a[href="https://andyzhang666666.github.io/'+id+'/"]').count()>=1);
 assert.match(await p.locator('#projectGrid').innerText(),/关键遗漏分开复核/);
 assert.match(await p.locator('#projectGrid').innerText(),/复核判断并导出/);
 assert.match(await p.locator('#projectGrid').innerText(),/既有顾客领折扣/);
 assert.match(await p.locator('#projectGrid').innerText(),/逐月去向/);
 assert.match(await p.locator('#projectGrid').innerText(),/停止不等于余额归零/);
 await p.locator('#langToggle').click();assert.equal(await p.locator('html').getAttribute('lang'),'en');assert.match(await p.locator('#projectGrid').innerText(),/Stopping is not a zero balance/);
 await p.locator('#langToggle').click();for(const width of [1440,768,390]){await p.setViewportSize({width,height:1000});assert.equal(await p.locator('#projectGrid .project-card').count(),15);}
 await p.setViewportSize({width:1440,height:1000});for(const button of await p.locator('#paletteSwitch .ps-btn').all()){await button.click();assert.equal(await p.locator('html').getAttribute('data-palette'),await button.getAttribute('data-palette'));}
 assert.deepEqual(errors,[]);console.log('PASS: 15 rendered cards, seven upgraded projects, bilingual copy, responsive card retention and palette switching; no page errors.');
}finally{await b.close();}
