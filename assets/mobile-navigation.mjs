import {getMotionPreference,setMotionPreference} from './motion-governor.mjs?v=20261109-v2';

const trigger=document.getElementById('directoryToggle');
const dialog=document.getElementById('mobileDirectory');
const palette=document.getElementById('paletteSwitch');
const slot=dialog?.querySelector('[data-directory-palette]');
const media=matchMedia('(max-width: 820px)');
const marker=document.createComment('desktop theme position');
const selection=dialog?.querySelector('[data-motion-preference]');
const language=()=>document.documentElement.lang.startsWith('en')?'en':'zh';
// Native dialog supplies modal focus containment and Escape dismissal.
if(trigger&&dialog&&typeof dialog.showModal==='function'){
 let restoreTarget=trigger;
 if(palette)palette.before(marker);
 function close(restore=true){
  if(!dialog.open)return;
  restoreTarget=restore?(media.matches?trigger:document.getElementById('langToggle')):null;
  dialog.close();
 }
 function sync(){
  if(media.matches){
   if(palette&&slot)slot.append(palette);
  }else{
   close();
   if(palette&&marker.isConnected)marker.after(palette);
  }
 }
 function translate(){
  const lang=language();
  dialog.querySelectorAll('[data-zh][data-en]').forEach(el=>{el.textContent=el.dataset[lang];});
  dialog.querySelectorAll('[data-label-zh]').forEach(el=>el.setAttribute('aria-label',el.dataset[lang==='en'?'labelEn':'labelZh']));
  const label=trigger.querySelector('span[data-zh]');if(label)label.textContent=label.dataset[lang];
 }
 trigger.addEventListener('click',()=>{
  if(!media.matches)return;
  restoreTarget=trigger;translate();
  if(selection)selection.value=getMotionPreference();
  dialog.showModal();trigger.setAttribute('aria-expanded','true');
  document.documentElement.dataset.directoryOpen='true';
 });
 dialog.querySelector('[data-directory-close]').addEventListener('click',()=>close());
 dialog.addEventListener('close',()=>{
  trigger.setAttribute('aria-expanded','false');
  delete document.documentElement.dataset.directoryOpen;
  if(restoreTarget?.isConnected)restoreTarget.focus({preventScroll:true});
 });
 dialog.addEventListener('click',event=>{
  if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();}
 });
 dialog.querySelectorAll('.directory-links a').forEach(link=>link.addEventListener('click',()=>close()));
 dialog.querySelector('[data-directory-present]')?.addEventListener('click',()=>{
  // Close before the original module captures its return focus and scroll.
  close(false);trigger.focus({preventScroll:true});
  document.getElementById('presentationToggle')?.click();
 });
 selection?.addEventListener('change',()=>setMotionPreference(selection.value));
 document.addEventListener('portfolio:motionchange',()=>{if(selection)selection.value=getMotionPreference();});
 media.addEventListener('change',sync);
 new MutationObserver(translate).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 sync();translate();
 trigger.hidden=false;
 document.documentElement.dataset.directoryReady='true';
}
