// Presentation regression checks against the last published master.
// No browser, model call, network request or persistent browser state is required.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {
  applyPersonalPresentation,
  awardDestinations,
  renderContacts,
  renderHonours,
  renderIntro
} from '../content/personal-presentation.mjs';
import {selected} from '../content/showcase.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const published=file=>execFileSync('git',['show',`d9cacf6:${file}`],{cwd:root,encoding:'utf8'});
const baseline=JSON.parse(published('data.json'));
const current=JSON.parse(read('data.json'));
const html=read('index.html');
const originalHTML=published('index.html');
const app=read('app.js');
const presentationCSS=read('assets/personal-art-direction.css');
const clone=value=>structuredClone(value);
const without=(value,keys)=>Object.fromEntries(Object.entries(value).filter(([key])=>!keys.includes(key)));
const classes=element=>(element.class||'').split(/\s+/).filter(Boolean);
const decode=value=>value.replace(/&(?:amp|quot|#39|lt|gt);/g,entity=>({'&amp;':'&','&quot;':'"','&#39;':"'",'&lt;':'<','&gt;':'>'}[entity]));
function attributes(tag){
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(match=>[match[1],decode(match[2]??match[3])]));
}
const tags=(source,name)=>[...source.matchAll(new RegExp(`<${name}\\b[^>]*>`,'g'))].map(match=>attributes(match[0]));
const selectedIds=source=>tags(source,'a').filter(tag=>'data-selected-id' in tag).map(tag=>tag['data-selected-id']);

// Only the tagline, right-hand fact panel and award destinations may change in
// the supplied personal data. Protect the full career/education/AI/stat objects,
// not a hand-picked sample of their visible text or business numbers.
const allowed=['tagline','taglineEn','about','projects','awards','education'];
assert.deepEqual(
  without(current,allowed),without(baseline,allowed),
  'Presentation work changed protected personal, career, education, stats or AI data'
);
assert.deepEqual(without(current.about,['facts']),without(baseline.about,['facts']),
  'About copy outside the approved fact panel changed');
assert.equal(current.about.facts.length,4,'The about panel should contain four readable facts');
for(const fact of current.about.facts){
  for(const field of ['k','kEn','v','vEn'])assert.ok(fact[field]?.trim(),`Missing about fact ${field}`);
}
const awardText=award=>without(award,['url','linkLabel','linkLabelEn']);
assert.deepEqual(current.awards.map(awardText),baseline.awards.map(awardText),
  'An award name, result or metadata changed');
assert.deepEqual(current.contact,baseline.contact,'A supplied contact value changed');
const educationFacts=education=>education.map(entry=>({...entry,thesis:without(entry.thesis,['tags','tagsEn'])}));
assert.deepEqual(educationFacts(current.education),educationFacts(baseline.education),'Degree or thesis facts changed beyond approved tags');

// The reusable transformation must remain presentation-only when applied to
// the published data; generation must not depend on accidental local edits.
const transformed=applyPersonalPresentation(clone(baseline));
assert.deepEqual(without(transformed,['about','awards','education']),without(baseline,['about','awards','education']));
assert.deepEqual(current.education,transformed.education,'Generated thesis tags are stale');
assert.deepEqual(without(transformed.about,['facts']),without(baseline.about,['facts']));
assert.deepEqual(transformed.awards.map(awardText),baseline.awards.map(awardText));
assert.deepEqual(current.about.facts,transformed.about.facts,'Generated fact panel is stale');

// Integrate only the explicitly approved product copy from this immutable Demo
// delivery: c2eb81a26346480c0c8767f94768b917f8ee8cee. The four IDs may change
// description, approach, result and presentation.decision in both languages;
// only Eval may additionally change context/contextEn. Everything else, including
// all URLs, ownership, ordering, images, metadata and the other 13 projects,
// remains protected by a full-array equality check against the published data.
const approvedDemoCommit='c2eb81a26346480c0c8767f94768b917f8ee8cee';
const approvedDemoProjects=JSON.parse(execFileSync('git',['show',`${approvedDemoCommit}:data.json`],{cwd:root,encoding:'utf8'})).projects;
const approvedDemoCopyPaths={
  taste:['description','descriptionEn','approach','approachEn','result','resultEn','presentation.decision.zh','presentation.decision.en'],
  eval:['description','descriptionEn','context','contextEn','approach','approachEn','result','resultEn','presentation.decision.zh','presentation.decision.en'],
  commute:['description','descriptionEn','approach','approachEn','result','resultEn','presentation.decision.zh','presentation.decision.en'],
  bundle:['description','descriptionEn','approach','approachEn','result','resultEn','presentation.decision.zh','presentation.decision.en']
};
const expectedProjects=clone(baseline.projects);
for(const project of expectedProjects){
  const paths=approvedDemoCopyPaths[project.id];
  if(!paths)continue;
  const approved=approvedDemoProjects.find(candidate=>candidate.id===project.id);
  assert.ok(approved,`Approved Demo snapshot is missing ${project.id}`);
  for(const fieldPath of paths){
    const keys=fieldPath.split('.');
    let target=project,source=approved;
    for(const key of keys.slice(0,-1)){
      assert.ok(Object.hasOwn(target,key)&&Object.hasOwn(source,key),`Missing approved copy path ${project.id}.${fieldPath}`);
      target=target[key];source=source[key];
    }
    const leaf=keys.at(-1);
    assert.ok(Object.hasOwn(target,leaf)&&Object.hasOwn(source,leaf),`Missing approved copy field ${project.id}.${fieldPath}`);
    target[leaf]=clone(source[leaf]);
  }
}
assert.deepEqual(approvedDemoProjects,expectedProjects,
  'Pinned Demo delivery changed a project outside the explicit approved copy paths');
// No demo is removed, silently replaced or otherwise changed by integration.
const projectIds=current.projects.map(project=>project.id);
assert.deepEqual(current.projects.filter(p=>p.id!=='squid-lab'),expectedProjects,'An existing project changed outside the approved Demo copy');
assert.equal(projectIds.length,18,'Keep the existing 17 projects and the approved Squid Lab addition');
assert.equal(new Set(projectIds).size,18,'Project IDs must remain unique');
assert.deepEqual(projectIds.filter(id=>id!=='squid-lab'),baseline.projects.map(project=>project.id),'Existing project identity/order changed');
const cards=tags(html,'article').filter(tag=>'data-project-id' in tag);
assert.equal(cards.length,18,'Static library must include the 17 existing entries plus Squid Lab');
assert.deepEqual(cards.map(tag=>tag['data-project-id']).sort(),[...projectIds].sort(),'Static library is incomplete or duplicates a project');
const expectedSelected=['trust','taste','bundles','commute'];
assert.deepEqual(selected.map(project=>project.id),expectedSelected,'The four selected products changed');
assert.deepEqual(selectedIds(originalHTML),expectedSelected,'Published selected baseline is unexpected');
assert.deepEqual(selectedIds(html),expectedSelected,'The homepage selected entries changed');
assert.deepEqual(selected.map(project=>project.project),['eval','taste','bundle','commute']);

// These three entries are background reading, without demo-card boxes or
// misleading play buttons. Their detailed background remains accessible.
const caseRows=cards.filter(tag=>tag['data-project-group']==='cases');
assert.equal(caseRows.length,3,'There must be exactly three background practice rows');
assert.deepEqual(caseRows.map(tag=>tag['data-project-id']),['fde','research-agent','content']);
for(const row of caseRows){
  assert.ok(classes(row).includes('practice-row'),'Case entry is missing its reading-row presentation');
  assert.ok(!classes(row).includes('library-card'),'Case entry still uses a demo-card box');
}
const unboxedRule=presentationCSS.match(/\.project-library\s+\.practice-row\s*\{([^}]+)\}/)?.[1]||'';
assert.match(unboxedRule,/background\s*:\s*(?:none|transparent)/,'Practice rows retain a card background');
assert.match(unboxedRule,/box-shadow\s*:\s*none/,'Practice rows retain a card shadow');
assert.match(unboxedRule,/border-radius\s*:\s*0/,'Practice rows retain a rounded card box');
assert.ok(!tags(html,'div').some(tag=>classes(tag).includes('hero-scroll')),'Hero scroll cue is still in the page');

// Four palettes stay keyboard-addressable and keep their existing storage IDs.
const palettes=tags(html,'button').filter(tag=>classes(tag).includes('ps-btn'));
const expectedPalettes=[['frost','霜 · 象牙纸'],['copper','夜 · 深海'],['mist','陶 · 赤砂'],['indigo','野 · 苔原']];
assert.deepEqual(palettes.map(tag=>[tag['data-palette'],tag['data-name']]),expectedPalettes);
for(const palette of palettes){
  assert.equal(palette.type,'button');
  assert.equal(palette['aria-label'],palette['data-name']);
  assert.match(palette.style||'',/--sw-third\s*:/,'The palette swatch is missing its third tone');
}

// Official links explain their destination and do not change the supplied award
// statements. This is an offline destination check, not award verification.
const expectedAwardHosts=['www.bristol.ac.uk','www.jamesdysonaward.org','ucle.co','portal.bloombergforeducation.com'];
assert.equal(awardDestinations.length,4);
assert.equal(current.awards.length,4);
const honourLinks=tags(html,'a').filter(tag=>classes(tag).includes('honour-row'));
assert.equal(honourLinks.length,4,'All four official destinations must be static HTML');
for(const [index,award] of current.awards.entries()){
  const [url,label,labelEn]=awardDestinations[index];
  const parsed=new URL(url);
  assert.equal(parsed.protocol,'https:');
  assert.equal(parsed.hostname,expectedAwardHosts[index]);
  assert.equal(award.url,url);
  assert.equal(award.linkLabel,label);
  assert.equal(award.linkLabelEn,labelEn);
  assert.equal(honourLinks[index].href,url);
  assert.equal(honourLinks[index].target,'_blank');
  assert.ok(honourLinks[index].rel.split(/\s+/).includes('noopener'));
}
assert.ok(html.includes(renderHonours(current.awards)),'Generated award names/links are stale');
assert.ok(html.includes(renderContacts(current.contact)),'Contacts are missing from the generated HTML');
assert.ok(html.includes(renderIntro(current)),'The updated introduction is missing from static HTML');
for(const method of ['renderIntro','renderHonours','renderContacts']){
  assert.ok(app.includes(`window.personalPresentation.${method}`),`App redraw bypasses ${method}`);
}

// Keep the new presentation enhancement reproducible without loading a second
// site or replacing the original motion/background infrastructure.
const resources=[...tags(html,'link').map(tag=>({file:tag.href,type:'style'})),...tags(html,'script').map(tag=>({file:tag.src,type:tag.type}))];
for(const file of ['assets/personal-art-direction.css','assets/section-atmospheres.css','assets/personal-sections.mjs','assets/section-atmospheres.mjs']){
  const matches=resources.filter(resource=>(resource.file||'').split('?')[0]===file);
  assert.equal(matches.length,1,`Include ${file} exactly once`);
  assert.ok(fs.existsSync(path.join(root,file)),`Missing presentation resource: ${file}`);
  if(file.endsWith('.mjs'))assert.equal(matches[0].type,'module',`${file} must run as a module`);
}
assert.match(read('assets/personal-sections.mjs'),/from\s+['"]\.\.\/content\/personal-presentation\.mjs['"]/);
assert.match(read('scripts/update-content.mjs'),/transformPersonalHTML\(html,data\)/,'Content generation bypasses the personal presentation');

console.log('PASS: published facts, 17 existing projects plus Squid Lab and four selections preserved; three unboxed case rows, four palettes, official award links and presentation modules generated.');
