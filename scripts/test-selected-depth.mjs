import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {selected,renderSelected,bundleFixture} from '../content/showcase.mjs';
import {directions,studies} from '../content/editorial.mjs';
import {createTastePreview,posterContent} from '../assets/demo-preview/taste-session.mjs';
import {DIRECTIONS,directionSvg} from '../tasteroom/directions.js';
import {simulateOne,breakEvenAdoption} from '../assets/demo-preview/bundle-model.mjs';
import {rasterSize} from '../content/raster-size.mjs';
import {presentationCases,withPresentationQuery,withoutPresentationQuery} from '../content/presentation-mode.mjs';
import {enhancePortfolioV2} from '../content/portfolio-v2.mjs';
import {retrieveRun} from '../rag-lab/engine.mjs';
const read=p=>fs.readFileSync(p,'utf8'),hash=v=>createHash('sha256').update(v).digest('hex');
const baseline=JSON.parse(read('docs/verification/selected-depth-baseline-20261109.json'));
const base=process.env.SITE_BASELINE||baseline.revision,old=p=>execFileSync('git',['show',`${base}:${p}`],{encoding:'utf8'});
const data=JSON.parse(read('data.json')),prior=JSON.parse(old('data.json')),html=read('index.html');
const expected={all:['trust','taste','bundles','rag'],ai:['rag','trust','taste','bundles'],life:['taste','trust','rag','bundles'],growth:['bundles','trust','rag','taste']};
assert.deepEqual(selected.map(x=>x.id),expected.all);
for(const d of directions){assert.deepEqual(d.order,expected[d.id]);assert.equal(new Set(d.order).size,4);}
assert.equal(html.includes(renderSelected(data)),true,'All default content/links must be in HTML');
assert.equal(data.projects.length,prior.projects.length);assert.deepEqual(data.projects.map(p=>p.id),prior.projects.map(p=>p.id));
const ids=new Set(selected.map(s=>s.project));
assert.deepEqual(Object.keys(baseline.allowedProjectChanges),[...ids],'Only the four approved projects have content exceptions');
const protectedProject=(project,paths)=>{const copy=structuredClone(project);for(const path of paths){const keys=path.split('.');let owner=copy;for(const key of keys.slice(0,-1))owner=owner?.[key];if(owner)delete owner[keys.at(-1)];}return copy;};
for(const id of ids){const allowed=baseline.allowedProjectChanges[id];assert.deepEqual(protectedProject(data.projects.find(p=>p.id===id),allowed),protectedProject(prior.projects.find(p=>p.id===id),allowed),'Owned project changed outside explicit display-copy/image-size whitelist: '+id);}

for(const p of prior.projects)if(!ids.has(p.id))assert.deepEqual(data.projects.find(n=>n.id===p.id),p,'Unrelated project: '+p.id);
for(const k of Object.keys(prior).filter(k=>k!=='projects'))assert.deepEqual(data[k],prior[k],'Unrelated supplied facts: '+k);
for(const s of selected){const p=data.projects.find(p=>p.id===s.project),study=studies.find(study=>study.id===s.id);assert.ok(p.url&&p.github);assert.equal(study.project,p.id);assert.ok(html.includes(`data-selected-demo="${p.id}"`));assert.ok(read(`cases/${s.id}/index.html`).includes(study.summary.zh));}
assert.equal(data.projects.find(p=>p.id==='commute').url,'/commute-compare/');
for(const d of Object.keys(DIRECTIONS)){const {room}=createTastePreview(d);assert.ok(room.artwork);assert.equal(room.memories.length,0);assert.equal(room.canvas.artDirection,d);assert.ok(directionSvg(room,posterContent).includes('无用之美'));}
const c=bundleFixture.candidate;for(const adoption of [0,.05,.25,.5,1]){const r=simulateOne({...c,adoption});assert.ok(Math.abs(r.addedMargin-r.existingLoss-r.marginLift)<1e-10);}
const be=breakEvenAdoption(c);assert.ok(be.rate>0&&be.rate<1);assert.ok(html.includes((be.rate*100).toFixed(1)+'%'));
const corpus=JSON.parse(read('rag-lab/public-corpus.json'));assert.equal(corpus.documents.length,12);
for(const [date,snapshot,days] of [['2026-06-30','baseline','30天'],['2026-10-28','baseline','14天'],['2026-10-28','revised','10天']]){const run=retrieveRun(corpus.documents,{question:'显示器可以借多久？',date,snapshot,generation:'extractive'},'employee','original-example');assert.ok(run.facts.some(f=>f.value===days));assert.ok(run.citations.length);}
const manifest=JSON.parse(read('assets/demo-preview/provenance.json'));for(const source of manifest.sources)assert.equal(hash(read(source.target)),source.outputSha256);
const captures=JSON.parse(read('assets/work/showcase/captures.json')).records,oldCaptures=JSON.parse(old('assets/work/showcase/captures.json')).records;
for(const id of ids){const capture=captures.find(c=>c.id===id),p=data.projects.find(p=>p.id===id);assert.ok(capture?.capturedAt&&capture.state);assert.equal(hash(fs.readFileSync(capture.full)),capture.fullSha256);assert.equal(hash(fs.readFileSync(capture.crop)),capture.cropSha256);assert.deepEqual(p.presentation.coverSize,capture.cropSize);}
for(const c of oldCaptures)if(!ids.has(c.id))assert.deepEqual(captures.find(n=>n.id===c.id),c,'Unrelated capture changed: '+c.id);
function region(source,id){const start=source.indexOf(`<section id="${id}"`),tags=/<\/?section\b[^>]*>/g;assert.ok(start>=0,id);tags.lastIndex=start;let depth=0,m;while((m=tags.exec(source))){depth+=m[0].startsWith('</')?-1:1;if(depth===0)return source.slice(start,tags.lastIndex);}assert.fail('Unclosed '+id);}
const outsideOwnedContent=source=>{let result=source.replace(region(source,'selected'),'<section id="selected">APPROVED_SELECTED_CONTENT</section>');for(const id of ids)result=result.replace(new RegExp(`<article id="project-${id}"[^]*?</article>`),`<article id="project-${id}">APPROVED_PROJECT_CONTENT</article>`);return result.replace(/(assets\/demo-showcase\.(?:mjs|css)\?v=)[^"']*/g,'$1APPROVED_SELECTED_CACHE_KEY');};
assert.equal(outsideOwnedContent(html),outsideOwnedContent(old('index.html')),'Entire V2 homepage shell and other cards outside the explicit four-project boundary');
for(const id of ['top','about','ai','work','experience','education','awards','uses','skills','jd','contact'])if(old('index.html').includes(`<section id="${id}"`))assert.equal(region(html,id),region(old('index.html'),id),'Protected section: '+id);
for(const file of ['app.js','style.css','bg-layers.js','motion.js','interactions.css','assets/showcase-motion.mjs','assets/hero-paper.css','assets/mobile-navigation.css','assets/mobile-navigation.mjs','assets/motion-governor.css','assets/motion-governor.mjs','scripts/case-reader.js'])assert.equal(read(file),old(file),'Protected visual/interaction file: '+file);
const oldEducation=old('education.js');
const expectedEducation=oldEducation.slice(0,oldEducation.indexOf('  // Subject-specific geometry.')) +
  oldEducation.slice(oldEducation.indexOf('  // ---------- 1.')).replace('        thesisFigure(type) +','        window.AcademicArt.figure(type) +');
assert.equal(read('education.js'),expectedEducation,'Only thesis drawing ownership changed in education');
assert.equal(read('academic-art.js').split('  var paused = false;')[1],old('academic-art.js').split('  var paused = false;')[1],'Original motion and language controls');
assert.ok(read('education.css').startsWith(old('education.css')),'All preexisting education styles are preserved');
assert.equal(enhancePortfolioV2(html),html,'V2 enhancement and current selected resource revisions compose idempotently');
assert.deepEqual(Object.keys(presentationCases),expected.all,'Presentation follows the four current product-owned mechanisms');
for(const href of Object.values(presentationCases)){const url=new URL(href,'https://example.test');assert.ok(read(url.pathname.slice(1)+'index.html').includes(`id="${url.hash.slice(1)}"`),'Real case mechanism: '+href);const entered=new URL(withPresentationQuery(url.href));assert.equal(entered.searchParams.get('present'),'1');assert.equal(new URL(withoutPresentationQuery(entered.href)).href,url.href,'Presentation exit preserves route and anchor');}
for(const item of selected){
 const file=`cases/${item.id}/index.html`,current=read(file);
 assert.equal(current.replace(/<main>[^]*<\/main>/,'<main></main>'),old(file).replace(/<main>[^]*<\/main>/,'<main></main>'),'Approved V2 case shell/scripts: '+file);
 for(const [,image,width,height] of current.matchAll(/<img src="(\/assets\/work\/[^"]+)" width="(\d+)" height="(\d+)"/g))assert.deepEqual({width:Number(width),height:Number(height)},rasterSize(fs.readFileSync(image.slice(1))),'Actual image dimensions: '+image);
}
const snapshot=['index.html','data.json',...selected.map(s=>`cases/${s.id}/index.html`)].map(p=>[p,hash(read(p))]);
execFileSync(process.execPath,['scripts/update-content.mjs','--selected-only'],{stdio:'pipe'});for(const [file,value] of snapshot)assert.equal(hash(read(file)),value,'Idempotent current-shell generation: '+file);
console.log('PASS: PRD directions, four canonical previews,18 preserved projects, all supplied facts, protected visual sections and idempotent scoped generation.');
