import test from 'node:test';
import assert from 'node:assert/strict';
import {Room,OPTIONS,parseFeedback} from '../engine.js';
import {createComparison,applyComparison,comparisonIsCurrent,styleBrief,briefMarkdown,posterSvg} from '../experiments.js';
const setup=()=>{const r=new Room();r.choose('b');r.choose('b');r.reconcile();return r;};

test('all five comparisons hold content and other dimensions constant, with no write',()=>{
  const r=setup(),before=r.save();
  for(const dimension of Object.keys(OPTIONS)){
    const c=createComparison(r,dimension);
    assert.deepEqual(Object.keys(OPTIONS).filter(d=>c.variants[0][d]!==c.variants[1][d]),[dimension]);
    assert.equal(c.content,r.content);assert.equal(c.context,r.context);
  }
  assert.equal(r.save(),before);
});
test('both rejected means no new memory or canvas change',()=>{
  const r=setup(),before=r.save(),canvas={...r.canvas};
  applyComparison(r,createComparison(r,'typography'),'skip');
  assert.equal(r.save(),before);assert.deepEqual(r.canvas,canvas);
});
test('current-context consent writes exactly one explicit dimension and preserves work',()=>{
  const r=setup();r.upsert('typography','mono_tech','explicit','work','work');
  const before={...r.canvas},c=createComparison(r,'typography');
  const m=applyComparison(r,c,'b','current');
  assert.equal(m.context,'personal');assert.equal(m.type,'explicit');assert.equal(m.evidence.method,'single-variable');
  for(const d of Object.keys(OPTIONS).filter(d=>d!=='typography'))assert.equal(r.canvas[d],before[d]);
  r.switchContext('work');assert.equal(r.canvas.typography,'mono_tech');
  r.switchContext('personal');assert.equal(r.canvas.typography,c.variants[1].typography);
});
test('once consent affects this canvas only and is excluded from saved rules',()=>{
  const r=setup(),saved=r.save(),c=createComparison(r,'colorMood');
  applyComparison(r,c,'b','once');assert.equal(r.canvas.colorMood,c.variants[1].colorMood);
  assert.equal(r.save(),saved);r.reconcile();assert.equal(r.canvas.colorMood,c.variants[0].colorMood);
});
test('global consent explicitly supersedes scene rules for this dimension',()=>{
  const r=setup();r.upsert('typography','mono_tech','explicit','work','work');
  const c=createComparison(r,'typography');applyComparison(r,c,'b','global');
  for(const ctx of ['personal','work','global']){r.switchContext(ctx);assert.equal(r.canvas.typography,c.variants[1].typography);}
  assert.equal(r.memories.filter(m=>m.status==='active'&&m.dimension==='typography').length,1);
});
test('stale and tampered comparisons cannot write or cross scene boundaries',()=>{
  const r=setup(),c=createComparison(r,'typography');r.content++;
  assert.equal(comparisonIsCurrent(r,c),false);assert.throws(()=>applyComparison(r,c,'a','current'));
  const fresh=createComparison(r,'typography');fresh.variants[1].colorMood='high_contrast';
  const saved=r.save();assert.throws(()=>applyComparison(r,fresh,'b','current'));assert.equal(r.save(),saved);
  assert.throws(()=>createComparison(r,'__proto__'));
});
test('pending conflict blocks comparison, and invalid scope is not accepted',()=>{
  const r=setup(),c=createComparison(r,'typography');
  assert.throws(()=>applyComparison(r,c,'b','automatic'));
  r.feedback('typography','rational_sans','work');assert.throws(()=>createComparison(r,'typography'));
  assert.throws(()=>applyComparison(r,c,'b','global'));
});
test('global view cannot pretend to be a private current context',()=>{
  const r=setup();r.switchContext('global');const c=createComparison(r,'typography');
  assert.throws(()=>applyComparison(r,c,'b','current'));
  applyComparison(r,c,'b','global');assert.equal(r.canvas.typography,c.variants[1].typography);
});
test('brief separates temporary canvas from persistent clues and explicit rules',()=>{
  const r=setup(),c=createComparison(r,'typography');applyComparison(r,c,'b','once');
  const brief=styleBrief(r);
  assert.equal(brief.canvas.typography,c.variants[1].typography);
  assert.equal(brief.rules.find(m=>m.dimension==='typography').value,c.variants[0].typography);
  assert.ok(briefMarkdown(r).includes('待验证线索'));assert.ok(!briefMarkdown(r).includes('78%'));
});
test('SVG is self-contained, escaped, and does not leak feedback or memory metadata',()=>{
  const r=setup();r.memories[0].sourceReason='PRIVATE_FEEDBACK';
  const svg=posterSvg(r,['category','<script>alert(1)</script><br>海报','<img src=x>','footer']);
  assert.ok(svg.includes('&lt;script&gt;'));assert.ok(!svg.includes('<script>'));assert.ok(!svg.includes('PRIVATE_FEEDBACK'));
  assert.ok(!/foreignObject|https?:\/\//.test(svg.replace('http://www.w3.org/2000/svg','')));
});
test('reload preserves content and retains long-lived active rules after many corrections',()=>{
  const r=setup();r.content=2;
  for(let i=0;i<180;i++)r.upsert('colorMood',i%2?'high_contrast':'monochrome','explicit','personal','test');
  const n=new Room();assert.equal(n.restore(r.save()),true);assert.equal(n.content,2);
  assert.equal(n.canvas.layoutDensity,'airy');assert.equal(n.canvas.typography,'editorial_serif');
  assert.ok(n.memories.length<=150);
});
test('ambiguous multi-dimensional or negated input is not silently partially applied',()=>{
  for(const text of ['不要居中','别用暖色','多留白，改成黑白','紧凑一点但多留白'])assert.equal(parseFeedback(text),null);
  assert.equal(parseFeedback('不要留白').value,'compact');
  assert.equal(parseFeedback('别把字体改成衬线体，工作要利落').value,'rational_sans');
});
