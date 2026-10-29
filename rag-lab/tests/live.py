"""Read-only acceptance against the deployed GitHub Pages site; never calls a model."""
import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('RAG_LIVE_URL','https://andyzhang666666.github.io').rstrip('/')
OUT=ROOT/'evidence'
checks=[]
errors=[]
hashes={}
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=os.environ.get('CHROME_PATH','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'))
    context=browser.new_context(viewport={'width':1440,'height':1050},reduced_motion='reduce')
    page=context.new_page()
    page.on('pageerror',lambda error:errors.append(str(error)))
    requests=[];page.on('request',lambda request:requests.append(request.url))
    response=page.goto(BASE+'/rag-lab/');page.wait_for_load_state('networkidle')
    assert response.ok
    expect(page.locator('#modeLabel')).to_have_text('原创示例模式')
    expect(page.locator('#answerHeadline')).to_have_text('单次最长 14天')
    checks.append('Deployed /rag-lab/ serves interactive original example and retrieves 14-day current rule')
    page.screenshot(path=str(OUT/'online-desktop.png'),full_page=True)
    page.locator('[data-citation="MON-2:p1"]').click()
    expect(page.locator('#source-0')).to_be_focused()
    expect(page.locator('#source-0 mark')).to_have_text('显示器单次最长借用 14 天')
    checks.append('Online citation locates exact current original paragraph')
    page.locator('#historical').click();expect(page.locator('#answerHeadline')).to_have_text('单次最长 30天')
    checks.append('Online historical date chooses 30-day version')
    page.locator('#date').fill('2026-10-28');page.locator('#snapshot').select_option('revised')
    expect(page.locator('#stale')).to_be_visible()
    expect(page.locator('#answerHeadline')).to_have_text('单次最长 30天')
    page.locator('#runButton').click();expect(page.locator('#answerHeadline')).to_have_text('单次最长 10天')
    expect(page.locator('#source-0')).to_contain_text('MON-3:p1')
    checks.append('Online snapshot reruns retrieval; old result remains bound until rerun')
    page.get_by_role('button',name='资料不足').click();expect(page.locator('#answerStatus')).to_have_text('资料不足')
    assert page.locator('#sources .source').count()==0
    checks.append('Online missing deposit evidence does not invent an answer')
    page.locator('#question').fill('无人机最长能借多久？');page.locator('#runButton').click()
    expect(page.locator('#answerStatus')).to_have_text('依据冲突');expect(page.locator('#sources .source')).to_have_count(2)
    checks.append('Online contradictory rules retain both sources')
    page.locator('#role').select_option('admin');page.get_by_role('button',name='权限限制').click()
    expect(page.locator('#answerStatus')).to_have_text('资料不足')
    expect(page.locator('#answerNote')).to_contain_text('公开示例不含管理原文')
    assert 'QY-RESERVE-ORCHID' not in page.content()
    assert not [url for url in requests if '/api/' in url]
    checks.append('Public role switch contains no management original and performs no API/model requests')

    for file in ['index.html','app.mjs','engine.mjs','public-corpus.json']:
        r=page.request.get(BASE+'/rag-lab/'+file+'?release-check=1')
        assert r.ok,file
        local=hashlib.sha256((ROOT/file).read_bytes()).hexdigest()
        online=hashlib.sha256(r.body()).hexdigest()
        assert local==online,file+' must match pushed local source'
        hashes[file]=online
    assert 'QY-RESERVE-ORCHID' not in page.request.get(BASE+'/rag-lab/public-corpus.json').text()
    checks.append('Live HTML, JavaScript, retrieval engine and public corpus match local SHA-256 bytes')
    exclusions={}
    for path in ['/rag-lab/corpus/ADM-RES-1.md','/rag-lab/server/server.mjs','/rag-lab/tests/cases.json','/rag-lab/evidence/offline-records.json','/rag-lab/evidence/local-admin.png','/api/health']:
        r=page.request.get(BASE+path);exclusions[path]=r.status;assert r.status==404,(path,r.status)
    checks.append('Pages excludes backend, restricted corpus, tests and management run artifacts; no hosted API')

    phone=context.new_page();phone.set_viewport_size({'width':390,'height':844})
    phone.goto(BASE+'/rag-lab/');phone.wait_for_load_state('networkidle')
    expect(phone.locator('#answerHeadline')).to_have_text('单次最长 14天')
    assert phone.evaluate('document.documentElement.scrollWidth<=innerWidth')
    phone.screenshot(path=str(OUT/'online-mobile.png'),full_page=True)
    phone.locator('#conditionSettings > summary').click();phone.locator('#snapshot').select_option('revised');phone.locator('#runButton').click()
    expect(phone.locator('#answerHeadline')).to_have_text('单次最长 10天')
    phone.locator('[data-citation="MON-3:p1"]').click();expect(phone.locator('#source-0')).to_be_focused()
    checks.append('Deployed 390px layout supports condition change and source navigation without overflow')

    page.goto(BASE+'/#projects');page.wait_for_load_state('networkidle')
    expect(page.locator('#project-rag-lab [data-link-kind=demo]')).to_have_attribute('href','/rag-lab/')
    expect(page.locator('#project-agent-bench [data-link-kind=demo]')).to_have_attribute('href','/agent-bench/')
    expect(page.locator('.project-card')).to_have_count(17)
    checks.append('Deployed homepage includes all 17 projects and both RAG/Agent Bench entries')
    page.goto(BASE+'/agent-bench/');page.wait_for_load_state('networkidle')
    expect(page.locator('#case-select option')).to_have_count(10)
    page.locator('#case-select').select_option('timeout');page.locator('#watch').click()
    expect(page.locator('#play-status')).to_contain_text('播放结束')
    expect(page.locator('[data-policy=baseline] .state')).to_have_text('结果未知')
    checks.append('Deployed parallel Agent Bench timeout comparison remains operable')
    existing={}
    for path in ['/tasteroom/','/suibianju/','/demos/filing-eval/','/cases/trust/']:
        r=page.request.get(BASE+path);existing[path]=r.status;assert r.ok,(path,r.status)
    checks.append('Existing TasteRoom, Suibianju, Filing Eval and trust case return HTTP 200')
    assert not errors,errors
    report={'createdAt':datetime.now(timezone.utc).isoformat(),'base':BASE,'browser':browser.version,
            'checks':checks,'passed':len(checks),'pageErrors':errors,'sha256':hashes,'excludedPaths':exclusions,
            'existingPages':existing,'modelCalls':0,'liveBackend':'not deployed; local API only'}
    (OUT/'online-browser-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'passed':len(checks),'pageErrors':errors,'hashes':hashes},ensure_ascii=False))
    context.close();browser.close()
