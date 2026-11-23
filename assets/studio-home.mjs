import {escapeText as esc,t} from '../studio/ui.mjs';
import {setupResearch} from './research-instruments.mjs';
const html=document.documentElement,selected=document.querySelector('#selected');
const desk=document.querySelector('.workdesk');
if(desk){
 const files=[...desk.querySelectorAll('details')];
 files.forEach(f=>f.addEventListener('toggle',()=>{if(f.open)files.filter(other=>other!==f).forEach(other=>other.open=false);}));
 document.addEventListener('pointerdown',ev=>{if(!desk.contains(ev.target))files.forEach(f=>f.open=false);});
 desk.addEventListener('keydown',ev=>{const f=ev.target.closest('details');if(ev.key==='Escape'&&f?.open){f.open=false;f.querySelector('summary').focus();ev.preventDefault();}});
}
setupResearch();
if(selected){
 const tabs=()=>[...selected.querySelectorAll('[data-selected-id]')].filter(x=>!x.hidden),active=()=>tabs().find(x=>x.getAttribute('aria-selected')==='true');
 const quick=document.createElement('label');quick.className='studio-switch';
 quick.innerHTML='<span></span><select aria-label="换作品 / Switch work"></select>';
 const stage=selected.querySelector('.showcase-stage');
 stage.prepend(quick);
 const quickSelect=quick.querySelector('select');
 function syncSwitch(){
  const list=tabs(),current=active();
  quick.firstChild.textContent=t('换作品','Switch work');
  quickSelect.innerHTML=list.map((tab,i)=>'<option value="'+tab.dataset.selectedId+'" '+(tab===current?'selected':'')+'>'+esc(tab.querySelector('strong').textContent)+' · '+(i+1)+'/'+list.length+'</option>').join('');
 }
 quickSelect.onchange=()=>tabs().find(x=>x.dataset.selectedId===quickSelect.value)?.click();
 new MutationObserver(syncSwitch).observe(selected.querySelector('.showcase-choices'),{attributes:true,childList:true,subtree:true,attributeFilter:['aria-selected','hidden']});
 const guide=document.createElement('section');guide.className='studio-guide';guide.setAttribute('aria-label','放映路线 / Presentation routes');
 guide.innerHTML='<label><span></span><select id="studioRoute"></select></label><div id="studioFilm" hidden></div>';
 selected.prepend(guide);
 const picker=guide.querySelector('select'),film=guide.querySelector('#studioFilm');
 let route='free',act=0,sample,menu,model,ticket=0,revealed=false,review='',rule='alias',decision='',rate=.1;
 const titles=()=>({free:t('自由演示 · 四个作品','Free tour · four works'),ai:t('AI 产品 · 复核一条评语','AI product · review a score'),strategy:t('策略产品 · 一次搜索改动','Strategy · change a search rule'),growth:t('增长商业化 · 套餐的账','Growth · the cost of a bundle')});
 const series=()=>({ai:[t('这条 2/5 从哪来？','Where did 2/5 come from?'),t('回到被引用的那一行','Read the cited line'),t('留下你的复核意见','Record your judgment')],strategy:[t('把音译加进菜单','Add a transliteration'),t('看找回，也看错配','Inspect recoveries and regressions'),t('你会放行哪条规则？','Which rule would you release?')],growth:[t('多少人会新买套餐？','How many will adopt?'),t('谁承担了折扣？','Who receives the discount?'),t('至少需要多少人采纳？','What is the break-even adoption?')]});
 function syncRoute(){
  guide.querySelector('label span').textContent=t('放映路线','Presentation route');
  picker.innerHTML=Object.entries(titles()).map(([v,label])=>'<option value="'+v+'" '+(v===route?'selected':'')+'>'+label+'</option>').join('');
 }
 const link=(href,label)=>'<a href="'+href+'" target="_blank" rel="noopener">'+label+' ↗</a>';
 async function show(focus=false){
  const myTicket=++ticket,guided=route!=='free'&&html.hasAttribute('data-presentation');
  selected.toggleAttribute('data-guided',guided);film.hidden=!guided;
  if(!guided)return;
  let body='';
  try{
   if(route==='ai'){
    sample??=await fetch(new URL('./demo-preview/eval-sample.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('sample');return r.json();});
    const d=sample.dimension,cite=d.evidence[0],pos=sample.text.indexOf(cite);
    if(act===0)body='<div class="film-score">'+d.score+'<small>/5</small></div><p>'+t('结构 · 历史评测 e06','Structure · historical review e06')+' · '+esc(sample.model)+'</p><blockquote>'+esc(d.comment)+'</blockquote>';
    if(act===1)body='<button id="citeLine" aria-pressed="'+revealed+'">'+t('定位引用','Locate citation')+'</button><blockquote class="film-excerpt">'+(revealed&&pos>=0?esc(sample.text.slice(0,pos))+'<mark>'+esc(cite)+'</mark>'+esc(sample.text.slice(pos+cite.length)):esc(sample.text))+'</blockquote>';
    if(act===2)body='<label>'+t('截断稿能否用完整故事的标准评分？','Should a fragment be graded as a complete story?')+'<textarea id="filmOpinion" rows="2" maxlength="900">'+esc(review)+'</textarea></label><p>'+t('本次放映的临时笔记可单独带走。','Take your session note with you.')+'</p><button id="exportNote" '+(!review.trim()?'disabled':'')+'>'+t('下载我的意见','Download my note')+' ↓</button> '+link('/llm-output-eval/?sample=e06&dimension=structure',t('在 Eval Lab 完整复核','Review in Eval Lab'));
   }
   if(route==='strategy'){
    menu??=await import('../studio/menu/search.mjs');
    const qry='shawerma chicken wrap',results=menu.search(menu.dishes,qry,rule),batch=menu.compare(menu.dishes,menu.originalQueries,'literal',rule);
    const dish=id=>{const d=menu.dishes.find(v=>v.id===id);return d?t(d.zh,d.en):t('无结果','No result');};
    const controls='<label>'+t('候选规则','Candidate rule')+' <select id="filmRule">'+[['literal',t('按原词','Literal')],['alias',t('加入 shawerma 别名','Add shawerma alias')],['wide',t('卷类扩展，按销量排','Expand wraps, prioritize sales')]].map(([k,v])=>'<option value="'+k+'" '+(k===rule?'selected':'')+'>'+v+'</option>').join('')+'</select></label>';
    if(act===0)body='<blockquote lang="en">'+qry+'</blockquote>'+controls+'<p>'+t('首位结果','Top dish')+' <strong>'+esc(dish(results[0]?.dish.id))+'</strong></p>';
    if(act===1){const lost=batch.filter(r=>r.status==='lost'),won=batch.filter(r=>r.status==='won');body=controls+'<div class="film-metrics"><b>+'+won.length+' <small>'+t('首位找回','recovered')+'</small></b><b>−'+lost.length+' <small>'+t('首位变差','regressed')+'</small></b></div><ul>'+[...lost,...won].slice(0,3).map(r=>'<li>'+esc(r.q)+' · '+esc(dish(r.before[0]))+' → '+esc(dish(r.after[0]))+'</li>').join('')+'</ul>';}
    if(act===2)body='<p>'+t('用这批标注查询作依据，选一个发布判断。','Make a release decision from this labeled batch.')+'</p><div class="film-decisions">'+[[1,t('仅放行别名','Ship aliases only')],[2,t('再标注错配','Label more mismatches')],[3,t('保留原规则','Keep baseline')]].map(([v,l])=>'<button data-decision="'+v+'" aria-pressed="'+(decision===String(v))+'">'+l+'</button>').join('')+'</div>'+link('/studio/menu/',t('用自己的菜单复验','Test your own menu'));
   }
   if(route==='growth'){
    model??=await import('./demo-preview/bundle-model.mjs');
    const args=JSON.parse(document.getElementById('bundlePreviewInput').textContent),r=model.simulateOne({...args,adoption:rate}),be=model.breakEvenAdoption(args),val=n=>'¥'+n.toFixed(2);
    const slider='<label>'+t('新增采纳率','New adoption')+' <select id="filmRate">'+[.05,.1,.2,.35,.5].map(v=>'<option value="'+v+'" '+(v===rate?'selected':'')+'>'+Math.round(v*100)+'%</option>').join('')+'</select></label>';
    if(act===0)body='<blockquote>'+t('可乐＋鸡腿饭','Cola + chicken rice')+'</blockquote>'+slider+'<p>'+t('每个覆盖订单的新增毛利贡献','Added contribution per covered order')+' <b>'+val(r.addedMargin)+'</b></p>';
    if(act===1)body=slider+'<dl class="film-accounts">'+[[t('新增购买的贡献','Added contribution'),val(r.addedMargin)],[t('原本就买齐的顾客获得让利','Discounts to existing buyers'),'−'+val(r.existingLoss)],[t('增量毛利 / 覆盖订单','Incremental margin / covered order'),val(r.marginLift)]].map(([a,b])=>'<div><dt>'+a+'</dt><dd>'+b+'</dd></div>').join('')+'</dl>';
    if(act===2)body='<div class="film-score">'+(be.rate===null?t('不可达','Unreachable'):(be.rate*100).toFixed(1)+'%')+'</div><p>'+t('内置模拟订单的平衡采纳率。实际是否达到，还要验证成本与真实采纳。','Break-even adoption for these synthetic orders. Real costs and take-up still need validation.')+'</p>'+link('/bundle-lab/simulate/',t('换一组经营假设','Try a different scenario'));
   }
   if(myTicket!==ticket)return;
   film.innerHTML='<header><small>'+ (act+1)+' / 3　'+titles()[route]+'</small><h3 tabindex="-1">'+series()[route][act]+'</h3></header><div class="film-page">'+body+'</div><nav><button id="prevAct" '+(!act?'disabled':'')+'>← '+t('上一幕','Back')+'</button><button id="nextAct">'+(act===2?t('回到自由演示','Back to free tour'):t('下一幕','Next'))+' →</button></nav>';
   const $=id=>film.querySelector('#'+id);
   $('prevAct').onclick=()=>step(-1);$('nextAct').onclick=()=>step(1);
   if($('citeLine'))$('citeLine').onclick=()=>{revealed=!revealed;show().then(()=>$('citeLine')?.focus());};
   if($('filmOpinion'))$('filmOpinion').oninput=e=>{review=e.target.value;$('exportNote').disabled=!review.trim();};
   if($('exportNote'))$('exportNote').onclick=async()=>{const {download}=await import('../studio/ui.mjs');download('e06-review.txt',[sample.sampleId,sample.dimension.comment,sample.dimension.evidence[0],review].join('\n\n'));};
   if($('filmRule'))$('filmRule').onchange=e=>{rule=e.target.value;show().then(()=>$('filmRule')?.focus());};
   if($('filmRate'))$('filmRate').onchange=e=>{rate=Number(e.target.value);show().then(()=>$('filmRate')?.focus());};
   film.querySelectorAll('[data-decision]').forEach(b=>b.onclick=()=>{decision=b.dataset.decision;show().then(()=>film.querySelector('[data-decision="'+decision+'"]')?.focus());});
   if(focus)film.querySelector('h3').focus({preventScroll:true});
  }catch(err){if(myTicket===ticket)film.innerHTML='<p>'+t('此幕资料暂时无法载入。','This scene could not load.')+'</p>'+link(({ai:'/llm-output-eval/',strategy:'/studio/menu/',growth:'/bundle-lab/simulate/'})[route],t('打开完整工具','Open full tool'));}
 }
 function step(dir){if(act===2&&dir>0){route='free';act=0;syncRoute();show();picker.focus();return;}act=Math.max(0,Math.min(2,act+dir));show(true);}
 picker.onchange=()=>{route=picker.value;act=0;show(true);};
 document.addEventListener('keydown',e=>{if(!selected.hasAttribute('data-guided')||e.defaultPrevented||e.altKey||e.metaKey||e.ctrlKey||e.target.closest('input,select,textarea,[contenteditable=true]'))return;if(['ArrowRight','ArrowLeft'].includes(e.key)){e.preventDefault();step(e.key==='ArrowRight'?1:-1);}});
 new MutationObserver(records=>{if(records.some(x=>x.attributeName==='data-presentation')&&!html.hasAttribute('data-presentation')){route='free';act=0;rule='alias';decision='';review='';revealed=false;rate=.1;}syncRoute();syncSwitch();show();}).observe(html,{attributes:true,attributeFilter:['lang','data-presentation']});
 syncRoute();syncSwitch();
}
