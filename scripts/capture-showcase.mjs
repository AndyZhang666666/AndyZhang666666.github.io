// Capture actual, operated product UI. Never compose or redraw a product screenshot.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.SHOWCASE_BASE_URL||'http://127.0.0.1:8811';
const out='assets/work/showcase';await fs.mkdir(out,{recursive:true});
const old=JSON.parse(await fs.readFile(out+'/captures.json','utf8'));
const records=old.records.map(record=>({...record,capturedAt:record.capturedAt||old.capturedAt}));
const browser=await chromium.launch({channel:'chrome',headless:true});
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
try{
 for(const id of (process.argv.slice(2).length?process.argv.slice(2):['eval','taste','bundle','commute'])){
  const context=await browser.newContext({viewport:{width:1280,height:1000},reducedMotion:'reduce'}),page=await context.newPage();
  const route={eval:'/llm-output-eval/',taste:'/tasteroom/?direction=swiss',suibianju:'/suibianju/',bundle:'/bundle-lab/simulate/',commute:'/commute-compare/','agent-bench':'/agent-bench/','rag-lab':'/rag-lab/'}[id];
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const response=await page.goto(base+route,{waitUntil:'networkidle'});if(!response?.ok())throw Error(route+' did not load');
  await page.evaluate(()=>document.fonts.ready);
  let region,state;
  if(id==='eval'){
   await page.locator('.dimension-nav button').filter({hasText:'结构完整性'}).click();
   await page.locator('.quote-list button').first().click();
   await page.locator('.source-document mark').waitFor();
   await page.locator('.evidence-review select').selectOption('needs_context');
   await page.locator('.evidence-review textarea').fill('引句存在；需结合完整故事结构判断这条评语。');
   await page.evaluate(()=>{document.activeElement.blur();scrollTo(0,0)});
   const box=await page.locator('.focused-workspace').boundingBox();
   region={clip:{x:box.x,y:box.y,width:box.width,height:Math.min(box.height,820)}};
   state='Historical structure score and source evidence in the focused workspace; independent needs-context review in a disposable browser context, no new model call.';
  }else if(id==='taste'){
   await page.locator('#editTitle').fill('今晚散步\n不聊工作');
   await page.locator('#posterContentForm button').click();
   const top=await page.locator('#experiment>.section-heading').boundingBox(),board=await page.locator('.creation-board').boundingBox();
   region={clip:{x:top.x,y:top.y,width:board.width,height:board.y+board.height-top.y}};
   state='Editable Swiss SVG poster with custom demonstration copy; visible SVG and 900x1200 PNG export controls, no saved preference.';
  }else if(id==='commute'){
   await page.waitForFunction(()=>document.querySelector('#personal-decision')?.getAttribute('aria-busy')==='false');
   await page.locator('.decision-reason textarea').fill('当前演示中，费用比这段省下的时间更重要。');
   await page.getByRole('button',{name:'选择这个方案',exact:true}).first().click();
   await page.evaluate(()=>{document.activeElement.blur();scrollTo(0,0)});
   region=page.locator('#personal-decision');
   state='Two illustrative routes, canonical monthly tradeoff and a disposable example choice with reason; independent snapshot is not a real travel observation.';
  }else if(id==='suibianju'){
   await page.locator('#quick').click();await page.locator('[data-action=understand]').click();await page.locator('[data-action=submit]').click();
   await page.locator('[data-action=conflict]').click();await page.locator('[data-action=prepare-plan]').first().click();
   await page.locator('.draft-preview').waitFor();
   // The contiguous lower part of the real editor shows confirmed conditions and the pending draft together.
   const summary=await page.locator('.editor .summary').boundingBox(),draft=await page.locator('.draft-preview').boundingBox(),editor=await page.locator('.editor').boundingBox();
   if(!summary||!draft||!editor)throw Error('Shared choice result state is missing');
   const scroll=await page.evaluate(()=>({x:scrollX,y:scrollY}));
   region={clip:{x:editor.x+scroll.x,y:summary.y+scroll.y-10,width:editor.width,height:draft.y+draft.height-summary.y+20}};
   state='No-intersection scenario; voluntary budget proposal fills a draft. Confirmed conditions unchanged, shared acceptance still pending.';
  }else if(id==='agent-bench'){
   await page.locator('#watch:not(:disabled)').click();
   await page.locator('#verdict:not([hidden])').waitFor();
   const comparison=await page.locator('#comparison').boundingBox(),verdict=await page.locator('#verdict').boundingBox(),scroll=await page.evaluate(()=>({x:scrollX,y:scrollY}));
   if(!comparison||!verdict)throw Error('Agent comparison and final verdict must be visible');
   region={clip:{x:comparison.x+scroll.x,y:comparison.y+scroll.y,width:comparison.width,height:verdict.y+verdict.height-comparison.y}};
   state='Saved program records for timeout after commit: baseline unknown versus reconciled recovery. Actual final ticket state and grader verdict; no new tool execution or model call.';
  }else if(id==='rag-lab'){
   await page.waitForFunction(()=>document.getElementById('answerHeadline').textContent.includes('14'));
   await page.locator('#citationLinks button').first().click();
   region=page.locator('#result');
   state='Public fictional corpus, actual BM25 retrieval and rule extraction for 2026-10-28 / baseline: 14-day rule with version 2.0 and source paragraph. No model call.';
  }else{
   await page.locator('#picked').selectOption('可乐 + 鸡腿饭');
   await page.locator('#scenario-result').waitFor();const box=await page.locator('.sim-work').boundingBox();region={clip:{x:box.x,y:box.y+await page.evaluate(()=>scrollY),width:box.width,height:Math.min(box.height,720)}};
   state='Actual cola + chicken rice candidate, default canonical assumptions; negative middle-case contribution, two-population ledger and break-even gate.';
  }
  const full=`${out}/${id}.jpg`,crop=`${out}/${id}-crop.jpg`;
  const dimensions=region.clip?{width:region.clip.width,height:region.clip.height}:await region.boundingBox();
  if(!dimensions)throw Error('Missing capture region for '+id);
  if(region.clip)await page.screenshot({path:crop,type:'jpeg',quality:92,clip:region.clip,fullPage:true});
  else await region.screenshot({path:crop,type:'jpeg',quality:92});
  await page.screenshot({path:full,type:'jpeg',quality:87,fullPage:true});
  if(errors.length)throw Error(id+': '+errors.join('; '));
  const record={id,route,full,crop,viewport:{width:1280,height:1000},capturedAt:new Date().toISOString(),state,fullPage:true,cropSize:{width:Math.round(dimensions.width),height:Math.round(dimensions.height)},fullSha256:hash(await fs.readFile(full)),cropSha256:hash(await fs.readFile(crop))};
  const index=records.findIndex(r=>r.id===id);if(index>=0)records[index]=record;else records.push(record);
  console.log(id+': '+record.cropSize.width+'×'+record.cropSize.height+' · '+state);
  await context.close();
 }
 await fs.writeFile(out+'/captures.json',JSON.stringify({updatedAt:new Date().toISOString(),source:base,method:'Actual product screenshots in isolated empty contexts; per-product result states and regions. No model calls or real user state. Existing untouched captures retain their own timestamps.',records},null,2)+'\n');
}finally{await browser.close()}
