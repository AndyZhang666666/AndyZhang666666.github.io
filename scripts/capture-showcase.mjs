import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.SHOWCASE_BASE_URL||'http://127.0.0.1:8811';
const routes=[['eval','/llm-output-eval/'],['taste','/tasteroom/?direction=swiss'],['suibianju','/suibianju/'],['bundle','/bundle-lab/simulate/'],['filing','/demos/filing-eval/'],['grounded','/grounded-choice/'],['growth','/growth-experiment-lab/'],['pricing','/pricing-model-sim/'],['commute','/commute-compare/']];
const out='assets/work/showcase';await fs.mkdir(out,{recursive:true});const records=[];
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 const page=await context.newPage();
 for(const [id,route] of routes){
  const response=await page.goto(base+route,{waitUntil:'networkidle'});if(!response?.ok())throw Error(route+' did not load.');
  await page.evaluate(()=>document.fonts.ready);
  if(id==='eval'){await page.locator('.evidence-link').first().click();await page.locator('.evidence-context mark').waitFor();}
  if(id==='taste'){await page.locator('[data-direction=swiss]').click();await page.locator('#directionPreview svg').waitFor();await page.locator('#directionPreview').scrollIntoViewIfNeeded();}
  if(id==='suibianju'){await page.getByRole('button',{name:'开始快速体验',exact:true}).click();await page.locator('.results').waitFor();}
  const full=`${out}/${id}.jpg`,crop=`${out}/${id}-crop.jpg`;
  await page.screenshot({path:full,type:'jpeg',quality:86});
  // A literal crop of the working product, with an uncropped viewport available in the lightbox.
  const clip={x:24,y:100,width:1392,height:870};
  await page.screenshot({path:crop,type:'jpeg',quality:86,clip});
  records.push({id,route,full,crop,viewport:{width:1440,height:1000},clip,fullSha256:crypto.createHash('sha256').update(await fs.readFile(full)).digest('hex'),cropSha256:crypto.createHash('sha256').update(await fs.readFile(crop)).digest('hex')});
 }
 await fs.writeFile(out+'/captures.json',JSON.stringify({capturedAt:new Date().toISOString(),source:base,method:'Browser captures of the locally served, current app builds. Isolated empty browser context; no model calls, saved reviews or preference memories.',records},null,2)+'\n');
 console.log('Captured '+records.length+' real product screens with crops and full-screen alternatives.');
}finally{await browser.close()}
