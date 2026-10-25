import assert from 'node:assert/strict';
import fs from 'node:fs';
const d=JSON.parse(fs.readFileSync(new URL('../data.json',import.meta.url)));
assert.equal(d.projects.length,15);
assert.equal(d.projects.filter(p=>p.url).length,12);
const urls=['poker-ev-calculator','poker-bankroll-sim','growth-experiment-lab','pricing-model-sim','bundle-lab'];
for(const id of urls){const p=d.projects.find(p=>p.github==='https://github.com/AndyZhang666666/'+id);assert.ok(p,id);assert.equal(p.url,'https://andyzhang666666.github.io/'+id+'/');assert.equal(p.metrics.length,p.metricsEn.length);assert.ok(p.description&&p.descriptionEn);assert.doesNotMatch(p.metrics.join(' '),/最优|高于它加注都成立|假阳性 5% →/);}
assert.match(d.projects.find(p=>p.github?.endsWith('/poker-bankroll-sim')).description,/保留余额/);
assert.match(d.projects.find(p=>p.github?.endsWith('/growth-experiment-lab')).description,/不把不显著等同于无效/);
assert.match(d.projects.find(p=>p.github?.endsWith('/pricing-model-sim')).description,/逐月去向/);
assert.match(d.projects.find(p=>p.github?.endsWith('/bundle-lab')).description,/既有顾客领折扣/);
console.log('PASS: 15 portfolio entries, 12 demo links, bilingual suite descriptions and bounded claims.');
