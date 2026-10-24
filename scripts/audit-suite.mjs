// A reproducible first-look inventory, NOT proof of complete product acceptance.
import fs from 'node:fs';
import path from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(new URL('..',import.meta.url).pathname);
const projects=JSON.parse(fs.readFileSync(path.join(root,'data.json'),'utf8')).projects;
const output=process.env.EVIDENCE_DIR||'/tmp/demo-suite-baseline';fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,channel:process.env.CHROME_CHANNEL||'chrome'});
const results=[];
try{
  for(const [index,project] of projects.entries()){
    if(!project.url){results.push({name:project.name,kind:'case-only',note:'No live demo claimed; not a runtime pass.'});continue;}
    const id=`${String(index+1).padStart(2,'0')}-${new URL(project.url).pathname.split('/').filter(Boolean).at(-1)||'poker-quiz'}`;
    const dir=path.join(output,id);fs.mkdirSync(dir,{recursive:true});
    const context=await browser.newContext();const page=await context.newPage();
    const errors=[],failed=[];page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push({url:r.url(),error:r.failure()?.errorText}));
    const result={id,name:project.name,url:project.url,source:project.github||null,kind:'first-look',errors,failed,widths:[]};
    try{
      const response=await page.goto(project.url,{waitUntil:'domcontentloaded',timeout:45000});result.http=response?.status();result.finalUrl=page.url();
      await page.waitForLoadState('networkidle',{timeout:8000}).catch(()=>{});
      for(const width of [1440,768,390]){
        await page.setViewportSize({width,height:1000});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
        result.widths.push(await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,overflow:document.documentElement.scrollWidth>innerWidth,h1:[...document.querySelectorAll('h1')].map(n=>n.innerText),buttons:[...document.querySelectorAll('button')].filter(n=>n.getBoundingClientRect().height).slice(0,28).map(n=>({text:n.innerText,disabled:n.disabled})),inputs:[...document.querySelectorAll('input,select,textarea')].slice(0,25).map(n=>({id:n.id,type:n.type,label:n.labels?.[0]?.innerText||n.getAttribute('aria-label'),value:n.value})),bodyHeight:document.body.scrollHeight})));
        await page.screenshot({path:path.join(dir,`${width}-fold.png`),animations:'disabled'});
      }
      fs.writeFileSync(path.join(dir,'visible-text.txt'),await page.locator('body').innerText());
    }catch(error){result.error=String(error);}
    results.push(result);fs.writeFileSync(path.join(output,'inventory.json'),JSON.stringify(results,null,2));await context.close();
    console.log(`${project.name}: HTTP ${result.http}; overflow ${result.widths.filter(x=>x.overflow).map(x=>x.width).join(',')||'none'}; errors ${errors.length}`);
  }
}finally{await browser.close();}
console.log(`Initial inventory only. Detailed workflows still require separate acceptance: ${output}`);
