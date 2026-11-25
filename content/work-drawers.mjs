import {escapeHtml as e} from '../assets/project-cards.mjs';

// Supplementary, previously captured product states. The primary view follows each project record.
const frames = {
  eval: [['eval-review.jpg','历史样例 · 引用复核','Historical sample · citation review']],
  taste: [['taste-comparison.jpg','同一份文案的两种排法','Two compositions of the same copy'],['taste-memory.jpg','偏好记录与适用范围','Preference history and scope']],
  bundle: [['bundle-candidates.jpg','内置订单 · 发现组合','Sample orders · finding a bundle'],['bundle-ledger.jpg','条件推演 · 新增贡献与既有让利','Scenario · gains and existing discounts']],
  'rag-lab': [['showcase/rag-lab.jpg','公开样例 · 资料范围与检索结果','Public example · source scope and retrieval']],
  suibianju: [['shared-preview.jpg','调整预算前的共同选项','Shared options before a budget change'],['shared-decision.jpg','预算预演与成员确认','Budget preview and member confirmation']],
  filing: [['filing-review.jpg','核对摘要、原文与遗漏','Reviewing a summary against its source']]
};
function imagesFor(p) {
  const view=p.presentation||{};
  const primary=view.image||view.thumbnail||(p.id==='squid-lab'?'/assets/work/showcase/squid-lab.jpg':'');
  const images=primary?[{full:primary,thumb:view.thumbnail||primary,caption:[view.caption?.zh||p.name,view.caption?.en||p.nameEn||p.name]}]:[];
  for(const [file,zh,en] of frames[p.id]||[]) images.push({full:'/assets/work/'+file,thumb:'/assets/work/'+file,caption:[zh,en]});
  return images.filter((frame,i)=>images.findIndex(other=>other.full===frame.full)===i);
}
function reel(p,text) {
  const images=imagesFor(p);
  if(!images.length)return '';
  const item=(frame,i)=>`<figure class="reel-frame"><a data-enlarge href="${e(frame.full)}"><img data-src="${e(frame.thumb)}" width="1280" height="850" alt="${e(frame.caption[0])}" data-alt-en="${e(frame.caption[1])}"${p.id==='eval'&&i===0?' data-fallback="/assets/work/showcase/eval-crop.jpg"':''} draggable="false" decoding="async"></a><figcaption><span class="frame-number">${i+1} / ${images.length}</span>${text(...frame.caption)}<a class="frame-enlarge" href="${e(frame.full)}" data-enlarge>${text('放大原图','Full image')} ↗</a></figcaption></figure>`;
  return `<div class="work-reel"${images.length===1?' data-single':''}>${images.length>1?`<div class="reel-head">${text('界面样图','Interface views','h3')}<div class="reel-nav" hidden><button type="button" data-step="-1" aria-label="上一张 / Previous image">←</button><output aria-live="polite">1 / ${images.length}</output><button type="button" data-step="1" aria-label="下一张 / Next image">→</button></div></div>`:''}<div class="reel-track" aria-label="界面样图 / Interface views"${images.length>1?' tabindex="0" role="region"':''}>${images.map(item).join('')}</div><noscript><style>.reel-track{display:none}</style>${images.map(frame=>`<a href="${e(frame.full)}">${text(...frame.caption)} ↗</a>`).join(' ')}</noscript></div>`;
}

export function workRow(p,index,{text,taskFor,topicFor,details,topicName}) {
  const id=e(p.id),link=p.url||p.iterationUrl,isCase=p.group==='cases',external=p.presentation?.kind==='external';
  const label=isCase?['阅读案例','Read case']:external?['打开外站','Visit site']:['打开工具','Open tool'];
  const dest=link?`<a class="work-entry" href="${e(link)}"${isCase?'':' target="_blank" rel="noopener"'}>${text(...label)} <span aria-hidden="true">↗</span></a>`:'';
  return `<article id="project-${id}" class="work-row" data-project-id="${id}" data-topic="${e(topicFor(p))}" tabindex="-1"><details class="work-drawer" id="method-${id}">
  <summary><span class="work-no" aria-hidden="true">${String(index+1).padStart(2,'0')}</span><span class="work-name">${text(p.name,p.nameEn||p.name)}</span><span class="work-task">${text(...taskFor(p))}</span><span class="drawer-cross" aria-hidden="true"></span></summary>
  <div class="drawer-page"><div class="drawer-head">${text(...topicName)}<div class="drawer-actions">${dest}${p.iterationUrl&&p.iterationUrl!==link?`<a href="${e(p.iterationUrl)}">${text('设计过程','Design process')} →</a>`:''}${p.github?`<a href="${e(p.github)}" target="_blank" rel="noopener">${text('源码','Source')} ↗</a>`:''}${p.analysisUrl?`<a href="${e(p.analysisUrl)}">${text('订单分析','Order analysis')} →</a>`:''}</div></div>
  ${reel(p,text)}<div class="work-method"><h3>${text('方法与依据','Method & evidence')}</h3><dl>${details(p)}</dl></div><button class="close-drawer" type="button" hidden>${text('收起作品','Close work')} ↑</button></div>
  </details></article>`;
}
