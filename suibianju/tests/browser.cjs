// Optional dev dependency: npm install --no-save playwright
// Requires installed Chrome, or CHROME_PATH. No dependencies needed to use the product.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.BASE_URL||'http://127.0.0.1:8794';
const shots=process.env.SHOTS_DIR||path.join(__dirname,'../media');
const screenshot=process.env.NO_SCREENSHOTS!=='1';
(async()=>{
  const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{channel:'chrome'})});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(!r.url().startsWith(base)&&!r.url().startsWith('data:'))external.push(r.url());});
  fs.mkdirSync(shots,{recursive:true});
  const act=(a)=>page.locator(`[data-action="${a}"]`);
  const reset=async()=>{await page.goto(base+'/suibianju/');await page.evaluate(()=>localStorage.removeItem('suibianju-demo-v1'));await page.reload();await page.locator('#quick').click();};
  const heading=()=>page.locator('.status-title').innerText();
  const role=async(id)=>page.locator(`[data-action="role"][data-id="${id}"]`).click();
  const yes=()=>page.locator('[data-candidate="r1"] [data-choice="yes"]').click();
  try{
    await reset();
    assert((await heading()).includes('先收齐'));
    await act('understand').click();assert(await page.locator('#softNoSpicy').isChecked());assert(!await page.locator('#noSpicy').isChecked());
    await act('submit').click();assert((await heading()).includes('2 个共同可行方案'));
    if(screenshot)await page.screenshot({path:path.join(shots,'desktop.png'),fullPage:true});
    await yes();await yes();assert.equal(await page.locator('[data-candidate="r1"] .tally').innerText(),'1/3 人接受');
    await role('b');await yes();await role('c');await yes();assert((await heading()).includes('已确定'));
    await page.reload();assert((await heading()).includes('已确定'));
    if(screenshot)await page.screenshot({path:path.join(shots,'decision.png'),fullPage:true});
    await role('c');await page.locator('#budget').fill('90');await act('submit').click();assert(!(await heading()).includes('已确定'));assert((await page.locator('[data-candidate="r1"] .tally').innerText()).startsWith('0/3'));
    await act('conflict').click();assert((await heading()).includes('还没有'));assert(await page.locator('.conflict-box').isVisible());assert.equal(await page.locator('#budget').inputValue(),'40');
    if(screenshot)await page.screenshot({path:path.join(shots,'conflict.png'),fullPage:true});
    await page.locator('#budget').fill('120');await act('submit').click();assert((await heading()).includes('2 个'));
    await page.locator('#raw').fill('我不是不能吃辣，只是想试试别的');await act('understand').click();assert((await page.locator('.helper').first().innerText()).includes('超出了'));assert(!await page.locator('#noSpicy').isChecked());
    await page.locator('.editor details summary').click();await act('fail').click();assert((await page.locator('#toast').innerText()).includes('模拟整理失败'));assert.equal(await page.locator('#raw').inputValue(),'我不是不能吃辣，只是想试试别的');
    await page.locator('#budget').fill('100');await act('submit').click();assert((await heading()).includes('1 个'));
    await page.locator('[data-candidate="r1"] [data-choice="no"]').click();await page.locator('[data-candidate="r1"] [data-choice="no"]').click();assert((await page.locator('[data-candidate="r1"] .tally').innerText()).includes('暂不接受'));
    await act('member').click();assert((await heading()).includes('先收齐'));await act('member').click();assert(!(await page.locator('.person').filter({hasText:'小满'}).innerText()).includes('条件已确认'));await act('submit').click();
    await page.locator('#raw').fill('刷新也要保留的虚构草稿');await page.locator('#budget').fill('0');await page.reload();await role('c');assert.equal(await page.locator('#raw').inputValue(),'刷新也要保留的虚构草稿');assert.equal(await page.locator('#budget').inputValue(),'0');await act('submit').click();assert((await page.locator('#toast').innerText()).includes('预算请填写'));await page.locator('#budget').fill('120');await act('submit').click();
    await page.locator('#real').click();assert(await page.locator('#real-info').isVisible());assert((await page.locator('#real-info').innerText()).includes('尚无跨设备房间'));await page.locator('#real').click();
    for(const width of [1440,768,390,360]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}`);}
    if(screenshot){await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(shots,'mobile.png'),fullPage:true});}
    await page.setViewportSize({width:1440,height:1000});
    await page.locator('[data-candidate="r1"] .candidate-editor summary').click();await page.locator('#price-r1').fill('95');await page.locator('[data-action="price"][data-id="r1"]').click();assert((await page.locator('[data-candidate="r1"] .price').innerText()).includes('95'));assert((await page.locator('[data-candidate="r1"] .tally').innerText()).startsWith('0/3'));
    await act('add').click();await page.locator('.blocked summary').first().click();await page.locator('[data-candidate="r5"] .candidate-editor summary').click();await page.locator('#name-r5').fill('补充的小店（虚构）');await page.locator('#cuisine-r5').selectOption('面食');await page.locator('#area-r5').selectOption('中山路');await page.locator('#min-r5').fill('25');await page.locator('#price-r5').fill('35');await page.locator('#spicy-r5').selectOption('提供');await page.locator('[data-action="price"][data-id="r5"]').click();assert(await page.locator('[data-candidate="r5"] [data-choice="yes"]').isVisible());
    await page.locator('#delete').click();assert((await page.locator('.empty').innerText()).includes('已删除'));assert.equal(await page.evaluate(()=>localStorage.getItem('suibianju-demo-v1')),null);
    await page.locator('#quick').click();await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('suibianju-demo-v1'));s.expiresAt=Date.now()-1;localStorage.setItem('suibianju-demo-v1',JSON.stringify(s));});await page.reload();assert((await page.locator('.empty').innerText()).includes('已到期'));
    await page.evaluate(()=>localStorage.setItem('suibianju-demo-v1','broken'));await page.reload();assert((await page.locator('.empty').innerText()).includes('无法恢复'));
    assert.equal(await page.locator('.nav a').last().getAttribute('href'),'https://github.com/AndyZhang666666/AndyZhang666666.github.io/tree/main/suibianju');
    assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
    console.log('PASS: negotiation, ambiguity, consensus, reload, invalidation, conflict/recovery, failure/manual, rejection/double-click, member change, draft persistence/validation, unavailable real mode, 4 widths, deletion, expiration/corruption, source link; no page errors or external requests.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
