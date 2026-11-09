import {newWorkspace,validateWorkspace,personalRun,exportWorkspace} from '../workspace.mjs';
// The surrounding API applies Host/Origin, authentication, rate and body limits first.
export function workspaceHandler({now=Date.now}={}){
 const spaces=new Map();const ttl=3600000;
 return async function handle(path,req,session,send,bodyJson){
  if(!path.startsWith('/api/workspaces'))return false;
  for(const [id,s]of spaces)if(s.expires<now())spaces.delete(id);
  const fail=(status,message)=>{send(status,{error:{code:'workspace',message}});return true;};
  if(path==='/api/workspaces'&&req.method==='POST'){
   const b=await bodyJson(req);if(!b||typeof b!=='object'||Array.isArray(b)||Object.keys(b).length)return fail(400,'创建工作区不接受身份或权限参数。');
   if(spaces.size>=100||[...spaces.values()].filter(s=>s.owner===session.owner).length>=5)return fail(429,'工作区数量达到限制。');
   const w=newWorkspace();spaces.set(w.id,{owner:session.owner,w,run:null,expires:now()+ttl});send(201,{workspace:{id:w.id,version:1}});return true;
  }
  const m=path.match(/^\/api\/workspaces\/([\w-]+)(?:\/(documents|run|export|draft))?$/);if(!m)return fail(404,'工作区接口不存在。');
  const state=spaces.get(m[1]);if(!state||state.owner!==session.owner)return fail(404,'工作区不可用。');
  if(!m[2]&&req.method==='DELETE'){spaces.delete(m[1]);send(200,{deleted:true});return true;}
  if(m[2]==='documents'&&req.method==='POST'){
   const b=await bodyJson(req,800000);if(!b||typeof b!=='object'||Array.isArray(b)||Object.keys(b).some(k=>!['title','text','policy','version','effectiveFrom','effectiveTo','confirmed'].includes(k)))return fail(400,'不支持的资料参数。');
   if(typeof b.text!=='string'||typeof b.title!=='string')return fail(400,'资料需要标题与提取原文。');
   const doc={...b,id:'USR-'+crypto.randomUUID().toUpperCase(),confirmed:b.confirmed===true};const next={...state.w,revision:state.w.revision+1,documents:[...state.w.documents,doc]};
   try{validateWorkspace(next);}catch(e){return fail(400,e.message);}state.w=next;send(201,{id:doc.id,revision:next.revision});return true;
  }
  if(m[2]==='run'&&req.method==='POST'){
   const b=await bodyJson(req);if(!b||typeof b!=='object'||Array.isArray(b)||Object.keys(b).some(k=>!['question','date','confirmedRules','generation'].includes(k)))return fail(400,'不支持的任务参数。');
   if(b.generation&&b.generation!=='extractive')return fail(503,'自有资料模型调用未启用；此接口当前仅检索整理。');
   try{const w={...state.w,question:b.question,date:b.date,confirmedRules:b.confirmedRules===true};const run=personalRun(w);state.w=w;state.run=run;send(200,{run});}catch(e){return fail(400,e.message);}return true;
  }
  if(m[2]==='draft'&&req.method==='PUT'){
   const b=await bodyJson(req,40000);
   if(!b||typeof b!=='object'||Array.isArray(b)||Object.keys(b).some(k=>!['runId','draft','notes','selected'].includes(k))||typeof b.draft!=='string'||b.draft.length>12000||typeof b.notes!=='string'||b.notes.length>12000||!Array.isArray(b.selected)||b.selected.length>30||b.selected.some(id=>typeof id!=='string'))return fail(400,'草稿字段格式或容量无效。');
   if(!state.run||b.runId!==state.run.id)return fail(409,'先对当前资料执行检索，再关联答复草稿。');
   if(b.selected.some(id=>!state.run.retrieved.some(c=>c.id===id)))return fail(400,'只能采用本会话本次实际召回的依据。');
   const w={...state.w,draft:b.draft,notes:b.notes,draftSignature:state.run.signature,selected:[...new Set(b.selected)]};
   try{exportWorkspace(w,state.run);}catch(e){return fail(409,e.message);}state.w=w;send(200,{saved:true,runId:state.run.id});return true;
  }
  if(m[2]==='export'&&req.method==='GET'){
   try{send(200,exportWorkspace(state.w,state.run));}catch(e){return fail(409,e.message);}return true;
  }
  return fail(405,'不支持此工作区操作。');
 };
}
