import {mkdir,readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const url=process.env.TEST_URL||'http://127.0.0.1:8889/tasteroom/';
const out=process.env.EVIDENCE_DIR||new URL('../docs/evidence/task-loop-20261111/',import.meta.url).pathname;
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome'}),errors=[],writes=[],external=[],checks=[];
const context=await browser.newContext({viewport:{width:1280,height:900},acceptDownloads:true});
await context.addInitScript(()=>{
 const original=Storage.prototype.setItem;
 window.__sceneStorageWrites=0;
 Storage.prototype.setItem=function(...args){window.__sceneStorageWrites++;return original.apply(this,args);};
});
const page=await context.newPage();
page.on('pageerror',e=>errors.push(e.message));
page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.url());if(/^https?:/.test(r.url())&&!r.url().startsWith(new URL(url).origin))external.push(r.url());});
const snapshot=()=>page.evaluate(()=>({
 stored:localStorage.getItem('tasteroom-v1'),writes:window.__sceneStorageWrites,
 title:document.querySelector('#editTitle').value,
 canvas:document.querySelector('#directionPreview').innerHTML,
 undo:document.querySelector('#undo').disabled,redo:document.querySelector('#redo').disabled,
 context:[...document.querySelectorAll('.contexts button')].filter(b=>b.getAttribute('aria-pressed')==='true').map(b=>b.dataset.context),
 logs:document.querySelectorAll('.log').length,
}));
async function open(){if(!await page.locator('#brainInspector').isVisible())await page.locator('#showBrain').click();await page.locator('#crossSceneCompare').click();await page.locator('#sceneComparisonDialog[open]').waitFor();}
async function close(){await page.locator('#closeSceneComparison').click();await page.locator('#sceneComparisonDialog').waitFor({state:'hidden'});}
try{
 await page.goto(url,{waitUntil:'domcontentloaded'});await page.locator('#directionPreview>svg').waitFor();
 const empty=await snapshot();await open();
 assert.equal(await page.locator('.scene-poster-image>svg').count(),2);
 assert.ok((await page.locator('#sceneComparisonSummary').textContent()).includes('两侧参数相同'));
 assert.equal(await page.locator('#sceneComparisonDifferences li').count(),0);
 await page.keyboard.press('Escape');await page.locator('#sceneComparisonDialog').waitFor({state:'hidden'});
 assert.deepEqual(await snapshot(),empty);assert.equal(await page.evaluate(()=>document.activeElement.id),'crossSceneCompare');
 checks.push('Empty authorization uses identical defaults; Escape restores focus and zero storage writes.');
 await page.locator('#showBrain').click();await page.locator('#rememberDirection').click();await page.locator('#confirmRule').click();
 await page.locator('#showBrain').click();await page.locator('.contexts [data-context=work]').click();await page.locator('#closeMemory').click();
 await page.locator('#quickDirections').click();await page.locator('[data-direction=japanese]').click();
 await page.locator('#showBrain').click();await page.locator('#rememberDirection').click();await page.locator('#confirmRule').click();
 const imageData=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=600;c.height=400;const g=c.getContext('2d');g.fillStyle='#374d3c';g.fillRect(0,0,600,400);g.fillStyle='#b7845d';g.fillRect(300,0,300,400);return c.toDataURL('image/png').split(',')[1];});
 await page.locator('#closeMemory').click();await page.locator('.image-group>summary').click();await page.locator('#posterImage').setInputFiles({name:'synthetic-two-colour-study.png',mimeType:'image/png',buffer:Buffer.from(imageData,'base64')});
 await page.locator('#directionPreview image').waitFor();
 await page.locator('#editTitle').fill('未应用的输入\n继续保留');
 const pending=await snapshot();await open();
 const metadata=await page.locator('#sceneComparisonPosters svg metadata').evaluateAll(nodes=>nodes.map(n=>JSON.parse(n.textContent)));
 assert.deepEqual(metadata[0].content,metadata[1].content);
 assert.ok(!metadata[0].content[1].includes('未应用的输入'));
 assert.deepEqual(metadata.map(m=>m.canvas.artDirection),['swiss','japanese']);
 const imageReferences=await page.locator('.scene-poster-image>svg').evaluateAll(nodes=>nodes.map(svg=>({image:svg.querySelector('image').getAttribute('href'),ids:[...svg.querySelectorAll('[id]')].map(n=>n.id),clip:svg.querySelector('image').getAttribute('clip-path'),overflow:svg.querySelector('image').parentElement.getAttribute('overflow')})));
 assert.equal(imageReferences[0].image,imageReferences[1].image);
 const ids=imageReferences.flatMap(r=>r.ids);assert.equal(new Set(ids).size,ids.length);
 assert.ok(imageReferences.every(r=>r.clip?r.ids.some(id=>r.clip===`url(#${id})`):r.overflow==='hidden'));
 assert.equal(await page.locator('#sceneComparisonDifferences li').count(),1);
 assert.match(await page.locator('#sceneComparisonDifferences').textContent(),/个人.*瑞士现代主义.*工作.*日式留白/s);
 await page.screenshot({path:out+'scene-desktop.png',animations:'disabled'});
 await close();assert.deepEqual(await snapshot(),pending);
 checks.push('Real UI-authorized personal Swiss/work Japanese share applied copy/image with independent image viewports; unsaved input/context/undo/logs/storage stay untouched.');
 // The paired renderer must preserve the same format and namespaced image references.
 for(const [width,format,dimensions]of[[1280,'portrait',[900,1200]],[768,'square',[1080,1080]],[390,'landscape',[1600,900]]]){
  if(await page.locator('#brainInspector').isVisible())await page.locator('#closeMemory').click();await page.setViewportSize({width,height:900});if(width<768)await page.locator('#mobileEdit').click();await page.locator('#artboardFormat').selectOption(format);if(width<768)await page.locator('#mobileBackCanvas').click();
  const before=await snapshot();await open();
  const sizes=await page.locator('.scene-poster-image>svg').evaluateAll(nodes=>nodes.map(n=>[Number(n.getAttribute('width')),Number(n.getAttribute('height'))]));
  assert.deepEqual(sizes,[dimensions,dimensions]);
  assert.ok(await page.evaluate(()=>document.querySelector('#sceneComparisonDialog').scrollWidth<=document.querySelector('#sceneComparisonDialog').clientWidth));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  if(width===390){await page.screenshot({path:out+'scene-mobile.png',animations:'disabled'});await page.keyboard.press('Escape');}
  else await close();
  assert.deepEqual(await snapshot(),before);
 }
 checks.push('1280/768/390 paired portrait/square/landscape, keyboard close, native modal focus and no horizontal overflow.');
 await page.emulateMedia({reducedMotion:'reduce'});const reduced=await snapshot();await open();await close();assert.deepEqual(await snapshot(),reduced);
 if(await page.locator('#brainInspector').isVisible())await page.locator('#closeMemory').click();await page.locator('#mobileEdit').click();await page.locator('#editTitle').fill('自己的活动\n周末一起');await page.locator('#mobileApply').click();
 const download=page.waitForEvent('download');await page.locator('.format-menu summary').click();await page.locator('#exportPoster').click({timeout:5000});await(await download).saveAs(out+'after-close.svg');
 assert.match(await readFile(out+'after-close.svg','utf8'),/自己的活动/);
 await page.reload();await page.locator('#directionPreview>svg').waitFor();
 assert.equal(await page.locator('#sceneComparisonDialog[open]').count(),0);
 const remembered=JSON.parse(await page.evaluate(()=>localStorage.getItem('tasteroom-v1')));
 assert.equal(remembered.memories.filter(m=>m.status==='active'&&m.type==='explicit'&&m.dimension==='artDirection').length,2);
 checks.push('Reduced motion, actual export after closing, reload keeps exactly two authorized scene rules and closes ephemeral preview.');
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);assert.deepEqual(external,[]);
 await writeFile(out+'browser-results.json',JSON.stringify({status:'passed',url,checkedAt:new Date().toISOString(),checks,errors,writes,external,modelCalls:0},null,2));
 console.log(JSON.stringify({status:'passed',checks,errors,writes,external}));
}finally{await browser.close();}
