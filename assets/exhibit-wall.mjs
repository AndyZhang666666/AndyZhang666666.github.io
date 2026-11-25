import {isEnglish} from '../studio/ui.mjs';

function wording(node,zh,en) {
  node.dataset.zh=zh;node.dataset.en=en;node.textContent=isEnglish()?en:zh;
}
export function mountWall(root) {
  const section=root?.closest('#projects');
  if(!section)return;
  function install(){
    const filters=section.querySelector('.library-controls');
    if(!filters||!root.querySelector('.pgroup-main'))return false;
    if(section.hasAttribute('data-exhibit-view'))return true;
    const saved=history.state?.portfolioExhibit||{};
    let view=saved.view==='index'?'index':'wall',current=null;
    const remembered={...saved.choices};
    const choices=document.createElement('div');
    choices.className='wall-switch';choices.setAttribute('role','group');choices.setAttribute('aria-label','作品浏览方式 / Collection view');
    for(const [key,zh,en] of [['wall','展墙','Gallery'],['index','目录','Index']]){
      const b=document.createElement('button');b.type='button';b.dataset.wallMode=key;b.setAttribute('aria-controls',root.id);
      wording(b,zh,en);choices.append(b);
    }
    filters.querySelector('.library-filter-heading').append(choices);
    function cards(){return [...root.querySelectorAll('article[data-project-id]')];}
    const category=()=>root.dataset.libraryFilter||'all';
    function save(){
      try{history.replaceState({...history.state,portfolioExhibit:{view,choices:remembered,filter:category()}},'');}catch{}
    }
    function updateCards(){
      for(const card of cards()){
        const active=card.dataset.projectId===current;
        card.toggleAttribute('data-wall-current',active);
        let pick=card.querySelector('.wall-pick');
        if(!pick){
          const name=card.querySelector('.project-name,h3');if(!name)continue;
          pick=document.createElement('button');pick.type='button';pick.className='wall-pick';
          pick.setAttribute('aria-controls',card.id);name.after(pick);
        }
        const name=card.querySelector('.project-name,h3'),zh=name?.dataset.zh||name?.textContent||'',en=name?.dataset.en||zh;
        const action=active?['收起','Fold']:['展开','Open'];
        wording(pick,action[0]+'作品',action[1]+' entry');
        pick.setAttribute('aria-label',(isEnglish()?action[1]+' '+en:action[0]+zh));pick.setAttribute('aria-expanded',String(active));
      }
    }
    function select(id){
      current=id;remembered[category()]=id;updateCards();save();
    }
    function setView(key){
      view=key;section.dataset.exhibitView=key;
      for(const b of choices.children)b.setAttribute('aria-pressed',String(b.dataset.wallMode===key));
      save();
    }
    function sync(){
      const available=cards().filter(c=>!c.hidden);
      let target=Object.hasOwn(remembered,category())?remembered[category()]:available[0]?.dataset.projectId;
      if(target&&!available.some(c=>c.dataset.projectId===target))target=available[0]?.dataset.projectId;
      select(target||null);
    }
    choices.addEventListener('click',e=>{const key=e.target.closest('[data-wall-mode]')?.dataset.wallMode;if(key)setView(key);});
    root.addEventListener('click',e=>{
      if(e.ctrlKey||e.metaKey||e.altKey||e.shiftKey)return;
      const card=e.target.closest('article[data-project-id]');if(!card)return;
      const pick=e.target.closest('.wall-pick'),image=e.target.closest('[data-preview-image]');
      if(!pick&&(!image||current===card.dataset.projectId||view==='index'))return;
      e.preventDefault();e.stopPropagation();
      select(pick&&current===card.dataset.projectId?null:card.dataset.projectId);
      if(pick)pick.focus({preventScroll:true});
    },true);
    // Native image-dialog close restores focus to its thumbnail. An expanded
    // project is the same DOM node in either view, including inside the poker group.
    new MutationObserver(changes=>{
      if(changes.some(c=>c.attributeName==='data-library-filter'))sync();
      else if(changes.some(c=>[...c.addedNodes].some(n=>n.nodeType===1&&(n.matches('article[data-project-id]')||n.querySelector('article[data-project-id]')))))sync();
    }).observe(root,{attributes:true,attributeFilter:['data-library-filter'],childList:true,subtree:true});
    new MutationObserver(updateCards).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    const selectAnchor=()=>{
      const id=location.hash.startsWith('#project-')?location.hash.slice(9):null;
      if(id&&cards().some(c=>c.dataset.projectId===id))select(id);
    };
    if(saved.filter&&saved.filter!=='all'&&!location.hash.startsWith('#project-')){
      [...filters.querySelectorAll('[data-library-filter]')].find(b=>b.dataset.libraryFilter===saved.filter)?.click();
    }
    setView(view);sync();selectAnchor();window.addEventListener('hashchange',selectAnchor);
    const evalImg=root.querySelector('#project-eval .project-preview img');
    if(evalImg){
      // Keep the canonical image at its published URL. The existing archive is an older, labelled fallback.
      const local='/assets/work/showcase/eval-crop.jpg';
      const fallback=()=>{
        if(evalImg.getAttribute('src')===local)return;
        const link=evalImg.closest('[data-preview-image]');
        evalImg.addEventListener('load',()=>evalImg.closest('.project-preview')?.classList.remove('preview-image-failed'),{once:true});
        if(link){
          link.href='/assets/work/showcase/eval.jpg';
          link.dataset.previewCaption='Eval Lab · 早期界面存档';link.dataset.previewCaptionEn='Eval Lab · Earlier interface archive';
          const label=link.querySelector('span');if(label)wording(label,'查看早期界面','View archived interface');
          evalImg.alt=isEnglish()?link.dataset.previewCaptionEn:link.dataset.previewCaption;
        }
        evalImg.src=local;
      };
      evalImg.addEventListener('error',fallback,{once:true});
      if(evalImg.complete&&!evalImg.naturalWidth)fallback();
    }
    return true;
  }
  if(!install()){const wait=new MutationObserver(()=>{if(install())wait.disconnect();});wait.observe(section,{childList:true,subtree:true});}
}
