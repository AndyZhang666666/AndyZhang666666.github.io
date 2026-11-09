// Incremental generation: preserve the current shell and every unrelated project.
// Never regenerate this batch from an old website revision.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {studies} from '../content/editorial.mjs';
import {selected,renderSelected} from '../content/showcase.mjs';
import {presentationFor} from '../content/project-presentation.mjs';
import {presentationCases} from '../content/presentation-mode.mjs';
import {renderProjectCards,escapeHtml as e} from '../assets/project-cards.mjs';
import {rasterSize} from '../content/raster-size.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const write=(file,value)=>fs.writeFileSync(path.join(root,file),value);
const hash=value=>createHash('sha256').update(value).digest('hex');
export function sectionRange(html,id){
 const start=html.indexOf(`<section id="${id}"`);if(start<0)throw Error(`Missing existing section: ${id}`);
 const tags=/<\/?section\b[^>]*>/g;tags.lastIndex=start;let depth=0,match;
 while((match=tags.exec(html))){depth+=match[0].startsWith('</')?-1:1;if(depth===0)return {start,end:tags.lastIndex};}
 throw Error(`Unclosed existing section: ${id}`);
}
const original=read('index.html'),data=JSON.parse(read('data.json'));
const protectedIds=['top','about','ai','work','experience','education','awards','uses','skills','jd','contact'].filter(id=>original.includes(`<section id="${id}"`));
const protectedSections=new Map(protectedIds.map(id=>{const r=sectionRange(original,id);return [id,original.slice(r.start,r.end)];}));
const untouched=data.projects.filter(p=>!selected.some(s=>s.project===p.id)).map(p=>[p.id,JSON.stringify(p)]);
let html=original;
const captures=JSON.parse(read('assets/work/showcase/captures.json')).records;
const region=sectionRange(html,'selected');html=html.slice(0,region.start)+renderSelected(data)+html.slice(region.end);
const body=(tag,cls,value)=>`<${tag} class="${cls}" data-zh="${e(value.zh)}" data-en="${e(value.en)}">${e(value.zh)}</${tag}>`;
const heading=(id,zh,en,content)=>`<section id="${id}" class="section${id==='mechanism'?' case-highlight-target':''}"><div class="section-head">${body('h2','',{zh,en})}</div>${content}</section>`;
const image=(file,caption)=>{
 if(!file||!fs.existsSync(path.join(root,'assets/work',file)))return '';
 const size=rasterSize(fs.readFileSync(path.join(root,'assets/work',file)));
 return `<figure class="case-figure"><a href="/assets/work/${e(file)}" target="_blank" rel="noopener"><img src="/assets/work/${e(file)}" width="${size.width}" height="${size.height}" alt="${e(caption)}" loading="lazy"></a><figcaption>${e(caption)}</figcaption></figure>`;
};
for(const item of selected){
 const project=data.projects.find(p=>p.id===item.project),study=studies.find(s=>s.id===item.id);
 if(!project?.url||study?.project!==project.id)throw Error(`Explicit entry/case missing: ${item.id}`);
 project.description=study.summary.zh;project.descriptionEn=study.summary.en;
 project.context=study.problem.zh;project.contextEn=study.problem.en;
 project.approach=study.decisions.map(d=>`${d.title.zh}：${d.text.zh}`);project.approachEn=study.decisions.map(d=>`${d.title.en}: ${d.text.en}`);
 project.result=study.proof.zh+' '+study.tradeoff.zh;project.resultEn=study.proof.en+' '+study.tradeoff.en;
 project.iterationUrl=`/cases/${study.id}/`;project.caseLabel='设计过程';project.caseLabelEn='Design process';
 const prior=project.presentation||{},capture=captures.find(c=>c.id===project.id);
 project.presentation={...prior,...presentationFor(project),question:study.question,caption:study.caption,decision:study.summary,...(capture?.cropSize?{coverSize:capture.cropSize}:prior.coverSize?{coverSize:prior.coverSize}:{})};
 if(project.id==='bundle'){project.url='/bundle-lab/simulate/';project.analysisUrl='/bundle-lab/';}
 const card=new RegExp(`<article id="project-${project.id}"[^]*?</article>`);
 if(!card.test(html))throw Error(`Preserve absent card before generating: ${project.id}`);
 html=html.replace(card,renderProjectCards([project]));
 const caseFile=`cases/${study.id}/index.html`,priorCase=read(caseFile);
 const evidenceLinks=(study.evidenceLinks||[]).map(link=>`<a class="project-link" href="${e(link.href)}" target="_blank" rel="noopener">${body('span','',link.label)} ↗</a>`).join('');
 const content=`<section class="section case-intro"><div class="section-head">${body('h1','',study.title)}</div>${body('p','case-summary',study.summary)}${body('p','case-text',study.watch)}<div class="project-links"><a class="project-link" href="${e(project.url)}" target="_blank" rel="noopener" data-zh="打开完整工具 ↗" data-en="Open full tool ↗">打开完整工具 ↗</a><a class="project-link" href="/#selected" data-zh="返回四项精选" data-en="Back to selected work">返回四项精选</a></div>${body('p','case-text',study.status)}${image(study.image,study.caption.zh)}</section>`+
 heading('problem','要解决的问题','The problem',body('p','about-lead',study.question)+body('p','about-body',study.problem)+body('p','about-body',study.role))+
 heading('approach','方案与取舍','Options and tradeoffs',body('p','about-lead',study.insight)+`<div class="principle-grid">${study.choices.map(([a,b])=>`<article class="principle-card">${body('h3','principle-title',a)}${body('p','principle-desc',b)}</article>`).join('')}</div>`)+
 heading('mechanism','把判断变成机制','Making the decision work',`<ol class="case-mechanism">${study.decisions.map(d=>`<li>${body('h3','principle-title',d.title)}${body('p','principle-desc',d.text)}</li>`).join('')}</ol><div class="case-evidence-links">${evidenceLinks}</div>${study.secondaryImage!==study.image?image(study.secondaryImage,study.artifact.zh):''}`)+
 heading('evidence','验证、代价与下一步','Evidence, limits and next steps',body('p','about-body',study.proof)+body('p','about-body',study.tradeoff)+body('p','about-body',study.next));
 if(!/<main>[^]*<\/main>/.test(priorCase))throw Error(`Case shell missing: ${caseFile}`);
 write(caseFile,priorCase.replace(/<main>[^]*<\/main>/,`<main>${content}</main>`));
}
// Only the selected assets need cache invalidation; keep all effect/background imports intact.
html=html.replace(/(assets\/demo-showcase\.(?:mjs|css)\?v=)[^"']*/g,(_,prefix)=>prefix+'20261109-product-depth');
for(const [id,value] of protectedSections){const r=sectionRange(html,id);if(html.slice(r.start,r.end)!==value)throw Error(`Protected section changed: ${id}`);}
for(const [id,value] of untouched)if(JSON.stringify(data.projects.find(p=>p.id===id))!==value)throw Error(`Unrelated project changed: ${id}`);
write('data.json',JSON.stringify(data,null,2)+'\n');write('index.html',html);
const previewSourceFiles=['assets/demo-preview/eval-sample.json','assets/demo-preview/bundle-model.mjs','assets/demo-preview/bundle-candidate.json','tasteroom/engine.js','tasteroom/artwork.js','tasteroom/directions.js','rag-lab/engine.mjs','rag-lab/public-corpus.json'].map(file=>({file,sha256:hash(read(file))}));
const report={format:1,scope:'Four selected demos and their owned cards/cases only',order:selected.map(s=>s.id),protectedSections:[...protectedSections.keys()],projectCount:data.projects.length,commutePreserved:data.projects.some(p=>p.id==='commute'),sourceManifestSha256:hash(read('assets/demo-preview/provenance.json')),previewSourceFiles,presentationCases};
fs.mkdirSync(path.join(root,'docs/verification'),{recursive:true});write('docs/verification/selected-depth-generation-20261109.json',JSON.stringify(report,null,2)+'\n');
console.log('Updated four selected previews, their cards/cases and source manifest; current shell and unrelated content preserved.');
