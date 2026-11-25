const $ = selector => document.querySelector(selector);
const rows = [...document.querySelectorAll('.work-row')], byId = new Map(rows.map(r=>[r.dataset.projectId,r]));
const filters = [...document.querySelectorAll('[data-filter]')], filterSelect = $('#topicChoice');
const proof = $('#work-proof'), zoom = $('#full-proof'), compact = matchMedia('(max-width: 750px)');
const langButton=$('#workLanguage'), paletteSelect=$('#workPalette'), root=document.documentElement;
let topic='all', active=null, zoomOpener=null, closingByControl=false;
function store(key,value){try{localStorage.setItem(key,value);}catch{/* Private browsing still works. */}}
function translate(scope=document){
  const en=root.lang.startsWith('en');
  for(const el of scope.querySelectorAll('[data-zh]')) el.textContent=en?el.dataset.en:el.dataset.zh;
  for(const img of scope.querySelectorAll('img[data-alt-en]')){img.dataset.altZh ??= img.alt; img.alt=en?img.dataset.altEn:img.dataset.altZh;}
  langButton.textContent=en?'中':'EN';
  for(const [i,pair] of [['象牙纸','Ivory'],['深海','Deep sea'],['赤砂','Red sand'],['苔原','Tundra']].entries()) paletteSelect.options[i].textContent=pair[en?1:0];
}
function replaceState(fields,url=location.href){history.replaceState({...history.state,...fields},'',url);}
function remember(control=document.activeElement){
  const row=control?.closest('.work-row');
  const controls=row?[...row.querySelectorAll('a,button,summary')]:[];
  const marker=row&&controls.includes(control)?[row.dataset.projectId,controls.indexOf(control)]:null;
  replaceState({works:{topic,active,scrollY,focus:marker || history.state?.works?.focus,opened:rows.filter(r=>r.querySelector('details').open).map(r=>r.dataset.projectId)}});
}
function drawProof(id) {
  active=id;
  const row=byId.get(id), template=row?.querySelector('template');
  for(const r of rows){const on=r===row;r.classList.toggle('is-inspected',on);const btn=r.querySelector('[data-inspect]');
    if(btn){btn.setAttribute('aria-expanded',String(on));const label=btn.querySelector('span');
      label.dataset.zh=on?(compact.matches?'收起预览':'正在预览'):'预览界面';
      label.dataset.en=on?(compact.matches?'Close preview':'In preview'):'Preview interface';
      label.textContent=root.lang.startsWith('en')?label.dataset.en:label.dataset.zh;
    }}
  if(!template){proof.hidden=true;proof.replaceChildren();$('#desktop-proof').append(proof);return;}
  (compact.matches?row.querySelector('.inline-proof'):$('#desktop-proof')).append(proof);
  proof.replaceChildren(template.content.cloneNode(true));proof.hidden=false;translate(proof);
  const image=proof.querySelector('img'),surface=image.closest('.work-image');
  const ready=()=>surface.setAttribute('aria-busy','false');
  surface.setAttribute('aria-busy','true');
  image.addEventListener('load',ready,{once:true});
  if(image.complete&&image.naturalWidth>0)ready();
  function missingImage(){
    if(image.dataset.archiveSrc){const backup=image.dataset.archiveSrc;delete image.dataset.archiveSrc;image.src=backup;
      const caption=proof.querySelector('figcaption [data-zh]');caption.dataset.zh='Eval Lab · 较早的公开界面';caption.dataset.en='Eval Lab · Earlier public interface';
      for(const a of proof.querySelectorAll('[data-enlarge]'))a.href='/assets/work/showcase/eval.jpg';
      translate(proof);return;
    }
    for(const link of proof.querySelectorAll('.proof-heading a'))link.hidden=true;
    const note=document.createElement('p');note.dataset.zh='图片暂未载入，仍可打开工具或阅读方法。';note.dataset.en='Image unavailable. You can still open the tool or read the method.';image.parentNode.replaceWith(note);translate(proof);
  }
  image.addEventListener('error',missingImage);
}
function apply(topicKey, id, explicit=false){
  topic=filters.some(a=>a.dataset.filter===topicKey)?topicKey:'all';
  for(const r of rows)r.hidden=topic!=='all'&&r.dataset.topic!==topic;
  for(const f of filters){if(f.dataset.filter===topic)f.setAttribute('aria-current','true');else f.removeAttribute('aria-current');}
  const shown=rows.filter(r=>!r.hidden);
  document.querySelector('.work-layout').classList.toggle('list-only',!shown.some(r=>r.querySelector('template')));
  filterSelect.value=topic;$('#workCount').value=String(shown.length);
  const row=byId.get(id);
  drawProof(row&&!row.hidden&&row.querySelector('template')?id:(!compact.matches&&!explicit?rows.find(r=>!r.hidden&&r.querySelector('template'))?.dataset.projectId:null));
}
function selectTopic(next){
  if(next===topic)return;
  remember();const url = new URL(location.href);url.hash='';
  if(next==='all')url.searchParams.delete('topic');else url.searchParams.set('topic',next);
  history.pushState({},'',url);apply(next);
}
function restore(){
  const url=new URL(location.href), id=url.hash.startsWith('#project-')?url.hash.slice(9):null;
  const state=history.state?.works, row=byId.get(id);
  let next=url.searchParams.get('topic')||'all';
  if(row&&next!=='all'&&next!==row.dataset.topic)next=row.dataset.topic;
  apply(next,state?state.active:(row?.dataset.projectId||null),Boolean(state));
  for(const r of rows)r.querySelector('details').open=state?state.opened.includes(r.dataset.projectId):r===row&&r.dataset.topic==='practice';
  if(state)requestAnimationFrame(()=>{const [rid,index]=state.focus||[];if(Number.isInteger(index))byId.get(rid)?.querySelectorAll('a,button,summary')[index]?.focus({preventScroll:true});window.scrollTo({top:state.scrollY,behavior:'instant'});});
  else if(row)requestAnimationFrame(()=>row.scrollIntoView({block:'start',behavior:'instant'}));
}
for(const r of rows){const b=r.querySelector('[data-inspect]');if(b)b.hidden=false;}
for(const f of filters)f.addEventListener('click',ev=>{if(ev.metaKey||ev.ctrlKey||ev.shiftKey||ev.altKey)return;ev.preventDefault();selectTopic(f.dataset.filter);});
filterSelect.onchange=()=>selectTopic(filterSelect.value);
document.addEventListener('click',ev=>{
  const el=ev.target.closest('button,a'); if(!el)return;
  if(el.hasAttribute('data-inspect')){
    const id=el.dataset.inspect;
    if(!compact.matches&&active===id){
      const heading=proof.querySelector('.proof-heading');heading.tabIndex=-1;
      heading.focus({preventScroll:true});heading.scrollIntoView({block:'nearest',behavior:'instant'});
    }else drawProof(active===id?null:id);
    remember(el);
  } else if(el.hasAttribute('data-enlarge') && !ev.metaKey && !ev.ctrlKey && !ev.shiftKey && !ev.altKey && zoom.showModal){
    ev.preventDefault();remember();
    history.pushState({...history.state,worksZoom:active},'',location.href);
    openZoom(el);
  } else if(el.matches('.work-row a,.work-bar a,.work-title a'))remember(el);
});
function openZoom(el){
  if(!el||zoom.open)return;
  zoomOpener=el;const img=zoom.querySelector('img');
  img.src=el.href;img.alt=proof.querySelector('img')?.alt||byId.get(active)?.querySelector('h2').textContent||'';
  zoom.showModal();
}
zoom.addEventListener('close',()=>{
  if(history.state?.worksZoom){closingByControl=true;history.back();}
  zoom.querySelector('img').removeAttribute('src');zoomOpener?.focus({preventScroll:true});});
zoom.addEventListener('click',ev=>{if(ev.target===zoom)zoom.close();});
compact.addEventListener('change',()=>apply(topic,active));
langButton.onclick=()=>{root.lang=root.lang.startsWith('en')?'zh-CN':'en';store('portfolio-language',root.lang.startsWith('en')?'en':'zh');translate();};
paletteSelect.value=root.dataset.palette;paletteSelect.onchange=()=>{root.dataset.palette=paletteSelect.value;store('palette',paletteSelect.value);};
window.addEventListener('pagehide',()=>remember());
window.addEventListener('popstate',()=>{
  if(zoom.open&&!history.state?.worksZoom){zoom.close();return;}
  if(closingByControl&&!history.state?.worksZoom){closingByControl=false;return;}
  restore();
  if(history.state?.worksZoom)openZoom(proof.querySelector('[data-enlarge]'));
});
window.addEventListener('pageshow',ev=>{
  if(!ev.persisted)return;
  const url=new URL(location.href);
  try{
    const lang=url.searchParams.get('lang')||localStorage.getItem('portfolio-language');
    if(lang==='en'||lang==='zh')root.lang=lang==='en'?'en':'zh-CN';
    const palette=url.searchParams.get('palette')||localStorage.getItem('palette');
    if([...paletteSelect.options].some(o=>o.value===palette)){root.dataset.palette=palette;paletteSelect.value=palette;}
  }catch{}
  translate();restore();
});
translate();restore();
