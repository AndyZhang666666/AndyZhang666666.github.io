import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {selected,renderSelected,bundleFixture} from '../content/showcase.mjs';
import {directions,studies} from '../content/editorial.mjs';
import {simulateOne} from '../assets/demo-preview/bundle-model.mjs';
const read=p=>fs.readFileSync(p,'utf8'),hash=v=>crypto.createHash('sha256').update(v).digest('hex');
const data=JSON.parse(read('data.json')),html=read('index.html');
assert.deepEqual(selected.map(s=>s.id),['trust','taste','bundles','commute']);
assert.deepEqual(directions[0].order,['trust','taste','bundles','commute']);
for(const d of directions){assert.equal(d.order.length,4);assert.equal(new Set(d.order).size,4);assert.deepEqual([...d.order].sort(),selected.map(s=>s.id).sort());}
assert.equal(data.projects.length,17);for(const id of ['agent-bench','rag-lab','grounded','poker-quiz','bankroll','poker-ev'])assert.ok(data.projects.some(p=>p.id===id));
for(const s of selected){const p=data.projects.find(p=>p.id===s.project),study=studies.find(x=>x.id===s.id);assert.ok(p?.url&&p?.github);assert.equal(study?.project,p.id);assert.ok(html.includes(`data-selected-id="${s.id}"`));assert.ok(html.includes(`data-selected-demo="${s.project}"`));}
assert.equal(data.projects.find(p=>p.id==='bundle').url,'/bundle-lab/simulate/');
assert.equal(data.projects.find(p=>p.id==='bundle').analysisUrl,'/bundle-lab/');
assert.equal(html.includes(renderSelected(data)),true,'Default previews and destinations must be static HTML');
const evalSample=JSON.parse(read('assets/demo-preview/eval-sample.json'));assert.equal(evalSample.text.slice(evalSample.quoteOffset),evalSample.dimension.evidence[0]);
const c=bundleFixture.candidate;for(const a of [0,.05,.5,1]){const r=simulateOne({...c,adoption:a});assert.ok(Math.abs(r.addedMargin-r.existingLoss-r.marginLift)<1e-10);}
const commute=JSON.parse(read('assets/demo-preview/commute-example.json')),provenance=JSON.parse(read('assets/demo-preview/commute-provenance.json'));assert.equal(provenance.outputSha256,hash(read('assets/demo-preview/commute-example.json')));assert.equal(commute.routes.length,2);assert.equal(commute.modelVersion,'stable-route-seed-v2-2026-10-25');assert.ok(commute.tradeoff.pricePerHour>0);assert.ok(commute.focus.cheapest.every(id=>commute.routes.some(r=>r.id===id)));
const before=JSON.parse(execFileSync('git',['show','3e544d9:data.json'],{encoding:'utf8'}));
for(const key of Object.keys(before).filter(k=>k!=='projects'))assert.deepEqual(data[key],before[key],`Unrelated content changed: ${key}`);
const originalHTML=execFileSync('git',['show','3e544d9:index.html'],{encoding:'utf8'});
function section(source,id){const start=source.indexOf(`<section id="${id}"`);assert.ok(start>=0,id);let end=source.indexOf('<section id=',start+10);if(end<0)end=source.length;return source.slice(start,end).trim();}
for(const id of ['top','about','ai','experience','education']){
 if(originalHTML.includes(`<section id="${id}"`))assert.equal(section(html,id),section(originalHTML,id),`Protected section changed: ${id}`);
}
console.log('PASS: four directions, 17 projects, owned destinations, canonical preview inputs and unchanged protected content.');
