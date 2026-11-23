export function escapeText(value){
 return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
export const isEnglish=()=>document.documentElement.lang==='en';
export const t=(zh,en)=>isEnglish()?en:zh;
export function download(filename,text,type='text/plain;charset=utf-8'){
 const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');
 a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
export function startPage(render){
 const toggle=document.querySelector('#language'),params=new URLSearchParams(location.search);
 const lang=params.get('lang');
 if(lang==='en')document.documentElement.lang='en';
 try{const p=localStorage.getItem('palette');if(['frost','mist','copper','indigo'].includes(p))document.documentElement.dataset.palette=p;}catch{}
 const refresh=()=>{
  document.querySelectorAll('[data-zh][data-en]').forEach(el=>{el.textContent=t(el.dataset.zh,el.dataset.en);});
  toggle.textContent=t('EN','中文');
  document.querySelector('title').textContent=document.querySelector('h1').textContent+' · Andy Zhang';
  render();
 };
 toggle.onclick=()=>{
  document.documentElement.lang=t('en','zh-CN');
  const url=new URL(location.href);url.searchParams.set('lang',isEnglish()?'en':'zh');history.replaceState(history.state,'',url);refresh();
 };
 refresh();
}
