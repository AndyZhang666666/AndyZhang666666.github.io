import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {squidProject} from '../content/squid-lab.mjs';
import {enhancePortfolioV2} from '../content/portfolio-v2.mjs';
import {patchMotionV2} from '../content/motion-v2.mjs';
const read=p=>fs.readFileSync(p,'utf8');
const base=p=>execFileSync('git',['show',`32a393711aabcacdf6bc13d5015abf0c64ce4dfd:${p}`],{encoding:'utf8'});
test('all previous 17 projects, personal data and published module files remain unchanged',()=>{
 const old=JSON.parse(base('data.json')),now=JSON.parse(read('data.json'));
 assert.deepEqual(now.projects.filter(p=>p.id!=='squid-lab'),old.projects);
 assert.deepEqual({...now,projects:[]},{...old,projects:[]});
 assert.deepEqual(now.projects.find(p=>p.id==='squid-lab'),squidProject);
 for(const file of ['assets/demo-showcase.css','assets/presentation-mode.mjs','assets/presentation-mode.css','assets/resume.pdf']){
  assert.deepEqual(fs.readFileSync(file),execFileSync('git',['show',`32a393711aabcacdf6bc13d5015abf0c64ce4dfd:${file}`],{maxBuffer:8000000}),file);
 }
 const reviewedShowcase=base('assets/demo-showcase.mjs')
  .replace("import {initExecution,initRag} from './new-work-previews.mjs';","import {initExecution,initRag} from './new-work-previews.mjs';\nimport {isMotionReduced} from './motion-governor.mjs?v=20261109-v2';")
  .replace("const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;","const reduced=()=>isMotionReduced()||document.hidden;");
 const versionedShowcase=reviewedShowcase.replace(/from '\.\/(showcase-motion|product-principles|new-work-previews)\.mjs'/g,"from './$1.mjs?v=20261109-v2'");
 assert.equal(read('assets/demo-showcase.mjs'),versionedShowcase,'Only resource versions and shared motion guard may change in selected product logic');
 // The V2 presentation now reorders existing poker DOM nodes. Data order and
 // project ownership above stay frozen; a whole-file freeze would prohibit
 // that explicitly approved behavior. Runtime order belongs in browser QA.
});
test('V2 homepage adds only the reviewed Hero, mobile directory and motion ownership changes',()=>{
 const before=file=>execFileSync('git',['show',`4ec678e8a96044b3f903424209c894511c984eaa:${file}`],{encoding:'utf8'});
 const html=read('index.html');
 assert.equal((html.match(/id="project-squid-lab"/g)||[]).length,1);
 assert.equal(html,enhancePortfolioV2(before('index.html')));
 assert.equal(read('app.js'),patchMotionV2(before('app.js')));
 assert.equal(read('data.json'),before('data.json'),'V2 must not alter any personal or project data');
});
test('homepage exercise is a versioned engine artifact and the new case has actual destinations',()=>{
 const data=JSON.parse(read('assets/squid-lab-preview.json'));
 assert.equal(data.question.answer,(data.players-1)*data.unit);
 assert.ok(data.question.options.includes(data.question.answer));
 assert.equal(data.sourceRepo,'AndyZhang666666/poker-squid-lab');
 assert.match(data.sourceSha256,/^[0-9a-f]{64}$/);
 const html=read('cases/squid/index.html');
 for(const href of ['/poker-squid-lab/','/#projects','https://github.com/AndyZhang666666/poker-squid-lab/blob/main/docs/VALIDATION.md'])assert.ok(html.includes(`href="${href}"`));
 assert.match(read('assets/squid-lab-preview.css'),/repeat\(2,minmax\(0,1fr\)\)/);
});
