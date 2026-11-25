(() => {
  // Old links also arrive from case pages, shared bookmarks and the browser's back stack.
  function oldLink(){
    if(location.hash==='#projects'||/^#project-[\w-]+$/.test(location.hash)){
      const dest=new URL('/works/',location.origin);dest.search=location.search;
      if(location.hash!=='#projects')dest.hash=location.hash;
      location.replace(dest.href);
    }
  }
  oldLink();addEventListener('hashchange',oldLink);
  function syncLanguage(){
    let lang=null;try{lang=new URLSearchParams(location.search).get('lang') || localStorage.getItem('portfolio-language');}catch{}
    if((lang==='en'||lang==='zh') && document.documentElement.lang.startsWith('en')!==(lang==='en'))document.getElementById('langToggle')?.click();
  }
  document.addEventListener('portfolio:ready',syncLanguage,{once:true});
  window.addEventListener('pageshow',e=>{if(e.persisted)syncLanguage();});
  document.addEventListener('click',e=>{if(!e.target.closest('#langToggle'))return;try{localStorage.setItem('portfolio-language',document.documentElement.lang.startsWith('en')?'en':'zh');}catch{}});
})();
