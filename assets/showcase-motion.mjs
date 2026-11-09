// Material follows selection and native scrolling. No scroll hijack, autoplay or application state.
import {isMotionReduced} from './motion-governor.mjs?v=20261109-v2';
export function createShowcaseMotion(root){
 const choices=root.querySelector('.showcase-choices'),stage=root.querySelector('.showcase-stage');
 const desktop=matchMedia('(min-width:901px) and (hover:hover)');
 const clamp=(v,max=1)=>Math.max(-max,Math.min(max,v));
 let frame=0,inView=false,pointer={x:0,y:0},entry,disposed=false;
 function update(){
  frame=0;if(disposed||document.hidden)return;
  const selected=choices.querySelector('[aria-selected=true]');
  const marker=selected?{x:selected.offsetLeft,y:selected.offsetTop,w:selected.offsetWidth,h:selected.offsetHeight}:null;
  const r=inView&&!isMotionReduced()?root.getBoundingClientRect():null,small=innerWidth<=900;
  const progress=r?clamp((innerHeight*.5-r.top-r.height*.5)/innerHeight):0;
  if(marker){
   choices.style.setProperty('--pick-x',marker.x+'px');
   choices.style.setProperty('--pick-y',marker.y+'px');
   choices.style.setProperty('--pick-w',marker.w+'px');
   choices.style.setProperty('--pick-h',marker.h+'px');
   root.classList.add('showcase-material-ready');
  }
  root.style.setProperty('--material-stage-y',(progress*(small?3:10)).toFixed(2)+'px');
  root.style.setProperty('--material-choices-y',(-progress*(small?1.5:6)).toFixed(2)+'px');
  root.style.setProperty('--material-heading-y',(-progress*(small?0:4)).toFixed(2)+'px');
  const tilt=isMotionReduced()||!desktop.matches||!inView?{x:0,y:0}:pointer;
  stage.style.setProperty('--material-rotate-x',(-tilt.y*.8).toFixed(2)+'deg');
  stage.style.setProperty('--material-rotate-y',(tilt.x*.8).toFixed(2)+'deg');
  stage.style.setProperty('--material-light-x',(50+tilt.x*35).toFixed(1)+'%');
  stage.style.setProperty('--material-light-y',(35+tilt.y*25).toFixed(1)+'%');
 }
 function schedule(){if(!frame&&!disposed&&!document.hidden)frame=requestAnimationFrame(update);}
 function scroll(){if(inView&&!isMotionReduced())schedule();}
 function move(event){
  if(!inView||document.hidden||isMotionReduced()||!desktop.matches||event.pointerType!=='mouse')return;
  const r=stage.getBoundingClientRect();pointer={x:clamp((event.clientX-r.left)/r.width*2-1),y:clamp((event.clientY-r.top)/r.height*2-1)};
  stage.classList.add('has-material-pointer');schedule();
 }
 function leave(){pointer={x:0,y:0};stage.classList.remove('has-material-pointer');schedule();}
 function change(){
  entry?.cancel();cancelAnimationFrame(frame);frame=0;
  if(isMotionReduced()||document.hidden)root.getAnimations?.({subtree:true}).forEach(animation=>animation.cancel());
  pointer={x:0,y:0};stage.classList.remove('has-material-pointer');
  for(const property of ['--material-stage-y','--material-choices-y','--material-heading-y'])root.style.setProperty(property,'0px');
  for(const property of ['--material-rotate-x','--material-rotate-y'])stage.style.setProperty(property,'0deg');
  stage.style.setProperty('--material-light-x','50%');stage.style.setProperty('--material-light-y','35%');
  schedule();
 }
 function press(event){
  if(document.hidden||isMotionReduced()||event.type==='pointerdown'&&event.button!==0)return;
  if(event.type==='keydown'&&!['Enter',' '].includes(event.key))return;
  const control=event.target.closest('a,button,select');
  if(!control||control.disabled||control.tagName==='SELECT'||control.matches('[data-motion-magnetic]')||!control.animate)return;
  control.animate([{scale:'1'},{scale:'.975',offset:.25},{scale:'1.006',offset:.76},{scale:'1'}],{duration:300,easing:'cubic-bezier(.22,1,.36,1)'});
 }
 const resize=new ResizeObserver(schedule);resize.observe(choices);
 const visibility=new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;root.classList.toggle('showcase-material-visible',inView);if(inView)schedule();else change();},{threshold:0});visibility.observe(stage);
 window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',schedule,{passive:true});
 stage.addEventListener('pointermove',move,{passive:true});stage.addEventListener('pointerleave',leave);
 root.addEventListener('pointerdown',press,{passive:true});root.addEventListener('keydown',press);
 document.addEventListener('portfolio:motionchange',change);desktop.addEventListener('change',change);
 document.fonts?.ready.then(schedule);schedule();
 return {
  sync:schedule,
  enter(panel,previousId){
   entry?.cancel();schedule();if(document.hidden||isMotionReduced()||!panel.animate)return;
   const ordered=[...choices.querySelectorAll('[data-selected-id]')],before=ordered.findIndex(t=>t.dataset.selectedId===previousId),next=ordered.findIndex(t=>t.dataset.selectedId===panel.dataset.preview);
   const direction=before>next?-1:1;
   entry=panel.animate([{opacity:.55,transform:`translate3d(${direction*12}px,4px,0)`,filter:'blur(2px)'},{opacity:1,transform:'none',filter:'blur(0px)'}],{duration:300,easing:'cubic-bezier(.16,1,.3,1)'});
  },
  destroy(){disposed=true;cancelAnimationFrame(frame);entry?.cancel();resize.disconnect();visibility.disconnect();window.removeEventListener('scroll',scroll);window.removeEventListener('resize',schedule);stage.removeEventListener('pointermove',move);stage.removeEventListener('pointerleave',leave);root.removeEventListener('pointerdown',press);root.removeEventListener('keydown',press);document.removeEventListener('portfolio:motionchange',change);desktop.removeEventListener('change',change);}
 };
}
