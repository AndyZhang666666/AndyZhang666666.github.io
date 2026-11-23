import {hero, resumes, aboutStrategy, quickTasks, work, evidence} from '../content/resume-profile.mjs';
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const bilingual=(zh,en,tag='span',cls='')=>`<${tag}${cls?' class="'+cls+'"':''} data-zh="${escape(zh)}" data-en="${escape(en)}">${escape(zh)}</${tag}>`;
const notes=(owner)=>evidence.filter(x=>x.owner===owner).map(item=>
 `<details class="evidence-note" id="evidence-${item.id}"><summary>${bilingual(...item.title)}</summary>${bilingual(...item.desc,'p')}${['fde','content'].includes(owner)?`<a href="${owner==='fde'?'/cases/agent-workflow/':'#project-content'}">${bilingual('查看项目','View project')} ↗</a>`:''}</details>`).join('');
export function experienceHTML(){
 return `<dl class="work-notes">${work.map(([id,zh,en,skill,skillEn,date,dateEn])=>
  `<div id="work-${id}"><dt>${bilingual(zh,en)}${date?bilingual(date,dateEn,'small','work-period'):''}</dt><dd>${bilingual(skill,skillEn)}${notes(id)}</dd></div>`).join('')}</dl><aside class="side-evidence">${bilingual('独立实践','Independent work','h3')}${notes('fde')}${notes('content')}</aside>`;
}
export function resumeLinks(){
 return `<details class="resume-picker" id="resumes"><summary>${bilingual('查看简历','View résumés')}</summary><ul>${resumes.map(([id,zh,en,tip,tipEn])=>`<li><a href="/assets/cv/${id}.pdf" target="_blank" rel="noopener">${bilingual(zh,en)} <small>${bilingual('PDF ↗','PDF in Chinese ↗')}</small></a>${bilingual(tip,tipEn,'small')}</li>`).join('')}</ul></details>`;
}
export const resultPrompts=()=>quickTasks.map(([id,zh,en])=>`<button type="button" class="jd-sample" data-task="${id}" aria-pressed="false">${bilingual(zh,en)}<span aria-hidden="true">↗</span></button>`).join('');
const replacements=[
 ['2026.02','2026.03'],['38 个 Skill','40+ 个可复用 Skill'],['38 Skills','40+ reusable Skills'],['6000 次','1 万+ 次'],['6,000 monthly tool calls','over 10,000 monthly tool calls']
];
export const correctFacts=value=>replacements.reduce((v,[before,after])=>v.replaceAll(before,after),value);
export function syncProfile(data){
 data.tagline=hero[0][0];data.taglineEn=hero[0][1];
 [data.about.body3,data.about.body3En]=aboutStrategy;
 data.education[0].period='2024.09 – 2026.03';
 data.evidenceCatalog=JSON.parse(correctFacts(JSON.stringify(data.evidenceCatalog)));
 data.experience=work.map(([id,company,companyEn,role,roleEn,period='',periodEn=''])=>{
   const items=evidence.filter(e=>e.owner===id);
   return {company,companyEn,role:items[0].title[0],roleEn:items[0].title[1],period,periodEn,highlights:items.map(e=>e.desc[0]),highlightsEn:items.map(e=>e.desc[1]),works:items.map(e=>({name:e.title[0],nameEn:e.title[1]}))};
 });
 return data;
}
