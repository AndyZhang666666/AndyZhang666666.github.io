// Real browser acceptance for both static apps; no credentials or live model required.
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const {mkdirSync,readFileSync}=await import('node:fs');
const assert=(await import('node:assert/strict')).default;
const base=(process.env.BASE_URL||'http://127.0.0.1:8803').replace(/\/$/,'');
const out=process.env.EVIDENCE_DIR||'/tmp/lifestyle-v2-evidence';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:process.env.CHROME_CHANNEL||'chrome'});
const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const state=key=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
const screenshot=async(name)=>{await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));return page.screenshot({path:`${out}/${name}.png`,fullPage:true,animations:'disabled'});};
const download=async(selector,name)=>{
  const pending=page.waitForEvent('download');await page.locator(selector).click();
  const file=await pending;await file.saveAs(`${out}/${name}`);return readFileSync(`${out}/${name}`,'utf8');
};
try{
  await page.goto(`${base}/suibianju/`);await page.locator('#quick').click();
  await page.locator('[data-action="understand"]').click();await page.locator('[data-action="submit"]').click();
  await page.locator('[data-action="conflict"]').click();
  assert.equal(await page.locator('.proposal').count(),2);
  await screenshot('suibianju-conflict');
  const before=await state('suibianju-demo-v1');
  await page.locator('[data-action="prepare-plan"]').first().click();
  const draft=await state('suibianju-demo-v1');
  assert.equal(draft.version,before.version);assert.deepEqual(draft.votes,before.votes);
  assert.equal(draft.members.find(m=>m.id==='c').conditions.budget,40);
  assert.equal(await page.locator('#budget').inputValue(),'85');
  assert.equal(await page.locator('.draft-preview').count(),1);
  await page.locator('[data-action="submit"]').click();
  for(let i=0;i<3;i++){
    await page.locator('[data-candidate="r1"] [data-choice="yes"]').click();
    if(i<2)await page.locator('[data-candidate="r1"] [data-action="next-voter"]').click();
  }
  await page.locator('.decision-receipt').waitFor();await screenshot('suibianju-decision');
  const receipt=await download('[data-action="download-decision"]','随便局-决定单.txt');
  assert.match(receipt,/3 位模拟成员已共同确认/);assert.ok(!receipt.includes('小林')&&!receipt.includes('不想吃辣'));
  await page.locator('#budget').fill('50');await page.locator('[data-action="preview"]').click();
  assert.match(await page.locator('.draft-preview').innerText(),/全部旧表态将失效/);
  assert.equal(Object.keys((await state('suibianju-demo-v1')).votes).length,3);
  await page.locator('.group-settings summary').click();await page.locator('#new-member').fill('小雨');await page.locator('[data-action="add-member"]').click();
  assert.equal(await page.locator('.decision-receipt').count(),0);assert.equal(await page.locator('.draft-preview').count(),0);
  assert.equal(Object.keys((await state('suibianju-demo-v1')).votes).length,0);
  await page.locator('[data-action="submit"]').click();
  await page.locator('.group-settings summary').click();await page.locator('#new-member').fill('小舟');await page.locator('[data-action="add-member"]').click();
  await page.locator('.group-settings summary').click();assert.ok(await page.locator('[data-action="add-member"]').isDisabled());
  await page.locator('[data-action="submit"]').click();
  for(let i=0;i<5;i++){
    await page.locator('[data-candidate="r1"] [data-choice="yes"]').click();
    if(i<4)await page.locator('[data-candidate="r1"] [data-action="next-voter"]').click();
  }
  assert.match(await page.locator('.decision-receipt').innerText(),/5 位模拟成员明确接受/);
  for(const width of [1440,768,390,360]){
    await page.setViewportSize({width,height:900});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`suibianju overflow ${width}`);
  }
  await screenshot('suibianju-mobile');
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(`${base}/tasteroom/`);await page.locator('#reset').click();
  await page.locator('[data-choice="b"]').click();await page.locator('[data-choice="b"]').click();
  await page.waitForFunction(()=>document.querySelector('#runState').textContent==='可随时纠偏');
  await page.locator('#startComparison').click();const old=await state('tasteroom-v1');
  await page.locator('[data-comparison-side="b"]').click();
  assert.deepEqual(await state('tasteroom-v1'),old,'choice alone cannot mutate durable rules');
  await screenshot('tasteroom-controlled-comparison');
  await page.locator('[data-comparison-scope="current"]').click();
  assert.equal(await page.locator('#poster').getAttribute('data-typography'),'rational_sans');
  assert.equal(await page.locator('#comparisonPanel').isVisible(),false);
  const explicit=(await state('tasteroom-v1')).memories.find(m=>m.status==='active'&&m.type==='explicit');
  assert.equal(explicit.evidence.method,'single-variable');
  await page.locator('#startComparison').click();const saved=await state('tasteroom-v1');await page.locator('#skipComparison').click();
  assert.deepEqual(await state('tasteroom-v1'),saved);
  await page.locator('#newContent').click();await page.reload();await page.waitForLoadState('networkidle');
  assert.equal((await state('tasteroom-v1')).content,1);
  await page.locator(`[data-delete="${explicit.id}"]`).click();assert.ok(await page.locator('#undoMemory').isEnabled());
  await page.locator('#undoMemory').click();
  assert.ok((await state('tasteroom-v1')).memories.some(m=>m.id===explicit.id));
  await page.locator('.direct-adjustment summary').click();
  await page.locator('#directDimension').selectOption('typography');await page.locator('#directValue').selectOption('mono_tech');
  await page.locator('#applyDirect').click();await page.locator('#conflict').waitFor({state:'visible'});
  assert.ok(await page.locator('#exportBrief').isDisabled());await page.locator('[data-resolve="once"]').click();
  const md=await download('#exportBrief','偏爱说明书.md');assert.match(md,/等宽科技/);assert.match(md,/本人明确规则/);assert.match(md,/待验证线索/);
  const svg=await download('#exportPoster','风格海报.svg');assert.match(svg,/<svg/);assert.match(svg,/monospace/);
  assert.ok(!svg.includes('sourceReason'));await page.locator('#newContent').click();
  assert.equal(await page.locator('#poster').getAttribute('data-typography'),'rational_sans');
  await screenshot('tasteroom-rules-and-export');
  await page.locator('#startComparison').click();await page.locator('#comparisonDimension').selectOption('colorMood');
  for(const width of [1440,768,390,360]){
    await page.setViewportSize({width,height:900});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`tasteroom overflow ${width}`);
    if(width===390){await screenshot('tasteroom-mobile-comparison');await page.locator('#showBrain').click();await screenshot('tasteroom-mobile-rules');await page.locator('#showCanvas').click();}
  }
  assert.deepEqual(errors,[]);console.log('PASS V2: proposal/preview purity, unanimous export, 4–5 roles, single-variable consent, skip, memory undo, direct correction, reload, Markdown/SVG downloads, 4 widths; no page errors.');
}finally{await browser.close();}
