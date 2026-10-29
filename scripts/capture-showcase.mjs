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
 for(const id of (process.argv.slice(2).length?process.argv.slice(2):['eval','taste','suibianju','bundle'])){
  const context=await browser.newContext({viewport:{width:1280,height:1000},reducedMotion:'reduce'}),page=await context.newPage();
  const route={eval:'/llm-output-eval/',taste:'/tasteroom/?direction=swiss',suibianju:'/suibianju/',bundle:'/bundle-lab/simulate/'}[id];
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const response=await page.goto(base+route,{waitUntil:'networkidle'});if(!response?.ok())throw Error(route+' did not load');
  await page.evaluate(()=>document.fonts.ready);
  let region,state;
  if(id==='eval'){
   await page.locator('.dimension-card').filter({hasText:'结构完整性'}).locator('.evidence-link').first().click();
   await page.locator('.evidence-context mark').waitFor();
   await page.locator('.evidence-review select').selectOption('needs_context');
   await page.locator('.evidence-review textarea').fill('引句确实存在；需结合完整故事结构，再判断是否支持原评语。');
   const review=await page.locator('.evidence-review').boundingBox(),verdict=await page.locator('.evidence-review select').boundingBox(),scroll=await page.evaluate(()=>({x:scrollX,y:scrollY}));
   if(!review||!verdict)throw Error('The independent verdict field must be visible');
   region={clip:{x:review.x+scroll.x,y:review.y+scroll.y,width:review.width,height:verdict.y+verdict.height-review.y+15}};
   state='Historical structure score, located quotation, independent needs-context review. Review is made only in this disposable capture context.';
  }else if(id==='taste'){
   await page.locator('#rememberDirection').click();await page.locator('#startComparison').click();
   await page.locator('#comparisonDimension').selectOption('typography');await page.locator('[data-comparison-side=b]').click();
   region=page.locator('#comparisonVariants');state='Canonical single-variable typography comparison; B chosen, scope not yet authorised. Full image also shows the explicit scope options.';
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
  }else{
   await page.locator('#picked').selectOption('可乐 + 鸡腿饭');
   await page.locator('#scenario-result').waitFor();region=page.locator('#scenario-result');
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
