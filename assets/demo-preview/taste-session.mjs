// Same Room and comparison engine as the full product, on an isolated in-memory room.
// Never call Room.save(), restore(), storage, or the application's persistence adapter.
import {Room,BASE,OPTIONS} from '../../tasteroom/engine.js';
import {createComparison,applyComparison,styleBrief} from '../../tasteroom/experiments.js';
export const posterContent=['周末灵感计划','无用之美\n周末放映室','把日常调慢一格。\n看一部电影，聊一段生活。','城市漫游 · 自由入场'];
export function createTastePreview(direction='swiss'){
 if(!['swiss','deconstructed'].includes(direction))throw Error('Unknown direction');
 const room=new Room();room.round=2;room.context='work';
 room.base={...BASE,artDirection:direction};room.canvas={...room.base};
 return {room,comparison:createComparison(room,'typography'),choice:null,memory:null,direction};
}
export function chooseTaste(preview,side){
 if(!['a','b','skip'].includes(side))throw Error('Unknown comparison side');
 const next=createTastePreview(preview.direction);next.choice=side==='skip'?null:side;return next;
}
export function authorizeTaste(preview,scope){
 if(!preview.choice)throw Error('Choose a variant first');
 const next=createTastePreview(preview.direction);next.choice=preview.choice;
 next.memory=applyComparison(next.room,next.comparison,next.choice,scope);return next;
}
export function revokeTaste(preview){
 if(preview.memory)preview.room.manage(preview.memory.id,'delete');
 const next=createTastePreview(preview.direction);next.choice=preview.choice;return next;
}
export function tasteSummary(preview){
 const brief=styleBrief(preview.room),rule=brief.rules[0];
 return {rule:rule||null,once:!!preview.memory&&!rule,value:preview.memory?OPTIONS.typography[preview.memory.preference]:null};
}
