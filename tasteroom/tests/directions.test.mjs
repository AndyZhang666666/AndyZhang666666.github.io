import test from 'node:test';import assert from 'node:assert/strict';
import {Room,OPTIONS,validChoice} from '../engine.js';
import {createComparison,applyComparison,posterSvg,styleBrief} from '../experiments.js';
const content=['形式与秩序','把问题拆开\n把偏爱留下','同一内容，不同构图。','原创设计 / TasteRoom'];
test('directions are a bounded canvas dimension and preserve old profile compatibility',()=>{
 const room=new Room();assert.equal(validChoice('artDirection','swiss'),true);assert.equal(validChoice('artDirection','__proto__'),false);
 room.upsert('artDirection','swiss','explicit','work','本人确认');room.switchContext('work');assert.equal(room.canvas.artDirection,'swiss');room.switchContext('personal');assert.equal(room.canvas.artDirection,'free');
 const old=new Room();assert.equal(old.restore(JSON.stringify({version:1,memories:[],round:2,content:0,context:'personal'})),true);assert.equal(old.canvas.artDirection,'free');
});
test('comparison changes only direction; choosing once does not add a persistent rule',()=>{
 const room=new Room();room.round=2;const before={...room.canvas};const c=createComparison(room,'artDirection');assert.deepEqual(Object.keys(c.variants[0]).filter(k=>c.variants[0][k]!==c.variants[1][k]),['artDirection']);
 applyComparison(room,c,'b','once');assert.equal(room.canvas.artDirection,'swiss');for(const k of Object.keys(OPTIONS).filter(k=>k!=='artDirection'))assert.equal(room.canvas[k],before[k]);
 assert.equal(JSON.parse(room.save()).memories.length,0);assert.equal(styleBrief(room).rules.length,0);
});
test('both SVG compositions are self-contained, escaped, and export current content',()=>{
 const room=new Room();for(const d of ['swiss','deconstructed']){room.canvas.artDirection=d;const svg=posterSvg(room,content);assert.ok(svg.includes('viewBox="0 0 900 1200"'));assert.ok(svg.includes('把问题拆开'));assert.ok(svg.includes(`&quot;artDirection&quot;:&quot;${d}&quot;`));assert.ok(!svg.includes('<script'));assert.ok(!svg.includes('href='));}
 room.draftContent=['自定义','<img src=x onerror=alert(1)>','<script>bad()</script>','我的落款'];const svg=posterSvg(room,content);assert.ok(!svg.includes('<img'));assert.ok(!svg.includes('<script>'));assert.ok(svg.includes('&lt;img'));assert.ok(svg.includes('我的落款'));
 const saved=room.save(),restored=new Room();assert.equal(restored.restore(saved),true);assert.deepEqual(restored.draftContent,room.draftContent);
});
test('changing poster content invalidates a pending one-variable comparison',()=>{
 const room=new Room();room.round=2;const c=createComparison(room,'typography');room.draftContent=content;assert.throws(()=>applyComparison(room,c,'a','global'),/变化/);
});
test('a selected art direction compares Swiss and deconstructed compositions directly',()=>{
 const room=new Room();room.round=2;room.canvas.artDirection='swiss';const comparison=createComparison(room,'artDirection');
 assert.equal(comparison.variants[0].artDirection,'swiss');assert.equal(comparison.variants[1].artDirection,'deconstructed');
 assert.deepEqual(Object.keys(comparison.variants[0]).filter(k=>comparison.variants[0][k]!==comparison.variants[1][k]),['artDirection']);
});
