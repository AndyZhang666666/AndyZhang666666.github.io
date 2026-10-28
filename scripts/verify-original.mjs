import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {renderProductPrinciples} from '../assets/product-principles.mjs';
// Last published master. Approved changes: selected work, presentation and decorative indexes.
const baseline='05f4e98bed60a8a7188aea2423b483c3f6dadc2b';
const old=file=>execFileSync('git',['show',`${baseline}:${file}`],{maxBuffer:64*1024*1024});
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const files=execFileSync('git',['ls-tree','-r','--name-only',baseline],{encoding:'utf8'}).trim().split('\n');
const effects=files.filter(f=>!f.includes('/')&&(f.endsWith('.css')||f.endsWith('.js')&&!['app.js','jd.js','railnav.js','projects-split.js'].includes(f)));
for(const file of effects)assert.equal(hash(fs.readFileSync(file)),hash(old(file)),`Original design changed: ${file}`);
assert.equal(fs.readFileSync('railnav.js','utf8'),old('railnav.js').toString().replace("    top:       ['首页', 'Top'],","    top:       ['首页', 'Top'],\n    selected:  ['精选', 'Selected'],"),'Only the selected-work rail label is allowed');
const splitExpected=old('projects-split.js').toString()
 .replace("var ORDER = ['main', 'poker'];","var ORDER = ['main', 'cases', 'poker'];")
 .replace("    main:  { key: 'main',  zh: 'AI 产品与增长', en: 'AI Product & Growth' },","    main:  { key: 'main',  zh: 'AI 产品与增长', en: 'AI Product & Growth' },\n    cases: { key: 'cases', zh: '交付与研究案例', en: 'Delivery & Research Cases' },")
 .replace('var TARGET_PH = { main: 0, poker: 0 };','var TARGET_PH = { main: 0, cases: 0, poker: 0 };')
 .replace('  function isPoker(card) {',"  function isPoker(card) {\n    if (card.dataset.projectGroup) return card.dataset.projectGroup === 'poker';")
 .replace("var key = isPoker(card) ? 'poker' : 'main';","var key = card.dataset.projectGroup === 'cases' ? 'cases' : isPoker(card) ? 'poker' : 'main';");
assert.equal(fs.readFileSync('projects-split.js','utf8'),splitExpected,'Only the case group and explicit grouping by stable ID are allowed');
for(const file of ['assets/gen/portrait-dark.png','assets/gen/portrait-light.png','assets/resume.pdf'])assert.equal(hash(fs.readFileSync(file)),hash(old(file)),`Supplied asset changed: ${file}`);
const beforeHtml=old('index.html').toString(),afterHtml=fs.readFileSync('index.html','utf8');
const approvedPrinciples=`<div class="principle-grid" id="principleGrid" aria-label="产品原则与实践">${renderProductPrinciples(JSON.parse(old('data.json')).about.principles)}</div>`;
assert.ok(afterHtml.includes(approvedPrinciples),'Principle redesign must preserve the original three statements and approved evidence links');
const withoutIndexes=value=>value.replace(/\sdata-num="[^"]*"/g,'').replace(/^[ \t]*<span class="section-num">[^<]*<\/span>\n?/gm,'');
for(const id of ['top','about','ai','work','education','awards','uses','skills','jd','contact']){
 const section=html=>withoutIndexes(html.replace(approvedPrinciples,'<div class="principle-grid" id="principleGrid"></div>').match(new RegExp(`<section id="${id}"[\\s\\S]*?<\\/section>`))?.[0]||'').replaceAll('href="#selected"','href="#projects"');
 assert.ok(section(beforeHtml),`Missing protected section: ${id}`);
 assert.equal(section(afterHtml),section(beforeHtml),`Protected section changed: ${id}`);
}
const normalizedApp=value=>value.replace(/^[ \t]*<div class="(?:principle-num|ai-view-num)">[^\n]*<\/div>\n/gm,'').replace(/  const pg = document.getElementById\('principleGrid'\);[\s\S]*?  `\)\.join\(''\);/,"  // Keep the static, evidence-linked principles and their material interactions.\n  if (typeof window.refreshProductPrinciples === 'function') window.refreshProductPrinciples(a.principles || []);").replace(/data\.json\?v=[^']+/,'data.json?v=VERSION').replace(/function renderProjects\(\) \{[\s\S]*?\n\}\n\nfunction renderAwards/,'function renderAwards');
assert.equal(normalizedApp(fs.readFileSync('app.js','utf8')),normalizedApp(old('app.js').toString()),'Only project rendering, presentation indexes and the data cache version may change');
assert.ok(afterHtml.indexOf('<section id="about"')<afterHtml.indexOf('<section id="selected"'),'Selected work must follow About');
assert.ok(afterHtml.indexOf('<section id="selected"')<afterHtml.indexOf('<section class="stats"'),'Selected work must immediately follow the About section');
assert.ok(!/class="section-num"|\sdata-num=/.test(afterHtml),'Decorative section indexes must be removed');
const before=JSON.parse(old('data.json')),after=JSON.parse(fs.readFileSync('data.json'));
for(const key of Object.keys(before).filter(k=>k!=='projects'))assert.deepEqual(after[key],before[key],`Unrequested content changed: ${key}`);
assert.equal(after.projects.length,15);assert.equal(new Set(after.projects.map(p=>p.id)).size,15);
for(const [i,p]of before.projects.entries())for(const key of Object.keys(p))assert.deepEqual(after.projects[i][key],p[key],`Original project fact changed: ${i}/${key}`);
for(const file of files.filter(f=>/^(tasteroom|suibianju|demos\/filing-eval|grounded-choice)\//.test(f)))assert.equal(hash(fs.readFileSync(file)),hash(old(file)),`App implementation changed outside scope: ${file}`);
const provenance=JSON.parse(fs.readFileSync('assets/demo-preview/provenance.json'));
for(const source of provenance.sources)assert.equal(hash(fs.readFileSync(source.target)),source.outputSha256,`Pinned source drifted: ${source.target}`);
const report={baseline,verifiedAt:new Date().toISOString(),unchangedDesignFiles:effects,protectedSections:10,portraitsAndCvUnchanged:true,originalFactsUnchanged:true,unchangedProjectFacts:15,pinnedSources:provenance.sources.length};
fs.mkdirSync('.taste-skill/showcase',{recursive:true});fs.writeFileSync('.taste-skill/showcase/fidelity.json',JSON.stringify(report,null,2));
console.log(`PASS: ${effects.length} original CSS/effect files, 10 protected sections, portraits/CV, original facts and app source unchanged; 15 stable project IDs and pinned sources verified.`);
