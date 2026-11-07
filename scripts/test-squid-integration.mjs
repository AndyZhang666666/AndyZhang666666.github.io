import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {squidProject} from '../content/squid-lab.mjs';
const read=p=>fs.readFileSync(p,'utf8');
const base=p=>execFileSync('git',['show',`32a393711aabcacdf6bc13d5015abf0c64ce4dfd:${p}`],{encoding:'utf8'});
test('all previous 17 projects, personal data and published module files remain unchanged',()=>{
 const old=JSON.parse(base('data.json')),now=JSON.parse(read('data.json'));
 assert.deepEqual(now.projects.filter(p=>p.id!=='squid-lab'),old.projects);
 assert.deepEqual({...now,projects:[]},{...old,projects:[]});
 assert.deepEqual(now.projects.find(p=>p.id==='squid-lab'),squidProject);
 for(const file of ['assets/demo-showcase.mjs','assets/demo-showcase.css','projects-split.js','assets/presentation-mode.mjs','assets/presentation-mode.css','assets/resume.pdf']){
  assert.deepEqual(fs.readFileSync(file),execFileSync('git',['show',`32a393711aabcacdf6bc13d5015abf0c64ce4dfd:${file}`],{maxBuffer:8000000}),file);
 }
});
test('homepage changes are scoped to the new entry, resource references, cache key and total count',()=>{
 let html=read('index.html'),old=base('index.html');
 assert.equal((html.match(/id="project-squid-lab"/g)||[]).length,1);
 html=html.replace(/<article id="project-squid-lab"[^]*?<\/article>\n?/,'');
 html=html.replace(/<link rel="stylesheet" href="assets\/squid-lab-preview.css[^\"]*">\n/,'').replace(/<script type="module" src="assets\/squid-lab-preview.mjs[^\"]*"><\/script>\n/,'');
 html=html.replaceAll('查看全部 18 项作品','查看全部 17 项作品').replaceAll('Explore all 18 projects','Explore all 17 projects');
 html=html.replace(/src="app\.js\?v=[^"]*"/,old.match(/src="app\.js\?v=[^"]*"/)[0]);
 assert.equal(html,old);
 assert.equal(read('app.js').replace(/data\.json\?v=[\w.-]+/g,base('app.js').match(/data\.json\?v=[\w.-]+/)[0]),base('app.js'));
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
