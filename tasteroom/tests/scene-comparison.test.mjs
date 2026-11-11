import test from 'node:test';
import assert from 'node:assert/strict';
import {Room,BASE} from '../engine.js?v=20261027-studio1';
import {artworkDefault} from '../artwork.js';
import {compareAuthorizedScenes,authorizedSceneView,namespaceSceneSvg} from '../scene-comparison.js';
import {posterSvg} from '../experiments.js?v=20261027-studio1';

const content=['分享活动','让想法\n变成作品','周末一起讨论。','原创虚构活动'];
const create=()=>{const room=new Room();room.round=2;room.artwork=artworkDefault();return room;};
const snapshot=room=>JSON.stringify(room);

test('unremembered scenes use defaults, not the current temporary canvas or implicit guesses',()=>{
 const room=create();room.canvas.artDirection='japanese';room.upsert('typography','mono_tech','implicit','personal','只是线索');
 const before=snapshot(room),comparison=compareAuthorizedScenes(room,content);
 assert.deepEqual(comparison.scenes.map(s=>s.canvas),[{...BASE},{...BASE}]);
 assert.deepEqual(comparison.differences,[]);assert.equal(snapshot(room),before);
 assert.ok(comparison.scenes.every(s=>s.appliedRules.length===0));
});
test('scene-specific authorization takes precedence over global using the existing rule resolver',()=>{
 const room=create();room.upsert('artDirection','swiss','explicit','global','本人授权');
 room.upsert('artDirection','japanese','explicit','personal','本人授权');
 room.upsert('colorMood','monochrome','explicit','work','本人授权');
 const before=snapshot(room),{scenes,differences}=compareAuthorizedScenes(room,content);
 assert.equal(scenes[0].canvas.artDirection,'japanese');assert.equal(scenes[1].canvas.artDirection,'swiss');
 assert.equal(scenes[1].canvas.colorMood,'monochrome');
 assert.deepEqual(differences.map(d=>d.dimension),['artDirection','colorMood']);
 assert.deepEqual(differences[0].personal,{value:'japanese',origin:'personal'});
 assert.deepEqual(differences[0].work,{value:'swiss',origin:'global'});
 assert.equal(snapshot(room),before);
});
test('active once-only trials and overridden rules never become an authorized preview',()=>{
 const room=create();const once=room.upsert('typography','editorial_serif','explicit','personal','临时');once.id='once_1';
 room.upsert('artDirection','bauhaus','explicit','work','旧方向');room.upsert('artDirection','risograph','explicit','work','新授权');
 const {scenes}=compareAuthorizedScenes(room,content);
 assert.equal(scenes[0].canvas.typography,BASE.typography);assert.equal(scenes[1].canvas.artDirection,'risograph');
 assert.equal(scenes[1].sceneRuleCount,1);
});
test('pending corrections, active context, history, logs, source and artwork remain byte-identical',()=>{
 const room=create();room.upsert('artDirection','swiss','explicit','personal','授权');room.reconcile();
 room.pending={dimension:'artDirection',value:'japanese'};room.focus='mem_1';room.draftContent=[...content];
 room.artwork={...room.artwork,format:'landscape',details:{when:'周六',where:'展览室',action:'自由入场'}};
 room.posterSettings={titleScale:.8,lineBreaks:'manual'};
 const before=snapshot(room),model=compareAuthorizedScenes(room,content);
 assert.equal(snapshot(room),before);
 assert.ok(model.scenes.every(s=>s.artwork.format==='landscape'&&s.posterSettings.titleScale===.8));
 model.scenes[0].artwork.details.where='不应回写';model.scenes[0].canvas.artDirection='japanese';model.scenes[0].content[1]='改动';
 assert.equal(snapshot(room),before);assert.equal(model.scenes[1].content[1],content[1]);
});
test('both scenes render the same complete applied copy and current image with the original renderer',()=>{
 const room=create();room.upsert('artDirection','editorial','explicit','personal','授权');room.upsert('artDirection','swiss','explicit','work','授权');
 for(const format of ['portrait','square','landscape']){
  room.artwork.format=format;
  const comparison=compareAuthorizedScenes(room,content);
  for(const scene of comparison.scenes){const svg=posterSvg(scene,scene.content);assert.ok(svg.includes('原创虚构活动'));assert.ok(svg.includes('周末一起讨论。'));assert.ok(svg.includes('变成作品'));assert.ok(!svg.includes('sourceReason'));}
 }
});
test('one authorized scene cannot leak its preference into the other scene',()=>{
 const room=create();room.upsert('artDirection','deconstructed','explicit','personal','授权');
 const {scenes,differences}=compareAuthorizedScenes(room,content);
 assert.equal(scenes[1].canvas.artDirection,BASE.artDirection);assert.equal(scenes[1].sceneRuleCount,0);
 assert.equal(differences[0].work.origin,'default');
});
test('unsupported scope and malformed content are rejected without state changes',()=>{
 const room=create(),before=snapshot(room);
 assert.throws(()=>authorizedSceneView(room,'global'),/个人与工作/);
 assert.throws(()=>compareAuthorizedScenes(room,['缺少内容']),/完整文案/);
 assert.equal(snapshot(room),before);
});
test('SVG namespaces preserve user text and isolate clip, href and accessibility IDs',()=>{
 const svg='<svg><title id="title">同文 #clip</title><clipPath id="clip"/><image clip-path="url(#clip)"/><use href="#clip"/><g aria-labelledby="title external"/></svg>';
 const personal=namespaceSceneSvg(svg,'scene-personal'),work=namespaceSceneSvg(svg,'scene-work');
 assert.ok(personal.includes('同文 #clip'));assert.ok(personal.includes('id="scene-personal-clip"'));
 assert.ok(personal.includes('url(#scene-personal-clip)'));assert.ok(personal.includes('href="#scene-personal-clip"'));
 assert.ok(personal.includes('aria-labelledby="scene-personal-title external"'));assert.ok(!work.includes('scene-personal'));
 assert.throws(()=>namespaceSceneSvg(svg,'invalid" onclick="alert(1)'),/标识无效/);
});
