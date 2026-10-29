import {escapeHtml as e} from './project-cards.mjs';
const text=(tag,cls,zh,en)=>`<${tag} class="${cls}" data-zh="${e(zh)}" data-en="${e(en)}">${e(zh)}</${tag}>`;
export function renderAiViews(items){
 return items.map((item,i)=>`<article class="ai-view reveal" data-delay="${i*90}">${text('h3','ai-view-title',item.zh,item.en)}${text('p','ai-view-desc',item.dz,item.de)}${item.practice?`<div class="ai-view-practice">${text('p','',item.practice.text.zh,item.practice.text.en)}<a href="/cases/${e(item.practice.study)}/">${text('span','',item.practice.link.zh,item.practice.link.en)} <span aria-hidden="true">↗</span></a></div>`:''}${item.refUrl?`<a class="ai-view-reference ai-view-ref" href="${e(item.refUrl)}" target="_blank" rel="noopener">${e(item.refLabel)}</a>`:''}</article>`).join('');
}
