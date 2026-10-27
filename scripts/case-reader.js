(() => {
 let en=false;try{const p=localStorage.getItem('palette');if(p)document.documentElement.dataset.palette=p}catch{}
 document.getElementById('langToggle')?.addEventListener('click',()=>{en=!en;document.documentElement.lang=en?'en':'zh-CN';document.querySelectorAll('[data-zh]').forEach(n=>n.textContent=n.dataset[en?'en':'zh']);document.getElementById('langToggle').textContent=en?'中':'EN'});
})();
