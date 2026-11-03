import test from 'node:test';
import assert from 'node:assert/strict';
import {Room,validChoice} from '../engine.js';
import {trialParameter,savePreference} from '../exports.js';
import {feedbackSuggestions,revokePreference,restorePreferenceSnapshot,memoryTime} from '../interaction-helpers.js';
import {parseBrief} from '../preferences.js';
import {briefMarkdown} from '../experiments.js';

test('bookshop feedback offers deliberate temporary choices, without touching memory',()=>{
 const r=new Room(),before=r.save();const hints=feedbackSuggestions('像独立书店邀请函，别像促销海报');
 assert.equal(hints.choices.length,3);assert.ok(hints.choices.some(c=>c.dimension==='layoutDensity'&&c.value==='airy'));
 assert.ok(hints.choices.some(c=>c.setting==='titleScale'));
 assert.equal(r.save(),before);
 for(const text of ['工作汇报','完全未知的表达'])for(const c of feedbackSuggestions(text).choices)assert.ok(validChoice(c.dimension,c.value));
});
test('work and personal authorizations stay independent; undo keeps the current artwork',()=>{
 const r=new Room();r.round=2;r.context='personal';savePreference(r,'artDirection','editorial','current');
 r.context='work';const before=JSON.stringify(r);savePreference(r,'artDirection','swiss','current');
 trialParameter(r,'layoutDensity','airy');r.draftContent=['自定义','我的活动','没有授权也可导出','作者'];r.posterSettings.titleScale=1.1;
 const canvas=JSON.stringify(r.canvas),content=JSON.stringify(r.draftContent),settings=JSON.stringify(r.posterSettings);
 restorePreferenceSnapshot(r,before);
 assert.equal(JSON.stringify(r.canvas),canvas);assert.equal(JSON.stringify(r.draftContent),content);assert.equal(JSON.stringify(r.posterSettings),settings);
 assert.ok(r.memories.some(m=>m.context==='personal'&&m.status==='active'&&m.preference==='editorial'));
 assert.equal(r.memories.filter(m=>m.context==='work'&&m.status==='active').length,0);
 const personal=r.memories.find(m=>m.context==='personal'&&m.status==='active');
 assert.ok(revokePreference(r,personal.id));assert.equal(JSON.stringify(r.canvas),canvas);
 assert.equal(revokePreference(r,personal.id),false);
});
test('new memory has operation time, old memory remains explicitly untimed, old scope labels import',()=>{
 const r=new Room();r.upsert('artDirection','japanese','explicit','personal','本人确认');
 assert.match(memoryTime(r.memories[0]),/本机操作时间/);
 assert.equal(memoryTime({}),'旧规则 · 时间未保存');
 const markdown=briefMarkdown(r);assert.equal(parseBrief(markdown).rules[0].scope,'personal');
 assert.equal(parseBrief(markdown.replaceAll('个人展览／活动','日常审美')).rules[0].scope,'personal');
});
