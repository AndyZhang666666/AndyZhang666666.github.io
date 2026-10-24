import test from 'node:test';
import assert from 'node:assert/strict';
import { createSession, blank, submit, vote, addMember, updateCandidate } from '../engine.mjs';
import { voluntaryPlans,prepareVoluntaryDraft,previewConditions,informationGaps,buildDecision,decisionText } from '../product.mjs';
const ready=()=>{const s=createSession();submit(s,'a',blank());return s;};
const conflict=()=>{const s=ready();submit(s,'c',{...blank(),budget:40,district:'中山路'});return s;};
test('budget-only proposals are opt-in, minimum-change sorted and do not mutate conditions',()=>{
 const s=conflict(),before=JSON.stringify(s),plans=voluntaryPlans(s,'c');
 assert.equal(plans[0].to,85);assert.equal(plans[0].delta,45);assert(plans.every(p=>p.to>=85));
 assert.equal(JSON.stringify(s),before);assert.deepEqual(voluntaryPlans(s,'a'),[]);
});
test('proposals never suggest relaxing dietary, location or excluded-cuisine restrictions',()=>{
 const s=conflict();submit(s,'c',{...blank(),budget:40,district:'河西',exclude:'烤肉',noSpicy:true});
 assert.deepEqual(voluntaryPlans(s,'c'),[]);
});
test('stale proposals and a forged target are rejected without mutation',()=>{
 const s=conflict(),p=voluntaryPlans(s,'c')[0];updateCandidate(s,'r1',{...s.candidates[0],max:90});
 const before=JSON.stringify(s);assert.throws(()=>prepareVoluntaryDraft(s,'c',p.id,p.version));
 assert.throws(()=>prepareVoluntaryDraft(s,'c','budget:r1:1',s.version));assert.equal(JSON.stringify(s),before);
});
test('proposal fills a draft, preview is side-effect-free, and only confirmation alters the session',()=>{
 const s=conflict(),p=voluntaryPlans(s,'c')[0],draft=prepareVoluntaryDraft(s,'c',p.id,p.version);
 const before=JSON.stringify(s),preview=previewConditions(s,'c',draft);
 assert.equal(preview.after[0].id,'r1');assert.equal(JSON.stringify(s),before);assert.equal(s.members[2].conditions.budget,40);
 submit(s,'c',draft);assert.equal(s.members[2].conditions.budget,85);
});
test('preview warns when a change would invalidate already given votes',()=>{
 const s=ready();vote(s,'a','r1','yes');const p=previewConditions(s,'a',{...blank(),prefer:'粤菜'});
 assert(p.invalidatesVotes);assert.equal(s.votes.a.choice,'yes');
 assert.equal(previewConditions(s,'a',blank()).invalidatesVotes,false);
});
test('unknown facts remain unknown, and decision export requires full current-version consensus',()=>{
 const s=ready();assert(informationGaps(s).some(g=>g.id==='r4'));assert.throws(()=>buildDecision(s));
 for(const m of s.members)vote(s,m.id,'r1','yes');
 const d=buildDecision(s);assert.equal(d.accepted,3);const text=decisionText(s);
 assert(text.includes('不是'));assert(!text.includes('上周刚吃过'));assert(!text.includes('人均最多 120'));
 submit(s,'a',{...blank(),budget:100});assert.throws(()=>buildDecision(s));
});
test('a fourth and fifth member require fresh confirmation and cannot exceed capacity',()=>{
 const s=ready();for(const m of s.members)vote(s,m.id,'r1','yes');
 const id=addMember(s,'模拟朋友四');assert.equal(s.members.length,4);assert.equal(s.members.find(m=>m.id===id).confirmed,false);
 assert.deepEqual(s.votes,{});addMember(s,'模拟朋友五');assert.throws(()=>addMember(s,'第六位'));
});
