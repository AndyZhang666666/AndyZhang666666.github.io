import {prepareReel} from './work-reel.mjs';

const element=document.documentElement;
const all=[...document.querySelectorAll('.work-row')];
const rows=new Map(all.map(row=>[row.dataset.projectId,row]));
const filters=[...document.querySelectorAll('[data-filter]')];
const palette=document.getElementById('workPalette'), language=document.getElementById('workLanguage');
const select=document.getElementById('topicChoice'), count=document.getElementById('workCount'), catalog=document.getElementById('catalog');
const zoom=document.getElementById('full-proof'), zoomImage=zoom.querySelector('img'), error=zoom.querySelector('.zoom-error');
let topic='all', active=null, opener=null;
const english=()=>element.lang.startsWith('en');
const drawer=id=>rows.get(id)?.querySelector('.work-drawer');
const reel=id=>rows.get(id)?.querySelector('.work-reel');
const cleanClick=ev=>!ev.metaKey&&!ev.ctrlKey&&!ev.shiftKey&&!ev.altKey;
function store(key,value){try{localStorage.setItem(key,value);}catch{}}
function translate(){
  for(const el of document.querySelectorAll('[data-zh]'))el.textContent=english()?el.dataset.en:el.dataset.zh;
  for(const img of document.querySelectorAll('img[data-alt-en]')){img.dataset.altZh??=img.alt;img.alt=english()?img.dataset.altEn:img.dataset.altZh;}
  language.textContent=english()?'中':'EN';
  for(const [i,names] of [['象牙纸','Ivory'],['深海','Deep sea'],['赤砂','Red sand'],['苔原','Tundra']].entries())palette.options[i].textContent=names[english()?1:0];
}
function applyFilter(next){
  topic=filters.some(f=>f.dataset.filter===next)?next:'all';select.value=topic;
  for(const row of all)row.hidden=topic!=='all'&&row.dataset.topic!==topic;
  for(const f of filters){if(f.dataset.filter===topic)f.setAttribute('aria-current','true');else f.removeAttribute('aria-current');}
  count.value=String(all.filter(row=>!row.hidden).length);
}
function setDrawer(id){
  const next=rows.get(id);
  active=next&&!next.hidden?id:null;
  for(const row of all)drawer(row.dataset.projectId).open=row.dataset.projectId===active;
  return prepareReel(reel(active));
}
function focusControl(control){if(control)control.focus({preventScroll:true});}
const controls=row=>[...row.querySelectorAll('summary,a,button,.reel-track[tabindex]')];
function remember(control=document.activeElement){
  const row=control?.closest('.work-row');
  const focus=row?[row.dataset.projectId,controls(row).indexOf(control)]:null;
  history.replaceState({...history.state,works:{scroll:scrollY,active,topic,frame:reel(active)?.reel?.index||0,focus}},'',location.href);
}
function jumpRow(id){const node=rows.get(id);if(node)node.scrollIntoView({block:'start',behavior:'instant'});}
function inspect(row,control){
  const id=row.dataset.projectId, closing=id===active;
  remember(control);
  const y=row.getBoundingClientRect().top;
  const target=new URL(location.href);target.hash=closing?'catalog':'project-'+id;
  history.pushState({},'',target);
  setDrawer(closing?null:id);
  const summary=row.querySelector('summary');
  if(closing||y<0||y>innerHeight*.7)jumpRow(id);
  else window.scrollBy({top:row.getBoundingClientRect().top-y,behavior:'instant'});
  focusControl(summary);remember(summary);
}
function changeTopic(next){
  if(next===topic)return;
  remember();
  const url=new URL(location.href);url.hash='catalog';
  if(next==='all')url.searchParams.delete('topic');else url.searchParams.set('topic',next);
  history.pushState({},'',url);applyFilter(next);setDrawer(null);
  catalog.scrollIntoView({block:'start',behavior:'instant'});remember();
}
for(const row of all){
  const summary=row.querySelector('summary'), close=row.querySelector('.close-drawer');
  close.hidden=false;
  summary.addEventListener('click',ev=>{ev.preventDefault();inspect(row,summary);});
  close.addEventListener('click',()=>inspect(row,close));
  // Browser find-in-page can open native details without a click.
  row.querySelector('details').addEventListener('toggle',ev=>{if(ev.target.open&&active!==row.dataset.projectId)setDrawer(row.dataset.projectId);});
}
for(const f of filters)f.addEventListener('click',ev=>{if(cleanClick(ev)){ev.preventDefault();changeTopic(f.dataset.filter);}});
select.addEventListener('change',()=>changeTopic(select.value));
function showImage(control){
  if(!control||zoom.open)return;
  opener=control;error.hidden=true;zoomImage.hidden=false;zoomImage.alt=control.closest('figure').querySelector('img').alt;
  zoomImage.src=control.href;zoom.showModal();
}
zoomImage.addEventListener('error',()=>{zoomImage.hidden=true;error.hidden=false;});
function closeImage(){if(history.state?.workImage)history.back();else zoom.close();}
zoom.addEventListener('cancel',ev=>{ev.preventDefault();closeImage();});
zoom.querySelector('form').addEventListener('submit',ev=>{ev.preventDefault();closeImage();});
zoom.addEventListener('click',ev=>{if(ev.target===zoom)closeImage();});
zoom.addEventListener('close',()=>{zoomImage.removeAttribute('src');focusControl(opener);});
document.addEventListener('click',ev=>{
  const a=ev.target.closest('a');if(!a||!cleanClick(ev))return;
  if(a.hasAttribute('data-enlarge')&&zoom.showModal){
    ev.preventDefault();remember(a);
    const i=[...reel(active).querySelectorAll('figure')].indexOf(a.closest('figure'));
    history.pushState({...history.state,workImage:i+1},'',location.href);showImage(a);
  }else if(a.closest('.work-row,.work-bar'))remember(a);
});
document.addEventListener('keydown',ev=>{
  if(ev.key==='Escape'&&!zoom.open&&active&&ev.target.closest('.work-drawer')){ev.preventDefault();inspect(rows.get(active),ev.target);}
});
function restore(){
  if(zoom.open&&!history.state?.workImage){
    zoom.close();focusControl(opener);
    requestAnimationFrame(()=>{if(!zoom.open&&document.activeElement===document.body)focusControl(opener);});
    return;
  }
  const url=new URL(location.href), anchor=rows.get(url.hash.replace(/^#project-/,''));
  const state=history.state?.works;
  let next=url.searchParams.get('topic')||'all';if(anchor&&next!=='all'&&next!==anchor.dataset.topic)next=anchor.dataset.topic;
  applyFilter(next);const gallery=setDrawer(anchor?.dataset.projectId||null);
  const img=history.state?.workImage;
  requestAnimationFrame(()=>{
    if(gallery)gallery.go(img?img-1:(state?.frame||0),true);
    if(img&&gallery){showImage(gallery.frames[img-1]?.querySelector('[data-enlarge]'));return;}
    if(state&&state.topic===topic&&state.active===active){
      const [id,i]=state.focus||[];if(rows.has(id))focusControl(controls(rows.get(id))[i]);
      window.scrollTo({top:state.scroll,behavior:'instant'});
    }else if(anchor)jumpRow(anchor.dataset.projectId);
    else if(url.hash==='#catalog'||(url.searchParams.has('topic')&&!url.hash))catalog.scrollIntoView({block:'start',behavior:'instant'});
  });
}
language.onclick=()=>{element.lang=english()?'zh-CN':'en';store('portfolio-language',english()?'en':'zh');translate();};
palette.value=element.dataset.palette;palette.onchange=()=>{element.dataset.palette=palette.value;store('palette',palette.value);};
window.addEventListener('popstate',restore);
window.addEventListener('pagehide',()=>{if(!zoom.open)remember();});
window.addEventListener('pageshow',ev=>{if(!ev.persisted)return;
  const params=new URLSearchParams(location.search);
  try{
    const lang=params.get('lang')||localStorage.getItem('portfolio-language');if(lang)element.lang=lang==='en'?'en':'zh-CN';
    const p=params.get('palette')||localStorage.getItem('palette');if([...palette.options].some(o=>o.value===p)){element.dataset.palette=p;palette.value=p;}
  }catch{}
  translate();restore();
});
translate();restore();
