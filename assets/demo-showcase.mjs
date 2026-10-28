import {renderProjectCards} from './project-cards.mjs';

// The page owns only ephemeral previews. Full tools keep their own state and storage.
const root=document.getElementById('selected');
const en=()=>document.documentElement.lang.startsWith('en');
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const words=(node,zh,english)=>{if(!node)return;node.dataset.zh=zh;node.dataset.en=english;node.textContent=en()?english:zh;};
const translate=node=>node.querySelectorAll('[data-zh]').forEach(el=>{el.textContent=el.dataset[en()?'en':'zh'];});
const feedback=node=>{if(node?.animate&&!reduced())node.animate([{opacity:.6,transform:'translateY(4px)'},{opacity:1,transform:'none'}],{duration:220,easing:'cubic-bezier(.16,1,.3,1)'});};
const press=(buttons,picked)=>buttons.forEach(button=>button.setAttribute('aria-pressed',String(button===picked)));
const fixture=id=>JSON.parse(document.getElementById(id).textContent);

window.refreshProjectLibrary=projects=>{
 const grid=document.getElementById('projectGrid');if(!grid)return;
 const cards=[...grid.querySelectorAll('[data-project-id]')];
 // The build already emits the exact same cards; keep their native motion/group handlers.
 if(cards.length===projects.length&&projects.every(p=>cards.some(card=>card.dataset.projectId===p.id)))return;
 grid.innerHTML=renderProjectCards(projects);translate(grid);
};

function initEval(panel){
 const button=panel.querySelector('[data-eval-locate]'),quote=panel.querySelector('[data-eval-source-quote]');
 button.disabled=false;
 button.addEventListener('click',()=>{
  const active=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(active));
  if(active){const mark=document.createElement('mark');mark.textContent=quote.textContent;quote.replaceChildren(mark);}
  else quote.replaceChildren(document.createTextNode(quote.textContent));
  words(button.querySelector('span'),active?'取消原文高亮':'定位评语中的引句',active?'Clear source highlight':'Locate the cited quotation');
  words(panel.querySelector('[data-eval-status]'),active?'已定位到原文。引用存在，是否支持评语仍待人工判断。':'点击定位，检查这条评语所引用的原文。',active?'Quotation located. Whether it supports the comment still requires human judgement.':'Locate the quotation to inspect the source behind the comment.');
  feedback(quote);
 });
}
async function initTaste(panel){
 const {directionSvg}=await import('../tasteroom/directions.js?v=20261027-studio1');
 const {room,content}=fixture('tastePreviewInput'),buttons=[...panel.querySelectorAll('[data-taste-direction]')];
 buttons.forEach(button=>{button.disabled=false;button.addEventListener('click',()=>{
  room.canvas.artDirection=button.dataset.tasteDirection;
  panel.querySelector('[data-taste-poster]').innerHTML=directionSvg(room,content);
  const swiss=room.canvas.artDirection==='swiss';
  words(panel.querySelector('[data-taste-composition]'),swiss?'严格网格':'错位拆分',swiss?'Strict grid':'Offset fragments');
  words(panel.querySelector('[data-taste-status]'),`${swiss?'瑞士现代主义':'解构主义'}构图；文案相同，未写入偏好记忆。`,`${swiss?'Swiss':'Deconstructed'} composition; the copy is unchanged and no preference is saved.`);
  panel.querySelector('[data-selected-demo=taste]').href='/tasteroom/?direction='+room.canvas.artDirection;
  press(buttons,button);feedback(panel.querySelector('[data-taste-poster]'));
 });});
}
async function initShared(panel){
 const {previewConditions}=await import('../suibianju/product.mjs?v=20261024-v2');
 const session=fixture('sharedPreviewInput'),member=session.members.find(m=>m.id==='c');
 const buttons=[...panel.querySelectorAll('[data-shared-budget]')];
 buttons.forEach(button=>{button.disabled=false;button.addEventListener('click',()=>{
  const budget=Number(button.dataset.sharedBudget),result=previewConditions(session,'c',{...member.conditions,budget});
  panel.querySelector('[data-shared-count]').textContent=result.after.length;
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
  panel.querySelector('[data-bundle-added]').textContent='+¥'+result.addedMargin.toFixed(2);
  panel.querySelector('[data-bundle-net]').textContent=(positive?'+':'−')+'¥'+Math.abs(result.marginLift).toFixed(2);
  panel.querySelector('[data-bundle-sign]').dataset.bundleSign=positive?'positive':'negative';
  panel.querySelector('[data-bundle-bar]').style.transform=`scaleX(${result.addedMargin/1.6})`;
  words(panel.querySelector('[data-bundle-status]'),positive?'新增贡献超过让利；当前假设下，每个覆盖订单多赚 ¥1.20。':'新增贡献不足以覆盖让利；当前假设下，每个覆盖订单少赚 ¥0.24。',positive?'Incremental contribution covers the discount: ¥1.20 more per covered order under these assumptions.':'Incremental contribution does not cover the discount: ¥0.24 less per covered order under these assumptions.');
  press(buttons,button);feedback(panel.querySelector('.preview-ledger-total'));
 });});
}

if(root){
 const direction=root.querySelector('#showcaseDirection'),tabs=root.querySelector('.showcase-choices');
 const allTabs=[...tabs.querySelectorAll('[data-selected-id]')],panels=[...root.querySelectorAll('[data-preview]')];
 const pending=new Map(),loaders={'trust':initEval,'taste':initTaste,'shared-choice':initShared,'bundles':initBundle};
 function activate(id,announce=true){
  const tab=allTabs.find(tab=>tab.dataset.selectedId===id);if(!tab)return;
  allTabs.forEach(item=>{const active=item===tab;item.setAttribute('aria-selected',String(active));item.tabIndex=active?0:-1;});
  panels.forEach(panel=>panel.hidden=panel.dataset.preview!==id);
  const panel=panels.find(panel=>panel.dataset.preview===id);
  if(announce){words(root.querySelector('#showcaseStatus'),`已展示 ${tab.querySelector('strong').dataset.zh}`,`Showing ${tab.querySelector('strong').dataset.en}`);feedback(panel);}
  if(!pending.has(id))pending.set(id,Promise.resolve().then(()=>loaders[id](panel)).catch(()=>{
   // Static examples and real destinations still work when an enhancement cannot load.
   pending.delete(id);words(panel.querySelector('.preview-outcome'),'互动暂时不可用；可以打开下方完整 Demo 继续体验。','This preview could not load. Open the full demo below to continue.');
  }));
 }
 allTabs.forEach(tab=>{
  tab.addEventListener('click',event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();activate(tab.dataset.selectedId);});
  tab.addEventListener('keydown',event=>{
   const ordered=[...tabs.children],index=ordered.indexOf(tab),mobile=matchMedia('(max-width: 900px)').matches;
   const delta={ArrowRight:1,ArrowLeft:-1,ArrowDown:mobile?2:1,ArrowUp:mobile?-2:-1}[event.key];
   let next;if(event.key==='Home')next=ordered[0];else if(event.key==='End')next=ordered.at(-1);else if(delta)next=ordered[(index+delta+ordered.length)%ordered.length];
   if(next){event.preventDefault();activate(next.dataset.selectedId);next.focus({preventScroll:true});}
   if(event.key===' '){event.preventDefault();activate(tab.dataset.selectedId);}
  });
 });
 direction.addEventListener('change',()=>{const order=direction.selectedOptions[0].dataset.order.split(',');order.forEach(id=>tabs.append(allTabs.find(tab=>tab.dataset.selectedId===id)));activate(order[0]);});
 const syncOrientation=()=>tabs.setAttribute('aria-orientation',matchMedia('(max-width: 900px)').matches?'horizontal':'vertical');
 matchMedia('(max-width: 900px)').addEventListener('change',syncOrientation);syncOrientation();activate('trust',false);
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
