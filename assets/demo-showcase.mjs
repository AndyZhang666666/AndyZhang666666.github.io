import {renderProjectCards} from './project-cards.mjs';
import {createShowcaseMotion} from './showcase-motion.mjs';
import {renderProductPrinciples,initProductPrinciples} from './product-principles.mjs';
import {renderAiViews} from './ai-views.mjs';
import {initExecution,initRag} from './new-work-previews.mjs';

// The page owns only ephemeral previews. Full tools keep their own state and storage.
const root=document.getElementById('selected');
const en=()=>document.documentElement.lang.startsWith('en');
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const words=(node,zh,english)=>{if(!node)return;node.dataset.zh=zh;node.dataset.en=english;node.textContent=en()?english:zh;};
const translate=node=>node.querySelectorAll('[data-zh]').forEach(el=>{el.textContent=el.dataset[en()?'en':'zh'];});
const feedback=node=>{if(node?.animate&&!reduced())node.animate([{opacity:.6,transform:'translateY(4px)'},{opacity:1,transform:'none'}],{duration:220,easing:'cubic-bezier(.16,1,.3,1)'});};
const press=(buttons,picked)=>buttons.forEach(button=>button.setAttribute('aria-pressed',String(button===picked)));
const fixture=id=>JSON.parse(document.getElementById(id).textContent);

// Async profile rendering changes the height above deep-linked work. Correct it once,
// after data/fonts settle, but never take the scroll back after a visitor starts interacting.
if(['#selected','#projects','#ai'].includes(location.hash)){
 let touched=false;
 const stop=()=>{touched=true;};
 for(const event of ['pointerdown','wheel','keydown','touchstart'])window.addEventListener(event,stop,{once:true,passive:true});
 document.addEventListener('portfolio:ready',()=>{
  document.fonts.ready.then(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if(!touched)document.querySelector(location.hash)?.scrollIntoView({block:'start',behavior:'instant'});
   for(const event of ['pointerdown','wheel','keydown','touchstart'])window.removeEventListener(event,stop);
  })));
 },{once:true});
}

window.refreshProductPrinciples=principles=>{
 const grid=document.getElementById('principleGrid');if(!grid)return;
 if(grid.querySelectorAll('[data-principle]').length!==principles.length){grid.innerHTML=renderProductPrinciples(principles);delete grid.dataset.practiceReady;initProductPrinciples(grid);translate(grid);}
};
initProductPrinciples(document.getElementById('principleGrid'));
window.refreshAiViews=items=>{
 const grid=document.getElementById('aiViewsGrid');if(!grid)return;
 if(grid.querySelectorAll('.ai-view-practice').length===items.length)return;
 grid.innerHTML=renderAiViews(items);translate(grid);
};

window.refreshProjectLibrary=projects=>{
 const grid=document.getElementById('projectGrid');if(!grid)return;
 const cards=[...grid.querySelectorAll('[data-project-id]')];
 // The build already emits the exact same cards; keep their native motion/group handlers.
 if(cards.length===projects.length&&projects.every(p=>cards.some(card=>card.dataset.projectId===p.id)))return;
 grid.innerHTML=renderProjectCards(projects);translate(grid);
};

function initEval(panel){
 const button=panel.querySelector('[data-eval-locate]'),quotes=[...panel.querySelectorAll('[data-eval-source-quote],[data-eval-full-quote]')];
 const reviews=[...panel.querySelectorAll('[data-eval-review]')],clear=panel.querySelector('[data-eval-clear]');
 const labels={supported:['支持该判断','Supported'],unsupported:['评语存疑','Questionable'],needs_context:['需要更多上下文','Needs more context']};
 button.disabled=false;
 button.addEventListener('click',()=>{
  const active=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(active));
  quotes.forEach(quote=>{if(active){const mark=document.createElement('mark');mark.textContent=quote.textContent;quote.replaceChildren(mark);}else quote.replaceChildren(document.createTextNode(quote.textContent));});
  words(button.querySelector('span'),active?'取消高亮':'定位原文',active?'Clear highlight':'Locate quote');
  words(panel.querySelector('[data-eval-status]'),active?'已定位到原文。引用存在，是否支持评语仍待人工判断。':'点击定位，检查这条评语所引用的原文。',active?'Quotation located. Whether it supports the comment still requires human judgement.':'Locate the quotation to inspect the source behind the comment.');
  feedback(quotes[0]);
 });
 reviews.forEach(review=>{review.disabled=false;review.addEventListener('click',()=>{
  const [zh,english]=labels[review.dataset.evalReview];press(reviews,review);clear.disabled=false;
  words(panel.querySelector('[data-eval-verdict]'),zh,english);
  words(panel.querySelector('[data-eval-status]'),`本页试用：${zh}。原始评分仍为 2 / 5；未写入完整工具。`,`Preview review: ${english}. The original score remains 2 / 5; nothing is saved to the full tool.`);
  feedback(panel.querySelector('.preview-review-record'));
 });});
 clear.addEventListener('click',()=>{press(reviews,null);clear.disabled=true;words(panel.querySelector('[data-eval-verdict]'),'尚未复核','Unreviewed');words(panel.querySelector('[data-eval-status]'),'试用判断已清除；历史评分与原文不变。','Preview review cleared. The saved score and source are unchanged.');});
}
async function initTaste(panel){
 const [{directionSvg},{createTastePreview,posterContent}]=await Promise.all([import('../tasteroom/directions.js'),import('./demo-preview/taste-session.mjs')]);
 const buttons=[...panel.querySelectorAll('[data-taste-direction]')];
 buttons.forEach(button=>{button.disabled=false;button.addEventListener('click',()=>{
  const direction=button.dataset.tasteDirection,{room}=createTastePreview(direction);
  panel.querySelector('[data-taste-canvas]').innerHTML=directionSvg(room,posterContent);
  panel.querySelector('[data-selected-demo=taste]').href='/tasteroom/?direction='+direction;
  press(buttons,button);words(panel.querySelector('[data-taste-status]'),direction==='swiss'?'正在试瑞士构图；只传递设计方向到完整工具，不保存偏好。':'正在试解构构图；内容相同，其他参数保留，不保存偏好。',direction==='swiss'?'Trying Swiss composition. Only the direction transfers; no preference is saved.':'Trying deconstructed composition. Copy and other settings stay the same; no preference is saved.');
  feedback(panel.querySelector('[data-taste-canvas]'));
 });});
}
function initCommute(panel){
 const data=fixture('commutePreviewInput'),buttons=[...panel.querySelectorAll('[data-commute-focus]')];
 const labels={cheapest:['费用','cost'],fastest:['月中位时间','monthly median time'],steadiest:['P10–P90 波动','P10–P90 variation']};
 buttons.forEach(button=>{button.disabled=false;button.addEventListener('click',()=>{
  const ids=data.focus[button.dataset.commuteFocus],names=data.routes.filter(r=>ids.includes(r.id)).map(r=>r.name).join(' / '),label=labels[button.dataset.commuteFocus];
  panel.querySelectorAll('[data-commute-route]').forEach(node=>node.dataset.focused=String(ids.includes(node.dataset.commuteRoute)));
  press(buttons,button);words(panel.querySelector('[data-commute-status]'),label[0]+'最低：'+names+'。只是当前模型内比较；未保存个人选择。','Lowest '+label[1]+': '+names+'. A model comparison, not a saved personal choice.');
  feedback(panel.querySelector('.preview-commute-routes'));
 });});
}
async function initShared(panel){
 const {previewConditions}=await import('../suibianju/product.mjs?v=20261024-v2');
 const session=fixture('sharedPreviewInput'),member=session.members.find(m=>m.id==='c');
 const buttons=[...panel.querySelectorAll('[data-shared-budget]')];
 buttons.forEach(button=>{button.disabled=false;button.addEventListener('click',()=>{
  const budget=Number(button.dataset.sharedBudget),result=previewConditions(session,'c',{...member.conditions,budget});
  panel.querySelector('[data-shared-count]').textContent=result.after.length;
  panel.querySelector('[data-shared-draft]').textContent='¥'+budget;
  panel.querySelectorAll('[data-candidate]').forEach(node=>{
   const feasible=result.after.some(r=>r.id===node.dataset.candidate);node.dataset.feasible=String(feasible);
   words(node.querySelector('[data-candidate-status]'),feasible?'满足已知硬条件':'超出预演预算',feasible?'Known hard constraints met':'Over the preview budget');
  });
  words(panel.querySelector('[data-shared-status]'),`¥${budget} 预演：${result.after.length} 个共同可行选项。确认预算仍为 ¥40；尚未全员确认。`,`¥${budget} preview: ${result.after.length} shared feasible options. Confirmed budget is still ¥40; no group agreement has been recorded.`);
  press(buttons,button);feedback(panel.querySelector('.preview-shared-result'));
 });});
}
async function initBundle(panel){
 const {simulateOne}=await import('./demo-preview/bundle-model.mjs');
 const args=fixture('bundlePreviewInput'),buttons=[...panel.querySelectorAll('[data-bundle-adoption]')];
 buttons.forEach(button=>{button.disabled=false;button.addEventListener('click',()=>{
  const result=simulateOne({...args,adoption:Number(button.dataset.bundleAdoption)}),positive=result.marginLift>=0;
  panel.querySelector('[data-bundle-added]').textContent='+¥'+result.addedMargin.toFixed(3);
  panel.querySelector('[data-bundle-net]').textContent=(positive?'+':'−')+'¥'+Math.abs(result.marginLift).toFixed(3);
  panel.querySelector('[data-bundle-sign]').dataset.bundleSign=positive?'positive':'negative';
  const scale=simulateOne({...args,adoption:.5}).addedMargin;
  panel.querySelector('[data-bundle-bar]').style.transform=`scaleX(${result.addedMargin/scale})`;
  panel.querySelector('[data-bundle-loss-bar]').style.transform=`scaleX(${result.existingLoss/scale})`;
  const amount=Math.abs(result.marginLift).toFixed(3),signed=(positive?'+':'−')+'¥'+amount;
  words(panel.querySelector('[data-bundle-status]'),`当前假设下，每个覆盖订单${positive?'多':'少'}赚 ¥${amount}。这是条件推演，仍需验证真实采纳与成本。`,`Under these assumptions: ¥${amount} ${positive?'more':'less'} per covered order. Actual adoption and cost still require validation.`);
  words(panel.querySelector('[data-bundle-plan-result]'),`当前假设净增 ${signed} / 覆盖订单。先核对口径，不能据此宣布上线。`,`The scenario gives ${signed} per covered order. Verify definitions before considering rollout.`);
  press(buttons,button);feedback(panel.querySelector('.preview-ledger-total'));
 });});
}

if(root){
 const direction=root.querySelector('#showcaseDirection'),tabs=root.querySelector('.showcase-choices');
 const allTabs=[...tabs.querySelectorAll('[data-selected-id]')],panels=[...root.querySelectorAll('[data-preview]')];
 const material=createShowcaseMotion(root);
 const pending=new Map(),loaders={'trust':initEval,'taste':initTaste,'shared-choice':initShared,'bundles':initBundle,'commute':initCommute,'execution':initExecution,'rag':initRag};
 function activate(id,announce=true){
  const tab=allTabs.find(tab=>tab.dataset.selectedId===id);if(!tab||tab.hidden)return;
  const previous=allTabs.find(item=>item.getAttribute('aria-selected')==='true')?.dataset.selectedId;
  allTabs.forEach(item=>{const active=item===tab;item.setAttribute('aria-selected',String(active));item.tabIndex=active?0:-1;});
  panels.forEach(panel=>panel.hidden=panel.dataset.preview!==id);
  const panel=panels.find(panel=>panel.dataset.preview===id);
  material.sync();
  if(announce){words(root.querySelector('#showcaseStatus'),`已展示 ${tab.querySelector('strong').dataset.zh}`,`Showing ${tab.querySelector('strong').dataset.en}`);if(previous!==id)material.enter(panel,previous);}
  if(!pending.has(id))pending.set(id,Promise.resolve().then(()=>loaders[id](panel)).catch(()=>{
   // Static examples and real destinations still work when an enhancement cannot load.
   pending.delete(id);words(panel.querySelector('.preview-outcome'),'互动暂时不可用；可以打开上方完整 Demo 继续体验。','This preview could not load. Open the full demo above to continue.');
  }));
 }
 allTabs.forEach(tab=>{
  tab.addEventListener('click',event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();activate(tab.dataset.selectedId);});
  tab.addEventListener('keydown',event=>{
   const ordered=[...tabs.children].filter(item=>!item.hidden&&item.matches('[data-selected-id]')),index=ordered.indexOf(tab),mobile=matchMedia('(max-width: 900px)').matches;
   const delta={ArrowRight:1,ArrowLeft:-1,ArrowDown:mobile?2:1,ArrowUp:mobile?-2:-1}[event.key];
   let next;if(event.key==='Home')next=ordered[0];else if(event.key==='End')next=ordered.at(-1);else if(delta)next=ordered[(index+delta+ordered.length)%ordered.length];
   if(next){event.preventDefault();activate(next.dataset.selectedId);next.focus({preventScroll:true});}
   if(event.key===' '){event.preventDefault();activate(tab.dataset.selectedId);}
  });
 });
 direction.addEventListener('change',()=>{
  const order=direction.selectedOptions[0].dataset.order.split(',');
  allTabs.forEach(tab=>{tab.hidden=!order.includes(tab.dataset.selectedId);});
  order.forEach(id=>tabs.append(allTabs.find(tab=>tab.dataset.selectedId===id)));
  activate(order[0]);
 });
 const syncOrientation=()=>tabs.setAttribute('aria-orientation',matchMedia('(max-width: 900px)').matches?'horizontal':'vertical');
 matchMedia('(max-width: 900px)').addEventListener('change',syncOrientation);syncOrientation();activate(direction.selectedOptions[0].dataset.order.split(',')[0],false);
}

// One shared, native dialog; original image links remain useful without JavaScript.
let dialog,lastImageTrigger;
function imageDialog(){
 if(dialog)return dialog;dialog=document.createElement('dialog');dialog.className='project-image-dialog';
 dialog.setAttribute('aria-labelledby','projectImageCaption');
 dialog.innerHTML='<div class="project-image-toolbar"><p id="projectImageCaption"></p><button type="button" class="project-image-close" autofocus><span data-zh="关闭" data-en="Close">关闭</span><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5"/></svg></button></div><div class="project-image-body"><img alt=""><p class="project-image-error" hidden></p></div><a class="project-image-original" target="_blank" rel="noopener"><span data-zh="单独打开原图" data-en="Open original image">单独打开原图</span> ↗</a>';
 document.body.append(dialog);
 const close=()=>dialog.close();dialog.querySelector('button').addEventListener('click',close);
 dialog.addEventListener('click',event=>{if(event.target===dialog)close();});
 dialog.addEventListener('close',()=>{document.documentElement.classList.remove('project-image-open');lastImageTrigger?.focus({preventScroll:true});});
 dialog.querySelector('img').addEventListener('error',()=>{dialog.querySelector('img').hidden=true;const error=dialog.querySelector('.project-image-error');error.hidden=false;words(error,'图片未能载入。可关闭预览，继续打开完整 Demo。','The image could not load. Close this preview to continue to the full demo.');});
 return dialog;
}
document.addEventListener('click',event=>{
 const link=event.target.closest('[data-preview-image]');if(!link||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||typeof HTMLDialogElement==='undefined')return;
 event.preventDefault();const modal=imageDialog(),img=modal.querySelector('img');lastImageTrigger=link;
 words(modal.querySelector('#projectImageCaption'),link.dataset.previewCaption,link.dataset.previewCaptionEn);
 translate(modal);img.hidden=false;modal.querySelector('.project-image-error').hidden=true;
 img.alt=en()?link.dataset.previewCaptionEn:link.dataset.previewCaption;img.src=link.href;modal.querySelector('.project-image-original').href=link.href;
 document.documentElement.classList.add('project-image-open');modal.showModal();
});
document.addEventListener('error',event=>{if(event.target.matches?.('.project-preview img'))event.target.closest('.project-preview').classList.add('preview-image-failed');},true);
// A cached image may have failed before the module registered its capture listener.
document.querySelectorAll('.project-preview img').forEach(img=>{if(img.complete&&!img.naturalWidth)img.closest('.project-preview').classList.add('preview-image-failed');});
// Static cards remain readable when JavaScript is unavailable, including the poker group.
document.documentElement.classList.add('showcase-enhanced');
if('IntersectionObserver' in window){
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}}),{threshold:.05});
 document.querySelectorAll('.project-library .reveal').forEach(el=>{if(reduced())el.classList.add('visible');else observer.observe(el);});
}
