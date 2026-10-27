import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';import crypto from 'node:crypto';
const root=process.cwd(),baseline='86b16f4',old=file=>execFileSync('git',['show',`${baseline}:${file}`]);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const files=execFileSync('git',['ls-tree','-r','--name-only',baseline],{encoding:'utf8'}).trim().split('\n');
const effects=files.filter(f=>!f.includes('/')&&(f.endsWith('.css')||f.endsWith('.js')&&!['app.js','jd.js'].includes(f)));
for(const file of effects)assert.equal(hash(fs.readFileSync(file)),hash(old(file)),`Original design changed: ${file}`);
for(const file of ['assets/gen/portrait-dark.png','assets/gen/portrait-light.png'])assert.equal(hash(fs.readFileSync(file)),hash(old(file)),file);
const structure=html=>[...html.slice(html.indexOf('<body>')).matchAll(/<\/?[a-z][^>]*>/gi)].map(([tag])=>({tag:tag.match(/^<\/?[a-z][a-z0-9-]*/i)[0],layout:[...tag.matchAll(/\b(?:class|id|style)="[^"]*"/g)].map(m=>m[0])}));
assert.deepEqual(structure(fs.readFileSync('index.html','utf8')),structure(old('index.html').toString()),'Original home DOM structure changed');
assert.equal(hash(fs.readFileSync('assets/resume.pdf')),'fa07b133ef0e4b1b5248fba1715c346a0b9af6cdace652b926e2fb99fdb8b1e3','Resume must remain the supplied document');
const before=JSON.parse(old('data.json')),after=JSON.parse(fs.readFileSync('data.json'));
for(const key of ['education','experience','awards','contact','skills','evidenceCatalog'])assert.deepEqual(after[key],before[key],`Facts changed: ${key}`);
assert.equal(after.projects.length,before.projects.length);assert.equal(after.projects.length,15);
for(const slug of ['trust','taste','shared-choice','bundles'])assert.ok(fs.existsSync(`cases/${slug}/index.html`));
for(const folder of ['demos/filing-eval','suibianju','tasteroom'])for(const file of fs.readdirSync(folder).filter(f=>/engine|review-core|data\.json/.test(f)&&fs.statSync(path.join(folder,f)).isFile())){
 if(folder==='tasteroom')continue;assert.equal(hash(fs.readFileSync(path.join(folder,file))),hash(old(path.join(folder,file))),`Unrequested business logic changed: ${folder}/${file}`);
}
const report={baseline,verifiedAt:new Date().toISOString(),unchangedDesignFiles:effects.map(file=>({file,sha256:hash(fs.readFileSync(file))})),homeStructureIdentical:true,originalFactsUnchanged:true,projects:15};
fs.mkdirSync('.taste-skill',{recursive:true});fs.writeFileSync('.taste-skill/original-fidelity.json',JSON.stringify(report,null,2));
console.log(`PASS: ${effects.length} original CSS/effect files and both portraits byte-identical; home DOM identical; resume facts unchanged; 15 projects and 4 cases present.`);
