// Actual operated UI only: no compositing, mockups or model requests.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.SHOWCASE_BASE_URL||'http://127.0.0.1:8866',out='assets/work/showcase';
const requested=process.argv.slice(2).length?process.argv.slice(2):['eval','taste','bundle','rag-lab'];
const previous=JSON.parse(await fs.readFile(out+'/captures.json','utf8')),records=[...previous.records];
const hash=b=>createHash('sha256').update(b).digest('hex');
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const id of requested){
  const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const route={eval:'/llm-output-eval/?sample=e06&dimension=structure',taste:'/tasteroom/?direction=swiss',bundle:'/bundle-lab/simulate/','rag-lab':'/rag-lab/'}[id];
  if(!route)throw Error('Capture is restricted to the four selected tools');
  const origin=id==='rag-lab'?(process.env.RAG_CAPTURE_BASE||base):base;
  const response=await page.goto(origin+route,{waitUntil:'networkidle'});if(!response?.ok())throw Error('Capture route failed: '+route);
  let state;
  if(id==='eval'){
   await page.getByRole('button',{name:'切换 / 带入材料'}).waitFor();
   await page.locator('.quote-list>button').first().click();
   await page.getByRole('radio',{name:'证据不足或评语存疑',exact:true}).check();
   await page.getByLabel('修改建议或复核备注').fill('截图用人工观察：引句确实存在，仍需结合材料用途核对结构要求。');
   await page.evaluate(()=>scrollTo(0,document.querySelector('.current-material').getBoundingClientRect().top+scrollY-24));
   state='Actual Swiss evidence desk with saved fictional sample e06/structure and an independent synthetic human review; original scores unchanged, no new model call.';
  }else if(id==='taste'){
   await page.locator('#editTitle').fill('把想法\n放进生活');if(!await page.locator('.event-details').evaluate(e=>e.open))await page.locator('.event-details summary').click();await page.locator('#editWhen').fill('周六 14:00');await page.locator('#editWhere').fill('城市共创空间');await page.locator('#editAction').fill('带一份作品来 · 自由报名');await page.locator('#updateContent').click();if(!await page.locator('.image-group').evaluate(e=>e.open))await page.locator('.image-group>summary').click();await page.locator('#artboardFormat').selectOption('landscape');await page.locator('.image-group>summary').click();
   await page.evaluate(()=>scrollTo(0,document.querySelector('#experiment').getBoundingClientRect().top+scrollY-20));
   state='Actual six-direction, three-format creator: original demonstration copy and event details in a1600x900 Swiss landscape, no preference consent or model call.';
  }else if(id==='bundle'){
   await page.locator('#scenario-input').waitFor();await page.getByRole('button',{name:'保留当前方案',exact:true}).click();
   await page.evaluate(()=>scrollTo(0,document.querySelector('#scenario-input').getBoundingClientRect().top+scrollY-80));
   state='Actual updated Bundle Lab with the built-in synthetic-order basis and a locally saved scenario A; assumptions and contributions are not business observations.';
  }else{
   await page.locator('#result[aria-busy=false]').waitFor();
   if(await page.locator('#scenarioChoices>summary').isVisible()&&await page.locator('#scenarioChoices').getAttribute('open')!==null)await page.locator('#scenarioChoices>summary').click();
   await page.evaluate(()=>scrollTo(0,document.querySelector('#queryTitle').getBoundingClientRect().top+scrollY-35));
   state='Actual updated RAG three-column example task: date/version conditions, browser retrieval, answer and supporting source; original fictional policies and no model call.';
  }
  await page.evaluate(()=>document.fonts.ready);if(errors.length)throw Error(id+': '+errors.join('; '));
  const full=`${out}/${id}.jpg`,crop=`${out}/${id}-crop.jpg`;await page.screenshot({path:full,type:'jpeg',quality:88,fullPage:false});
  // An unedited viewport is also the library image. No crop hides a source/mode label.
  await fs.copyFile(full,crop);
  const cwd=id==='eval'?'../eval':id==='bundle'?'../bundle':id==='rag-lab'?'.':'.',scope=id==='taste'?'tasteroom':id==='rag-lab'?'rag-lab':'.';
  const revision=execFileSync('git',['rev-parse','HEAD'],{cwd,encoding:'utf8'}).trim(),dirty=!!execFileSync('git',['status','--porcelain','--',scope],{cwd,encoding:'utf8'}).trim();
  const record={id,route,full,crop,viewport:{width:1280,height:900},cropSize:{width:1280,height:900},capturedAt:new Date().toISOString(),state,source:origin,sourceCommit:revision,hasUncommittedSourceChanges:dirty,sourceRepository:id==='eval'?'AndyZhang666666/llm-output-eval':id==='bundle'?'AndyZhang666666/bundle-lab':'AndyZhang666666/AndyZhang666666.github.io',captureMethod:'Unedited actual operated Chrome viewport in an isolated browser context. Full and preview bytes are identical. Working-tree captures are explicitly marked.',fullSha256:hash(await fs.readFile(full)),cropSha256:hash(await fs.readFile(crop))};
  const existing=records.findIndex(r=>r.id===id);if(existing<0)records.push(record);else records[existing]=record;
  await fs.writeFile(out+'/captures.json',JSON.stringify({...previous,updatedAt:new Date().toISOString(),method:'Actual task-operated captures for the four selected tools. No mockups, model calls or invented outcomes; other capture records preserved.',records},null,2)+'\n');await context.close();console.log('Captured actual updated '+id);
 }
 await fs.writeFile(out+'/captures.json',JSON.stringify({...previous,updatedAt:new Date().toISOString(),method:'Actual task-operated captures for the four selected tools. No mockups, model calls or invented outcomes; other capture records preserved.',records},null,2)+'\n');
}finally{await browser.close();}
