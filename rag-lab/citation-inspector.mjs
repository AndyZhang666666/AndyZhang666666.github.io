import {computePosition,autoUpdate,offset,flip,shift} from './vendor/floating-ui.mjs?v=20261112-craft1';

// UI-only inspector. The caller supplies only evidence allowed in the current run.
let active=null,sequence=0;
export function closeCitation({restoreFocus=false}={}) {
  sequence++;
  if(!active)return;
  const {dialog,trigger,cleanup,abort,scroll}=active;
  active=null;
  cleanup?.();abort.abort();
  // Clear synchronously: an exit effect must never retain revoked evidence.
  dialog.replaceChildren();dialog.close();dialog.remove();
  trigger?.removeAttribute('aria-expanded');
  if(restoreFocus&&trigger?.isConnected){trigger.focus({preventScroll:true});window.scrollTo({top:scroll,behavior:'instant'});}
}

export function openCitation({trigger,title,metadata,quote,detailTarget,detailLabel='查看完整来源卡'}) {
  if(active?.trigger===trigger){closeCitation({restoreFocus:true});return;}
  closeCitation();
  const id=++sequence,dialog=document.createElement('dialog'),abort=new AbortController();
  const mobile=matchMedia('(max-width:767px)').matches;
  dialog.className='citation-inspector';dialog.id='citation-inspector';
  dialog.setAttribute('aria-labelledby','citation-inspector-title');
  const heading=document.createElement('h2');heading.id='citation-inspector-title';heading.textContent=title;
  const meta=document.createElement('p');meta.className='source-meta';meta.textContent=metadata;
  const body=document.createElement('blockquote');body.textContent=quote;
  const actions=document.createElement('div');actions.className='inspector-actions';
  const back=document.createElement('button');back.type='button';back.textContent=mobile?'返回这条引用':'关闭引用';
  const full=document.createElement('button');full.type='button';full.textContent=detailLabel;
  actions.append(back,full);dialog.append(heading,meta,body,actions);document.body.append(dialog);
  active={dialog,trigger,abort,scroll:scrollY,cleanup:null};
  trigger.setAttribute('aria-expanded','true');trigger.setAttribute('aria-controls',dialog.id);
  if(mobile)dialog.showModal();else dialog.show();
  back.onclick=()=>closeCitation({restoreFocus:true});
  full.onclick=()=>{closeCitation();if(detailTarget?.isConnected){detailTarget.focus({preventScroll:true});detailTarget.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});}};
  dialog.addEventListener('cancel',event=>{event.preventDefault();closeCitation({restoreFocus:true});},{signal:abort.signal});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();closeCitation({restoreFocus:true});}},{signal:abort.signal});
  document.addEventListener('pointerdown',event=>{if(!dialog.contains(event.target)&&!trigger.contains(event.target))closeCitation();},{signal:abort.signal});
  const mq=matchMedia('(max-width:767px)');mq.addEventListener('change',()=>closeCitation({restoreFocus:true}),{signal:abort.signal});
  if(!mobile){
    const update=()=>computePosition(trigger,dialog,{strategy:'fixed',placement:'bottom-start',middleware:[offset(10),flip(),shift({padding:16})]}).then(({x,y})=>{if(active?.dialog===dialog&&sequence===id)Object.assign(dialog.style,{left:`${x}px`,top:`${y}px`});});
    active.cleanup=autoUpdate(trigger,dialog,update);
  }
  back.focus({preventScroll:true});
}
