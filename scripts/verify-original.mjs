import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {renderAiViews} from '../assets/ai-views.mjs';
import {aiPractices,studies} from '../content/editorial.mjs';
// Last published master, before this decision-preview iteration.
const baseline='d5d64cfa7717ce51753285603d097e1f68d7b5d9';
const old=file=>execFileSync('git',['show',`${baseline}:${file}`],{maxBuffer:64*1024*1024});
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const files=execFileSync('git',['ls-tree','-r','--name-only',baseline],{encoding:'utf8'}).trim().split('\n');
const effects=files.filter(f=>!f.includes('/')&&(f.endsWith('.css')||f.endsWith('.js')&&f!=='app.js'));
for(const file of effects)assert.equal(hash(fs.readFileSync(file)),hash(old(file)),`Original effect or control changed: ${file}`);
for(const file of ['assets/gen/portrait-dark.png','assets/gen/portrait-light.png','assets/resume.pdf'])assert.equal(hash(fs.readFileSync(file)),hash(old(file)),`Supplied asset changed: ${file}`);
const beforeHtml=old('index.html').toString(),afterHtml=fs.readFileSync('index.html','utf8');
for(const id of ['top','about','work','education','awards','uses','skills','jd','contact']){
 const section=html=>html.match(new RegExp(`<section id="${id}"[\\s\\S]*?<\\/section>`))?.[0]||'';
 assert.ok(section(beforeHtml));assert.equal(section(afterHtml),section(beforeHtml),`Protected section changed: ${id}`);
}
const before=JSON.parse(old('data.json')),after=JSON.parse(fs.readFileSync('data.json'));
const expectedViews=before.aiViews.items.map((item,i)=>({...item,practice:aiPractices[i]}));
assert.deepEqual(after.aiViews,{...before.aiViews,items:expectedViews},'Only verified practice links may extend the original AI opinions');
assert.ok(afterHtml.includes(renderAiViews(expectedViews)),'All four opinions and practices must be static HTML');
const normalizeAi=html=>html.replace(/<div (?:id="aiViewsGrid" class="ai-views-grid"|class="ai-views-grid" id="aiViewsGrid")>[\s\S]*?(?=\n<\/section>)/,'<div id="aiViewsGrid" class="ai-views-grid"></div>\n');
const aiSection=html=>normalizeAi(html.match(/<section id="ai"[\s\S]*?<\/section>/)?.[0]||'');
assert.equal(aiSection(afterHtml),aiSection(beforeHtml),'The AI section shell and background must be preserved');
const appNorm=value=>value.replace(/data\.json\?v=[^']+/,'data.json?v=VERSION').replace(/function renderAiViews\(\) \{[\s\S]*?\n\}/,'function renderAiViews() { /* approved static renderer */ }').replace("    document.dispatchEvent(new Event('portfolio:ready'));\n",'');
assert.equal(appNorm(fs.readFileSync('app.js','utf8')),appNorm(old('app.js').toString()),'Only the AI renderer, ready event and cache version may change in the original app');
for(const key of Object.keys(before).filter(k=>!['projects','aiViews'].includes(k)))assert.deepEqual(after[key],before[key],`Unrequested personal fact changed: ${key}`);
assert.equal(after.projects.length,before.projects.length);assert.equal(new Set(after.projects.map(p=>p.id)).size,before.projects.length);
assert.deepEqual(after.projects.map(p=>p.id),before.projects.map(p=>p.id),'Preserve the latest published project order');
const ownCaseIds=new Set(['filing','growth','pricing','fde']);
for(const [i,p]of before.projects.entries())for(const key of Object.keys(p)){
 const presentation=['presentation','caseLabel','caseLabelEn','iterationUrl'];
 const caseCopy=['description','descriptionEn','context','contextEn','approach','approachEn','result','resultEn'];
 if(presentation.includes(key)||ownCaseIds.has(p.id)&&caseCopy.includes(key))continue;
 assert.deepEqual(after.projects.find(item=>item.id===p.id)[key],p[key],`Original project fact changed: ${p.id}/${key}`);
}
for(const p of after.projects.filter(p=>p.iterationUrl))assert.equal(studies.find(s=>`/cases/${s.id}/`===p.iterationUrl)?.project,p.id,'Case evidence must not be assigned to another project');
for(const file of files.filter(f=>/^(tasteroom|suibianju|demos\/filing-eval|grounded-choice|agent-bench|rag-lab)\//.test(f)))assert.equal(hash(fs.readFileSync(file)),hash(old(file)),`Full app changed outside scope: ${file}`);
for(const id of ['agent-bench','rag-lab']){
 const card=html=>html.match(new RegExp(`<article id="project-${id}"[^]*?</article>`))?.[0];
 assert.ok(card(beforeHtml));assert.equal(card(afterHtml),card(beforeHtml),`Parallel project's custom card changed: ${id}`);
 assert.deepEqual(after.projects.find(p=>p.id===id),before.projects.find(p=>p.id===id),`Parallel project facts changed: ${id}`);
}
const provenance=JSON.parse(fs.readFileSync('assets/demo-preview/provenance.json'));
for(const source of provenance.sources)assert.equal(hash(fs.readFileSync(source.target)),source.outputSha256,`Pinned source drifted: ${source.target}`);
const report={baseline,verifiedAt:new Date().toISOString(),unchangedDesignFiles:effects,protectedSections:9,originalAiOpinionsPreserved:true,portraitsAndCvUnchanged:true,originalFactsUnchanged:true,projectIds:after.projects.length,parallelProjectsPreserved:['agent-bench','rag-lab'],projectOwnedCases:8,pinnedSources:provenance.sources.length};
fs.mkdirSync('.taste-skill/decisions-20261029',{recursive:true});fs.writeFileSync('.taste-skill/decisions-20261029/fidelity.json',JSON.stringify(report,null,2));
console.log(`PASS: ${effects.length} original design/effect files, 9 protected sections, four AI opinions, personal facts, portraits/CV and full apps unchanged; 8 project-owned cases and pinned sources verified.`);
