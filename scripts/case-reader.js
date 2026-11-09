(() => {
 function mount(){
 let en=false;try{const p=localStorage.getItem('palette');if(p)document.documentElement.dataset.palette=p}catch{}
 document.getElementById('langToggle')?.addEventListener('click',()=>{en=!en;document.documentElement.lang=en?'en':'zh-CN';document.querySelectorAll('[data-zh]').forEach(n=>n.textContent=n.dataset[en?'en':'zh']);document.getElementById('langToggle').textContent=en?'中':'EN'});
 const palette=document.getElementById('paletteSwitch');
 const syncPalette=()=>palette?.querySelectorAll('button[data-palette]').forEach(button=>{
  const selected=button.dataset.palette===document.documentElement.dataset.palette;
  button.setAttribute('aria-pressed',String(selected));button.classList.toggle('active',selected);
 });
 palette?.addEventListener('click',event=>{
  const button=event.target.closest('button[data-palette]');if(!button)return;
  document.documentElement.dataset.palette=button.dataset.palette;
  try{localStorage.setItem('palette',button.dataset.palette)}catch{}
  syncPalette();
 });
 syncPalette();
 }
 // The generated palette is below this classic script in case pages. Wait for
 // parsing to finish so the original controls receive their real listeners.
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
