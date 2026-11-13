// Narrow display smoke. Reads the two exact, previously published screenshots only.
import assert from 'node:assert/strict';import fs from 'node:fs';
import {evalPublicCoverUrl,ragPublicCoverPath} from '../content/public-covers.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PUBLIC_COVER_BASE||'http://127.0.0.1:8876';
const browser=await chromium.launch({channel:'chrome',headless:true});const checks=[],errors=[];
try{const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));
 for(const [route,selector,source]of [['/','#project-eval img',evalPublicCoverUrl],['/','#project-rag-lab img',ragPublicCoverPath],['/cases/trust/','.case-figure img',evalPublicCoverUrl],['/cases/rag/','.case-figure img',ragPublicCoverPath]]){
  await page.goto(base+route,{waitUntil:'domcontentloaded'});const image=page.locator(selector).first();assert.equal(await image.getAttribute('src'),source);await image.scrollIntoViewIfNeeded();await image.evaluate(image=>image.decode());const dimensions=await image.evaluate(image=>({width:image.naturalWidth,height:image.naturalHeight}));assert.deepEqual(dimensions,{width:1440,height:1000});checks.push({route,selector,src:source,...dimensions});
 }assert.deepEqual(errors,[]);fs.writeFileSync('docs/verification/public-covers-20261113.json',JSON.stringify({passed:true,checkedAt:new Date().toISOString(),base,scope:'Four display nodes only: two library cards and two owned case images. No image upload or transformation; no app tasks or model calls.',checks,errors},null,2)+'\n');console.log('PASS: two public screenshots load at intrinsic1440×1000 on both cards and owned cases.');
}finally{await browser.close();}
