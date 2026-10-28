import {escapeHtml as e} from './project-cards.mjs';
const text=(tag,cls,zh,en)=>`<${tag} class="${cls}" data-zh="${e(zh)}" data-en="${e(en)}">${e(zh)}</${tag}>`;
const arrow='<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const diagrams=[
 `<svg class="practice-diagram" viewBox="0 0 480 176" fill="none" aria-hidden="true"><g class="practice-path" stroke="currentColor" stroke-width="1.4"><path pathLength="1" d="M128 32h32c40 0 30 56 72 56M128 88h104M128 144h32c40 0 30-56 72-56"/><path pathLength="1" d="M278 88h38"/></g><g class="practice-label" fill="currentColor" font-size="16"><text x="24" y="38" data-zh="用户是谁" data-en="Who is it for?">用户是谁</text><text x="24" y="94" data-zh="要做什么" data-en="The task">要做什么</text><text x="24" y="150" data-zh="哪里卡住" data-en="The obstacle">哪里卡住</text></g><circle class="practice-node" cx="254" cy="88" r="22" fill="var(--bg-0)" stroke="var(--accent)" stroke-width="1.5"/><circle cx="254" cy="88" r="7" fill="var(--accent)"/><rect x="316" y="55" width="144" height="66" rx="12" fill="var(--bg-0)" stroke="var(--border-strong)"/><text class="practice-label practice-output" x="388" y="95" text-anchor="middle" font-size="19" fill="var(--fg)" data-zh="一句话的问题" data-en="One clear problem">一句话的问题</text></svg>`,
 `<svg class="practice-diagram" viewBox="0 0 168 140" fill="none" aria-hidden="true"><path class="practice-path" pathLength="1" d="M20 72h40m48 0h40M84 20v23m0 59v19" stroke="currentColor" stroke-width="1.4"/><path d="m84 43 25 29-25 30-25-30 25-29Z" fill="var(--bg-0)" stroke="var(--accent)" stroke-width="1.5"/><circle class="practice-node" cx="84" cy="20" r="5" fill="var(--accent)"/><circle cx="84" cy="122" r="5" fill="var(--second)"/><path d="m76 72 6 6 11-13" stroke="var(--fg)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
 `<svg class="practice-diagram" viewBox="0 0 168 140" fill="none" aria-hidden="true"><rect x="34" y="37" width="97" height="69" rx="10" fill="var(--bg-0)" stroke="var(--border-strong)"/><path d="m59 62-9 9 9 9m48-18 9 9-9 9m-20-22-8 25" stroke="var(--fg)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path class="practice-path" pathLength="1" d="M136 45c16-27-51-49-96-25M31 96c-16 27 51 49 96 25" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round"/><path d="m41 13-6 9 12 1m76 91 9 5-10 8" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle class="practice-node" cx="140" cy="69" r="5" fill="var(--second)"/></svg>`,
];
const emblem='<svg class="practice-emblem" viewBox="0 0 96 96" fill="none" aria-hidden="true"><path class="practice-path" pathLength="1" d="M14 19c18 0 13 29 32 29M14 48h32M14 77c18 0 13-29 32-29M62 48h21" stroke="currentColor" stroke-width="1.3"/><circle class="practice-node" cx="54" cy="48" r="9" fill="var(--bg-0)" stroke="var(--accent)" stroke-width="1.5"/><circle cx="54" cy="48" r="3" fill="var(--accent)"/></svg>';
const proof=[
 {id:'problem',href:'/cases/shared-choice/#problem',zh:'随便局 · 把「随便」拆成条件',en:'Suibianju · Turn “anything” into conditions'},
 {id:'evidence',href:'/cases/trust/#evidence',zh:'Eval Lab · 分数之外，继续复核',en:'Eval Lab · Review beyond the score'},
 {id:'build',href:'/tasteroom/?direction=swiss',zh:'偏爱实验室 · 做出来，再验证',en:'TasteRoom · Build it, then test it'},
];
export function renderProductPrinciples(principles){
 return principles.map((p,i)=>{const link=proof[i];return `<article class="principle-card practice-card${i===0?' practice-focus':''}" data-principle="${link.id}"><div class="practice-art">${diagrams[i]}${i===0?emblem:''}</div><div class="practice-body">${text('h3','principle-title',p.zh,p.en)}${text('p','principle-desc',p.dz,p.de)}<a class="practice-link" href="${link.href}" target="_blank" rel="noopener">${text('span','',link.zh,link.en)}${arrow}</a></div></article>`;}).join('');
}
export function initProductPrinciples(root){
 if(!root||root.dataset.practiceReady)return;root.dataset.practiceReady='true';
 const cards=[...root.querySelectorAll('[data-principle]')],reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const fine=matchMedia('(min-width:980px) and (hover:hover)');
 let frame=0,current,target={x:0,y:0};
 function paint(){frame=0;if(current){current.style.setProperty('--practice-rx',(-target.y*.65).toFixed(2)+'deg');current.style.setProperty('--practice-ry',(target.x*.65).toFixed(2)+'deg');}}
 function reset(card){card.style.removeProperty('--practice-rx');card.style.removeProperty('--practice-ry');}
 cards.forEach(card=>{
  card.addEventListener('pointermove',event=>{
   if(reduce.matches||!fine.matches||event.pointerType!=='mouse')return;
   if(current&&current!==card)reset(current);current=card;
   const r=card.getBoundingClientRect();target={x:Math.max(-1,Math.min(1,(event.clientX-r.left)/r.width*2-1)),y:Math.max(-1,Math.min(1,(event.clientY-r.top)/r.height*2-1))};
   if(!frame)frame=requestAnimationFrame(paint);
  },{passive:true});
  card.addEventListener('pointerleave',()=>{if(current===card){current=null;cancelAnimationFrame(frame);frame=0;}reset(card);});
 });
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('practice-entered');observer.unobserve(entry.target);}}),{threshold:.12});
 cards.forEach(card=>observer.observe(card));
 reduce.addEventListener('change',()=>{if(reduce.matches){cards.forEach(card=>{reset(card);card.getAnimations({subtree:true}).forEach(a=>a.cancel());});cancelAnimationFrame(frame);frame=0;current=null;}});
 root.addEventListener('pointerdown',event=>{
  const link=event.target.closest('.practice-link');if(!link||reduce.matches||event.button!==0)return;
  link.animate([{scale:'1'},{scale:'.975',offset:.3},{scale:'1'}],{duration:230,easing:'cubic-bezier(.16,1,.3,1)'});
 },{passive:true});
}
