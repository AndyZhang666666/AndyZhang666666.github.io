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
 const refresh=()=>{
  document.querySelectorAll('[data-zh][data-en]').forEach(el=>{el.textContent=t(el.dataset.zh,el.dataset.en);});
  document.title=document.querySelector('h1').textContent+' · Andy Zhang';
  render();
 };
 document.addEventListener('demo-language',refresh);
 refresh();
}
