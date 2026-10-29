"""Regression of the existing homepage and repo-owned pages after incremental integration."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parents[2]
BASE=os.environ.get('RAG_STATIC_URL','http://127.0.0.1:4319')
OUT=ROOT/'rag-lab/evidence'
data=json.loads((ROOT/'data.json').read_text())
results=[]
errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=os.environ.get('CHROME_PATH','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'))
    page=browser.new_page(viewport={'width':1440,'height':1000},reduced_motion='reduce')
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto(BASE+'/#projects');page.wait_for_load_state('networkidle')
    expect(page.locator('.project-card')).to_have_count(len(data['projects']))
    for item in data['projects']:
        card=page.locator(f'[data-project-id="{item["id"]}"]')
        expect(card).to_have_count(1)
        if item.get('url'): expect(card.locator('[data-link-kind="demo"]')).to_have_attribute('href',item['url'])
    expect(page.locator('#project-rag-lab [data-link-kind="demo"]')).to_have_attribute('href','/rag-lab/')
    expect(page.locator('#project-rag-lab img')).to_be_visible()
    assert page.locator('#project-rag-lab img').evaluate('(el)=>el.complete && el.naturalWidth>0')
    page.wait_for_function('getComputedStyle(document.querySelector("#project-rag-lab .project-preview-fallback")).display === "none" && getComputedStyle(document.querySelector("#project-rag-lab .project-preview")).aspectRatio === "8 / 5"')
    page.locator('#project-rag-lab').screenshot(path=str(OUT/'homepage-card.png'))
    results.append('All original project links retained; one RAG card with real screenshot and correct destination')

    # Four existing previews keep their actual interactive behavior.
    page.goto(BASE+'/#selected');page.wait_for_load_state('networkidle')
    page.locator('[data-eval-locate]').click()
    expect(page.locator('[data-eval-source-quote] mark')).to_have_count(1)
    page.locator('[data-selected-id="taste"]').click()
    page.locator('[data-taste-direction="deconstructed"]').click()
    expect(page.locator('[data-selected-demo="taste"]')).to_have_attribute('href','/tasteroom/?direction=deconstructed')
    page.locator('[data-selected-id="shared-choice"]').click()
    page.locator('[data-shared-budget="85"]').click()
    expect(page.locator('[data-shared-count]')).to_have_text('1')
    page.locator('[data-selected-id="bundles"]').click()
    page.locator('[data-bundle-adoption="0.5"]').click()
    expect(page.locator('[data-bundle-net]')).to_have_text('+¥1.20')
    results.append('Existing evidence, taste, shared-choice and bundle previews remain operable')
    for width,height in [(390,844),(768,1024),(1440,1000)]:
        page.set_viewport_size({'width':width,'height':height})
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),str(width)
    results.append('Homepage remains without horizontal overflow at 390/768/1440px')

    for route in ['/tasteroom/','/suibianju/','/demos/filing-eval/','/cases/trust/','/cases/taste/','/cases/shared-choice/','/cases/bundles/','/agent-bench/']:
        target=ROOT/route.strip('/')/'index.html'
        if not target.exists(): continue
        response=page.goto(BASE+route);page.wait_for_load_state('networkidle')
        assert response.ok,route
        assert len(page.locator('body').inner_text())>100,route
        results.append(route+' loads and executes without page exceptions')
    expect(page.locator('#case-select option')).to_have_count(10)
    page.locator('#case-select').select_option('timeout')
    page.locator('#watch').click()
    expect(page.locator('#play-status')).to_contain_text('播放结束')
    expect(page.locator('#verdict')).to_be_visible()
    expect(page.locator('.result')).to_have_count(2)
    expect(page.locator('[data-policy=baseline] .state')).to_have_text('结果未知')
    results.append('Parallel Agent Bench timeout example retains two-policy comparison and unknown-receipt state')
    assert not errors,errors
    (OUT/'site-browser-results.json').write_text(json.dumps({'base':BASE,'projectCount':len(data['projects']),'checks':results,'pageErrors':errors,'scope':'Repo-owned pages and homepage previews, not third-party apps'},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'checks':len(results),'pageErrors':errors},ensure_ascii=False))
    browser.close()
