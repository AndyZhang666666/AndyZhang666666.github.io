export const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const e=escapeHtml;
const text=(tag,cls,zh,en=zh)=>`<${tag}${cls?` class="${cls}"`:''} data-zh="${e(zh)}" data-en="${e(en)}">${e(zh)}</${tag}>`;
const icon='<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 12 12 4M4 4h8v8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function details(p){
 if(!p.approach?.length)return '';
 return `<details class="project-details"><summary>${text('span','','方法与验证','Method & validation')}</summary><div class="case"><div class="case-block">${text('h4','case-label','问题','Problem')}${text('p','case-text',p.context,p.contextEn)}</div><div class="case-block">${text('h4','case-label','做法','Approach')}<ul class="case-list">${p.approach.map((v,i)=>text('li','',v,p.approachEn?.[i]||v)).join('')}</ul></div><div class="case-block">${text('h4','case-label','产出与边界','Outcome & scope')}${text('p','case-text',p.result,p.resultEn)}</div></div></details>`;
}
export function renderProjectCards(projects){
 return projects.map(p=>{
  const v=p.presentation||{},poker=p.group==='poker';
  const caseOnly=v.kind==='case';
  const demoLabel=v.kind==='external'?['前往外站','Visit external site']:['打开完整 Demo','Open full demo'];
  const story=(!p.iterationUrl||poker)?details(p):'';
  const links=`<div class="project-links">${p.url?`<a href="${e(p.url)}" target="_blank" rel="noopener" class="project-link" data-link-kind="demo">${text('span','',...demoLabel)}${icon}</a>`:''}${p.iterationUrl?`<a href="${e(p.iterationUrl)}" target="_blank" rel="noopener" class="project-link muted" data-link-kind="case">${text('span','',p.caseLabel||'设计过程',p.caseLabelEn||'Design process')}</a>`:''}${p.github?`<a href="${e(p.github)}" target="_blank" rel="noopener" class="project-link muted" data-link-kind="source">${text('span','',p.sourceLabel||'源码',p.sourceLabelEn||'Source')}</a>`:''}${!poker&&!caseOnly?story:''}</div>`;
  const width=v.coverSize?.width||1120,height=v.coverSize?.height||700;
  const media=v.image?`<a class="project-preview" style="--cover-ratio:${Number(width)}/${Number(height)}" href="${e(v.image)}" data-preview-image data-preview-caption="${e(v.caption.zh)}" data-preview-caption-en="${e(v.caption.en)}"><img src="${e(v.thumbnail)}" width="${Number(width)}" height="${Number(height)}" alt="${e(v.caption.zh)}" loading="lazy" decoding="async">${text('span','project-preview-zoom','放大界面','Enlarge screen')}${text('span','project-preview-fallback','截图暂不可用；下方仍可打开完整 Demo。','Preview unavailable. The full demo is still linked below.')}</a>`:'';
  const kind=caseOnly?text('p','project-kind','案例 · 公开说明','Case study · Public overview'):!poker?text('p','project-kind',v.kind==='external'?'外部网站':'可操作 Demo',v.kind==='external'?'External site':'Interactive demo'):'';
  return `<article id="project-${e(p.id)}" class="project-card${poker?' reveal':' library-card'}" data-project-id="${e(p.id)}" data-project-group="${e(p.group||'main')}"${p.url?` data-demo-url="${e(p.url)}"`:''} data-delay="0"><div class="project-card-inner">${media}${kind}${poker?`<div class="project-tags">${(p.tags||[]).map(t=>`<span class="project-tag">${e(t)}</span>`).join('')}</div>`:''}${text('h3','project-name',p.name,p.nameEn)}${!poker&&v.question?text('p','project-question',v.question.zh,v.question.en):''}${text('p','project-desc',v.decision?.zh||p.description,v.decision?.en||p.descriptionEn)}${poker&&p.metrics?.length?`<div class="project-metrics">${p.metrics.map((m,i)=>text('span','project-metric',m,p.metricsEn?.[i]||m)).join('')}</div>`:''}${links}${caseOnly||poker?story:''}</div></article>`;
 }).join('\n');
}
