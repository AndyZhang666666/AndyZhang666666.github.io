const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
  const base=process.env.BASE_URL||'http://127.0.0.1:8794';
  const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{channel:'chrome'})});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.goto(base+'/');await page.waitForSelector('.project-card');
    const card=page.locator('.project-card').filter({has:page.locator('a[href="https://andyzhang666666.github.io/suibianju/"]')});
    assert.equal(await page.locator('.project-card').count(),14);
    assert.equal(await card.getByRole('link',{name:'立即体验',exact:true}).getAttribute('href'),'https://andyzhang666666.github.io/suibianju/');
    assert.equal(await card.getByRole('link',{name:'查看源码',exact:true}).getAttribute('href'),'https://github.com/AndyZhang666666/AndyZhang666666.github.io/tree/main/suibianju');
    await card.scrollIntoViewIfNeeded();await card.getByRole('button',{name:'在此试用'}).click();
    const iframe=card.locator('iframe');await iframe.waitFor();assert((await iframe.getAttribute('src')).startsWith('https://andyzhang666666.github.io/suibianju/'));
    await card.getByRole('button',{name:'在此试用'}).click();
    await page.locator('#langToggle').click();assert.equal(await card.getByRole('link',{name:'Try it now',exact:true}).count(),1);assert.equal(await card.getByRole('link',{name:'View source',exact:true}).count(),1);
    await page.locator('#langToggle').click();
    for(const palette of ['frost','copper','mist','indigo']){await page.locator(`.ps-btn[data-palette="${palette}"]`).click();assert.equal(await page.locator('html').getAttribute('data-palette'),palette);}
    for(const width of [1440,768,390]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`homepage overflow at ${width}`);assert.equal(await card.getByRole('link',{name:'立即体验',exact:true}).count(),1);}
    assert.deepEqual(errors,[]);console.log('PASS: homepage has 14 projects; new demo/source links, inline entry, bilingual labels, all four themes, desktop/tablet/mobile layout; no page errors.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
