// Deterministic negotiation. This module never calls a model or a network API.
export const TTL = 24 * 60 * 60 * 1000;
export const blank = () => ({budget:null,district:'',noSpicy:false,exclude:'',prefer:'',softNoSpicy:false});
export function createSession(now=Date.now()) {
  return {schema:1,expiresAt:now+TTL,version:1,startedAt:null,votes:{},invalidated:false,
    metrics:{recommendations:0,rejections:0,changes:0},
    members:[
      {id:'a',name:'小林',active:true,confirmed:false,raw:'我都行，但今天不想吃辣。',draft:blank(),conditions:blank()},
      {id:'b',name:'阿禾',active:true,confirmed:true,raw:'上周刚吃过烤肉，这次必须排除烤肉。',draft:{...blank(),exclude:'烤肉'},conditions:{...blank(),exclude:'烤肉'}},
      {id:'c',name:'小满',active:true,confirmed:true,raw:'人均最多 120 元，必须在中山路。',draft:{...blank(),budget:120,district:'中山路'},conditions:{...blank(),budget:120,district:'中山路'}}],
    candidates:[
      {id:'r1',name:'一碗小馆',cuisine:'家常菜',min:65,max:85,district:'中山路',noSpicy:true},
      {id:'r2',name:'蒸好食堂',cuisine:'粤菜',min:85,max:110,district:'中山路',noSpicy:true},
      {id:'r3',name:'炭火小院',cuisine:'烤肉',min:100,max:130,district:'河西',noSpicy:true},
      {id:'r4',name:'转角面屋',cuisine:'面食',min:null,max:null,district:'中山路',noSpicy:null}]};
}
export function normalize(c) {
  const budget = c.budget === '' || c.budget == null ? null : Number(c.budget);
  if (budget !== null && (!Number.isFinite(budget) || budget < 1 || budget > 10000)) throw Error('预算请填写 1–10000 的数字，或留空。');
  return {budget,district:String(c.district||'').trim().slice(0,40),noSpicy:!!c.noSpicy,
    exclude:String(c.exclude||'').trim().slice(0,30),prefer:String(c.prefer||'').trim().slice(0,30),softNoSpicy:!!c.softNoSpicy};
}
export function simulateUnderstanding(raw,candidates,fail=false) {
  if (fail) throw Error('模拟整理失败，原话和草稿已保留。可重试或直接手动填写。');
  const draft=blank(); const notes=[]; let found=false;
  // Deliberately narrow templates: unknown or contradictory language remains uncertain.
  const text=raw.trim().replace(/[。！!，,]/g,'');
  if (['我都行但今天不想吃辣','今天不想吃辣','不想吃辣'].includes(text)) {draft.softNoSpicy=true; found=true; notes.push('“不想吃辣”暂放尽量满足。若不能吃辣，请由你勾选硬条件。');}
  if (['我不能吃辣','不能吃辣','必须不辣'].includes(text)) {draft.noSpicy=true;found=true;}
  if (['上周刚吃过烤肉这次想换一种','这次不想吃烤肉'].includes(text)) {found=true;notes.push('“想换一种”不直接排除烤肉。如必须排除，请手动选择。');}
  if (['没有特别想吃的你们选就行','随便','我都行'].includes(text)) {found=true;notes.push('未识别到限制，可以直接确认，也可以补充。');}
  const clarify=/^(预算别太高|预算别太高最好在约定的商圈里|别太贵)$/.test(text)
    && new Set(candidates.map(r=>r.max).filter(Number.isFinite)).size>1;
  if (clarify) {found=true;notes.push('“别太高”还不是预算上限。最多人均多少元？留空可跳过。');}
  if (!found) notes.push('这句话超出了本地模拟规则，请在下方手动整理；不推断隐藏条件。');
  return {draft,notes,uncertain:!found||clarify,clarify};
}
export function reasons(r,c) {
  const out=[];
  if(c.budget!==null) {if(!Number.isFinite(r.max))out.push('预算信息未知');else if(r.max>c.budget)out.push('预算');}
  if(c.district && r.district!==c.district)out.push(r.district?'商圈':'商圈信息未知');
  if(c.noSpicy && r.noSpicy!==true)out.push(r.noSpicy===false?'忌口':'忌口信息未知');
  if(c.exclude && (!r.cuisine || r.cuisine===c.exclude))out.push(r.cuisine?'排除菜系':'菜系信息未知');
  return out;
}
export function recommend(s) {
  const active=s.members.filter(m=>m.active);
  if(active.length<3||active.length>5) return {ready:false,message:'首版需要 3–5 位有效参与者，请让演示成员重新加入。',feasible:[],blocked:[]};
  if(active.some(m=>!m.confirmed))return {ready:false,message:'还有成员未确认条件，先完成条件收集。',feasible:[],blocked:[]};
  const feasible=[],blocked=[];
  for(const r of s.candidates){
    const why=[...new Set(active.flatMap(m=>reasons(r,m.conditions)))];
    if(why.length)blocked.push({...r,reasons:why});
    else {const likes=active.filter(m=>(m.conditions.prefer && m.conditions.prefer===r.cuisine)||(m.conditions.softNoSpicy&&r.noSpicy===true)).length;
      feasible.push({...r,likes});}
  }
  feasible.sort((a,b)=>b.likes-a.likes);
  return {ready:true,feasible:feasible.slice(0,3),blocked,message:feasible.length?'可协商':'没有共同可行候选'};
}
function invalidate(s,now) {
  const hadVotes=Object.keys(s.votes).length>0;
  s.version++;s.votes={};s.invalidated=hadVotes;
  s.startedAt=s.members.filter(m=>m.active).every(m=>m.confirmed)?now:null;
}
export function submit(s,id,input,now=Date.now()) {
  const m=s.members.find(m=>m.id===id); if(!m||!m.active)throw Error('该演示成员已退出。');
  const c=normalize(input);
  if(m.confirmed && JSON.stringify(m.conditions)===JSON.stringify(c))return false;
  if(m.confirmed)s.metrics.changes++;
  m.conditions=c;m.draft={...c};m.confirmed=true;invalidate(s,now);return true;
}
export function toggleMember(s,id,now=Date.now()) {
  const m=s.members.find(m=>m.id===id);if(!m)throw Error('成员不存在');
  m.active=!m.active;if(m.active)m.confirmed=false;invalidate(s,now);
}
export function editCandidate(s,id,max,now=Date.now()) {
  const r=s.candidates.find(r=>r.id===id);if(!r)throw Error('候选不存在');
  return updateCandidate(s,id,{...r,max},now);
}
export function updateCandidate(s,id,input,now=Date.now()) {
  const r=s.candidates.find(r=>r.id===id);if(!r)throw Error('候选不存在');
  const number=v=>v===''||v==null?null:Number(v);
  const min=number(input.min),max=number(input.max);
  if(![min,max].every(v=>v===null||(Number.isFinite(v)&&v>=1&&v<=10000))||(min!==null&&max!==null&&max<min))throw Error('最高人均须不低于最低值，且不超过 10000；未知请留空。');
  if(!String(input.name||'').trim())throw Error('请给虚构候选起个名字。');
  if(![null,true,false].includes(input.noSpicy))throw Error('请选择已知的无辣情况，或保留未知。');
  const next={id:r.id,name:String(input.name).trim().slice(0,40),cuisine:String(input.cuisine||'').trim().slice(0,30)||null,min,max,district:String(input.district||'').trim().slice(0,40)||null,noSpicy:input.noSpicy};
  if(JSON.stringify(r)===JSON.stringify(next))return false;
  Object.assign(r,next);invalidate(s,now);return true;
}
export function addCandidate(s,now=Date.now()) {
  if(s.candidates.length>=8)throw Error('轻量演示最多 8 个候选，请先重新开始。');
  s.candidates.push({id:`r${s.candidates.length+1}`,name:'新补充的虚构候选',cuisine:null,min:null,max:null,district:null,noSpicy:null});invalidate(s,now);
}
export function vote(s,member,candidate,choice) {
  const result=recommend(s),m=s.members.find(m=>m.id===member);
  if(!m?.active||!result.ready||!result.feasible.some(r=>r.id===candidate))throw Error('条件已变化，请先查看当前可行方案。');
  if(!['yes','no','pending'].includes(choice))throw Error('未知表态');
  const previous=s.votes[member];
  if(previous?.candidate===candidate&&previous.choice===choice)return false;
  if(choice==='no')s.metrics.rejections++;
  s.votes[member]={candidate,choice,version:s.version};return true;
}
export function decision(s) {
  const result=recommend(s);if(!result.ready)return null;
  return result.feasible.find(r=>s.members.filter(m=>m.active).every(m=>{
    const v=s.votes[m.id];return v?.version===s.version&&v.choice==='yes'&&v.candidate===r.id;
  }))||null;
}
export function restore(serialized,now=Date.now()) {
  if(!serialized)return {session:null,reason:'empty'};
  try {
    const s=JSON.parse(serialized);
    if(s.schema!==1||!Number.isFinite(s.expiresAt)||s.expiresAt>now+TTL||!Array.isArray(s.members)||!Array.isArray(s.candidates)||s.members.length<3||s.members.length>5||!s.votes||!s.metrics||!Number.isInteger(s.version))throw Error();
    if(s.expiresAt<=now)return {session:null,reason:'expired'};
    if(s.candidates.length>8||Object.values(s.metrics).some(v=>!Number.isFinite(v)||v<0))throw Error();
    const ids=new Set();for(const m of s.members){
      if(!/^[a-z][a-z0-9]{0,20}$/.test(m.id)||ids.has(m.id)||typeof m.name!=='string'||typeof m.raw!=='string'||typeof m.active!=='boolean'||typeof m.confirmed!=='boolean'||!m.draft)throw Error();
      ids.add(m.id);m.conditions=normalize(m.conditions);
      if(!['string','number','object'].includes(typeof m.draft.budget)||typeof m.draft.district!=='string'||typeof m.draft.exclude!=='string'||typeof m.draft.prefer!=='string')throw Error();
    }
    const candidateIds=new Set();for(const r of s.candidates){
      if(!/^r[0-9]+$/.test(r.id)||candidateIds.has(r.id)||typeof r.name!=='string'||![r.min,r.max].every(v=>v===null||(Number.isFinite(v)&&v>=1&&v<=10000))||![null,true,false].includes(r.noSpicy))throw Error();
      candidateIds.add(r.id);
      if(r.max!==null&&r.min!==null&&r.max<r.min)throw Error();
    }
    if(!['recommendations','rejections','changes'].every(k=>Number.isFinite(s.metrics[k])))throw Error();
    if(s.startedAt!==null&&!Number.isFinite(s.startedAt))throw Error();
    recommend(s);return {session:s,reason:'restored'};
  }catch{return {session:null,reason:'corrupt'};}
}
