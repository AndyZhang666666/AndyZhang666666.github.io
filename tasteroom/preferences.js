import {OPTIONS,validChoice} from './engine.js';
import {DIMENSIONS} from './experiments.js';
const contexts={global:'全局',personal:'个人展览／活动',work:'工作汇报'};
const scopeIds={...Object.fromEntries(Object.entries(contexts).map(([k,v])=>[v,k])),'日常审美':'personal'};
const clone=x=>JSON.parse(JSON.stringify(x));
export function parseBrief(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>262144)throw Error('说明书最大 256 KB。');
 let parsed;
 if(text.trimStart().startsWith('{')){try{parsed=JSON.parse(text)}catch{throw Error('JSON 无法读取，未改变当前画布或规则。')}}
 else {
  if(!text.startsWith('# 我的偏好说明书'))throw Error('请选择偏爱实验室导出的 v1 JSON 或 Markdown 说明书。');
  const rules=[],section=text.split('## 我允许保留的规则与线索')[1]?.split('## 使用边界')[0];
  if(!section)throw Error('旧版说明书缺少规则区。');
  for(const row of section.split('\n').filter(s=>s.startsWith('- '))){
   const hit=row.match(/^- \[(.+?) \/ (本人明确规则|待验证线索)\] (.+?)：(.+?)。依据：(.*)$/);
   if(!hit)throw Error('有一条 Markdown 规则无法完整读取，请重新导出 JSON。');
   const dimension=Object.keys(DIMENSIONS).find(d=>DIMENSIONS[d]===hit[3]);
   const value=dimension&&Object.keys(OPTIONS[dimension]).find(v=>OPTIONS[dimension][v]===hit[4]);
   rules.push({dimension,value,scope:scopeIds[hit[1]],status:hit[2],reason:hit[5]});
  }
  parsed={format:'tasteroom-style-brief-v1',rules};
 }
 if(parsed.format!=='tasteroom-style-brief-v1'||!Array.isArray(parsed.rules)||parsed.rules.length>18)throw Error('需要偏爱实验室 v1 说明书，规则最多 18 条。');
 const seen=new Set();const rules=parsed.rules.map(r=>{
  if(!r||!validChoice(r.dimension,r.value)||!Object.hasOwn(contexts,r.scope)||!['本人明确规则','待验证线索'].includes(r.status)||typeof r.reason!=='string'||r.reason.length>2000)throw Error('说明书含不支持的参数、场景或依据，未导入任何规则。');
  const key=r.scope+':'+r.dimension;if(seen.has(key))throw Error('同一场景和维度存在重复规则，请先整理说明书。');seen.add(key);
  return {dimension:r.dimension,value:r.value,scope:r.scope,status:r.status,reason:r.reason};
 });
 if(!rules.length)throw Error('说明书没有持久规则。可先在作品中确认记住一项，再导出。');
 return {format:parsed.format,rules};
}
export function importPreview(room,brief){
 return brief.rules.map(rule=>({...clone(rule),replaces:room.memories.filter(m=>m.status==='active'&&m.dimension===rule.dimension&&m.context===rule.scope).map(m=>({dimension:m.dimension,value:m.preference,scope:m.context}))}));
}
export function applyBrief(room,brief){
 if(room.pending)throw Error('请先处理当前记忆冲突，再导入。');
 // Validate again at confirmation. No partial import if a file or preview was changed.
 const checked=parseBrief(JSON.stringify(brief));
 for(const rule of checked.rules){const memory=room.upsert(rule.dimension,rule.value,rule.status==='本人明确规则'?'explicit':'implicit',rule.scope,rule.reason,.7);memory.evidence={method:'imported-brief-v1',status:rule.status};}
 room.reconcile();room.log('import_style_brief',{rules:checked.rules.length,scope:'保留每条原有场景',inferred_dimensions:false});
 return checked.rules.length;
}
export function validCandidate(candidate){
 return !!candidate&&Array.isArray(candidate.content)&&candidate.content.length===4&&candidate.content.every(s=>typeof s==='string'&&s.length<=180)&&candidate.canvas&&Object.keys(OPTIONS).every(d=>validChoice(d,candidate.canvas[d]))&&candidate.posterSettings&&Number.isFinite(candidate.posterSettings.titleScale)&&candidate.posterSettings.titleScale>=.65&&candidate.posterSettings.titleScale<=1.3&&['auto','manual'].includes(candidate.posterSettings.lineBreaks);
}
