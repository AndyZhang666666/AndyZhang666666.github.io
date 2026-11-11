// Personal-source tools: local evidence organization, not general semantic reasoning.
import {search, assess, validDate, factsIn,VERSIONS} from './engine.mjs';
import {checkDraftGrounding,citationCautions} from './task-loop.mjs';
export const LIMITS=Object.freeze({files:5,fileBytes:2*1024*1024,totalBytes:8*1024*1024,characters:200000});
export function newWorkspace(){return {version:1,id:crypto.randomUUID(),revision:0,documents:[],question:'',date:'2026-10-28',draft:'',notes:'',selected:[],confirmedRules:false,runs:[]};}
export function validateWorkspace(w){
 if(!w||w.version!==1||typeof w.id!=='string'||!Number.isInteger(w.revision)||!Array.isArray(w.documents)||w.documents.length>LIMITS.files||w.documents.some(d=>!d||typeof d!=='object'||Array.isArray(d)))throw Error('工作区格式无效，原资料未替换。');
 if(new Set(w.documents.map(d=>d.id)).size!==w.documents.length)throw Error('文档编号重复，原工作区未替换。');
 if(w.runs!==undefined&&!Array.isArray(w.runs))throw Error('工作区运行记录格式无效。');
 if(w.runs?.some(r=>!r||typeof r.question!=='string'||!validDate(r.date)||!Array.isArray(r.retrieved)||r.retrieved.some(c=>!c||typeof c.id!=='string'||typeof c.text!=='string'||typeof c.title!=='string')))throw Error('旧运行记录无法读取。');
 if(w.runs!==undefined&&(!Array.isArray(w.runs)||w.runs.length>10)||typeof w.confirmedRules!=='boolean')throw Error('工作区运行记录格式无效。');
 if(typeof w.question!=='string'||typeof w.date!=='string'||typeof w.draft!=='string'||typeof w.notes!=='string'||!Array.isArray(w.selected)||w.selected.some(id=>typeof id!=='string'))throw Error('工作区内容格式无效。');
 if(w.documents.reduce((n,d)=>n+(d.bytes||0),0)>LIMITS.totalBytes)throw Error('原文件总计超过8MB。');
 if(w.documents.reduce((n,d)=>n+(typeof d.text==='string'?d.text.length:LIMITS.characters+1),0)>LIMITS.characters)throw Error('提取文本总计不能超过200,000字符。');
 for(const d of w.documents){if(d.extractionWarnings!==undefined&&(!Array.isArray(d.extractionWarnings)||d.extractionWarnings.some(n=>!Number.isInteger(n)||n<1)))throw Error('PDF提取记录格式无效。');if(typeof d.confirmed!=='boolean'||typeof d.id!=='string'||typeof d.title!=='string'||typeof d.text!=='string'||!d.text.trim()||d.title.length>200||['policy','version','effectiveFrom','effectiveTo'].some(k=>d[k]!=null&&typeof d[k]!=='string')||d.bytes!=null&&(!Number.isFinite(d.bytes)||d.bytes<0||d.bytes>LIMITS.fileBytes))throw Error('文档字段无效。');if(d.effectiveFrom&&!validDate(d.effectiveFrom)||d.effectiveTo&&!validDate(d.effectiveTo)||d.effectiveFrom&&d.effectiveTo&&d.effectiveFrom>=d.effectiveTo)throw Error('请核对文档有效期间。');}
 return {...w,runs:w.runs||[]};
}
export function chunksFor(doc){
 let page=null,paragraph=0;
 return doc.text.split(/\n\s*\n/).flatMap(block=>{const marker=block.match(/^\[Page (\d+)\]\n?/);if(marker){page=Number(marker[1]);block=block.slice(marker[0].length);}if(!block.trim())return [];
 const parts=block.match(/[^]{1,1200}/g)||[];
 return parts.map(text=>({id:`${doc.id}:p${++paragraph}`,heading:doc.title,text:text.trim(),page}));});
}
export function signature(w){return JSON.stringify({revision:w.revision,question:w.question,date:w.date,documents:w.documents.map(d=>[d.id,d.text,d.policy,d.version,d.effectiveFrom,d.effectiveTo,d.confirmed]),confirmedRules:w.confirmedRules});}
export function personalRun(w){
 validateWorkspace(w);if(!w.question.trim()||w.question.length>300)throw Error('请输入1–300字的问题。');if(!validDate(w.date))throw Error('请填写有效业务日期。');if(!w.documents.length)throw Error('先导入或粘贴一份资料。');
 const unknown=w.documents.filter(d=>!d.confirmed||!d.effectiveFrom||!d.version);
 const incomplete=w.documents.filter(d=>d.extractionWarnings?.length);
 const uncertainIds=new Set([...unknown,...incomplete].map(d=>d.id));
 // Unknown metadata must remain discoverable, never get silently superseded by a known version.
 // Synthetic search fields are removed again before showing/exporting a source.
 const docs=w.documents.map(d=>{const uncertain=uncertainIds.has(d.id);return {...d,version:d.version||'未声明',policy:uncertain?'uncertain:'+d.id:d.policy||d.id,roles:['employee'],snapshots:['baseline'],effectiveFrom:uncertain?w.date:d.effectiveFrom,effectiveTo:uncertain?null:d.effectiveTo||null,chunks:chunksFor(d)};});
 const retrieved=search(docs,w.question,{role:'employee',date:w.date,snapshot:'baseline'}).map(c=>{const original=w.documents.find(d=>d.id===c.docId);return {...c,policy:original.policy||original.id,effectiveFrom:original.effectiveFrom||null,effectiveTo:original.effectiveTo||null,applicability:uncertainIds.has(c.docId)?'unconfirmed':'date-confirmed'};});

 const a=w.confirmedRules&&!unknown.length&&!incomplete.length?assess(w.question,retrieved):null;
 const status=!retrieved.length?'insufficient':a?.status==='answered'?'answered':a?.status==='conflict'?'conflict':'evidence';
 const gaps=[...(w.documents.some(d=>d.extractionWarnings?.length)?['部分PDF页面未提取到文字，已检索内容不能代表完整文档；请核对空白或扫描页。']:[]),...(unknown.length?['部分资料的生效期间或版本尚未确认，不能宣称适用于本次业务日期。']:[]),...(!w.confirmedRules?['当前只做检索与证据整理；如需使用支持的规则字段，请先逐条核对原文。']:[])];
 if(a&&a.status!=='answered')gaps.push(a.answer);
 return {id:crypto.randomUUID(),createdAt:new Date().toISOString(),workspaceId:w.id,revision:w.revision,signature:signature(w),mode:'personal-local',versions:{...VERSIONS,workspace:'source-workspace-v1'},question:w.question,date:w.date,status,retrieved,facts:a?.facts||[],answer:status==='answered'?a.answer:'请从找到的段落选择依据并组织答复；尚未形成自动制度结论。',gaps,documentManifest:w.documents.map(({id,title,version,effectiveFrom,effectiveTo,confirmed,text})=>({id,title,version,effectiveFrom,effectiveTo,confirmed,characters:text.length}))};
}
export function exportWorkspace(w,run,{includeSources=false}={}){
 if(!run||run.signature!==signature(w))throw Error('资料或条件已更改，先重新检索后再导出当前答复。');
 const selected=run.retrieved.filter(c=>w.selected.includes(c.id));
 const draftNeedsReview=Boolean(w.draft&&w.draftSignature!==run.signature);
 const draftSourceRunId=(w.runs||[]).find(r=>r.signature===w.draftSignature)?.id??(w.draftSignature===run.signature?run.id:null);
 return {version:1,kind:'rag-evidence-workspace',mode:'personal-local',versions:run.versions,question:run.question,date:run.date,documentManifest:run.documentManifest,status:run.status,statusScope:'检索和规则状态；不代表用户草稿已验证',draftNeedsReview,draftSourceRunId,answerDraft:w.draft,groundingCheck:checkDraftGrounding(w.draft,selected),citationCautions:citationCautions(selected),author:'用户编辑；不是模型生成',unresolved:w.notes,gaps:run.gaps,runId:run.id,workspaceId:w.id,revision:w.revision,evidence:selected.map(c=>({id:c.id,title:c.title,version:c.version,page:c.page,quote:c.text})),...(includeSources?{documents:structuredClone(w.documents),workspaceState:{question:w.question,date:w.date,draft:w.draft,notes:w.notes,selected:[...w.selected],confirmedRules:w.confirmedRules,draftSignature:w.draftSignature||null}}:{}),createdAt:run.createdAt};
}
export function workspaceMarkdown(r){return ['# 资料答复单','',...(r.draftNeedsReview?['> 草稿沿用旧条件或来源尚未关联，尚未按本次依据确认。请先核对，不能当作已验证答复。','']:[]),`问题：${r.question}`,`业务日期：${r.date}`,'运行方式：本机检索与用户整理；无模型调用','', '## 答复草稿',r.answerDraft||'尚未填写；不代表已有确定答案。','', '## 草稿数字核对（提示，不拦截导出）',r.groundingCheck?.note||'未运行数字核对。',...(r.groundingCheck?.unsupported||[]).map(n=>`- ${n.token} 未在所选引文中找到，请核对。`),...(r.citationCautions||[]).map(c=>`- ${c.message}`),'', '## 待确认与下一步',...r.gaps.map(g=>`- ${g}`),r.unresolved||'尚未补充。','', '## 采用依据',...r.evidence.map((e,i)=>`### [${i+1}] ${e.title} · ${e.version||'版本未声明'}${e.page?` · 第${e.page}页`:''}\n\n${e.quote}`),'','人工补写需自行核对；引用存在不等于结论成立。'].join('\n');}

export function recognizedRules(doc){return chunksFor(doc).flatMap(c=>factsIn(c).map(f=>({...f,title:doc.title})));}
export function restoreWorkspace(report){
 if(!report||report.version!==1||report.kind!=='rag-evidence-workspace'||!Array.isArray(report.documents)||!report.workspaceState)throw Error('需要带来源文本的本工具JSON备份；当前资料没有替换。');
 const n={...newWorkspace(),documents:structuredClone(report.documents),...report.workspaceState};
 // Imported data never restores a valid run: re-retrieve under the current engine first.
 n.id=crypto.randomUUID();n.revision=0;n.runs=[];return validateWorkspace(n);
}
