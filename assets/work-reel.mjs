const reduced = () => document.documentElement.dataset.motion==='reduce' || matchMedia('(prefers-reduced-motion: reduce)').matches;

export function prepareReel(root){
  if(!root) return null;
  const track=root.querySelector('.reel-track');
  const frames=[...track.querySelectorAll('figure')], nav=root.querySelector('.reel-nav');
  if(root.reel) return root.reel;
  const english=()=>document.documentElement.lang.startsWith('en');
  for(const frame of frames){
    const image=frame.querySelector('img');
    image.addEventListener('error',()=>{
      if(image.dataset.fallback){
        image.src=image.dataset.fallback;delete image.dataset.fallback;
        for(const link of frame.querySelectorAll('[data-enlarge]'))link.href='/assets/work/showcase/eval.jpg';
        const caption=frame.querySelector('figcaption [data-zh]');
        caption.dataset.zh='Eval Lab · 较早的公开界面';caption.dataset.en='Eval Lab · Earlier public interface';
        caption.textContent=english()?caption.dataset.en:caption.dataset.zh;
        image.alt=caption.textContent; image.dataset.altZh=caption.dataset.zh;image.dataset.altEn=caption.dataset.en;
        return;
      }
      image.hidden=true;
      const note=document.createElement('p');
      note.dataset.zh='这张样图暂未载入，仍可打开作品或阅读方法。';note.dataset.en='Image unavailable. You can still open the work or read its method.';
      note.textContent=english()?note.dataset.en:note.dataset.zh;
      frame.querySelector('a').replaceWith(note);
      frame.querySelector('.frame-enlarge').hidden=true;
    });
    image.src=image.dataset.src;
  }
  let current=0,drag=null,ignoreClick=false,pendingFrame=0;
  const position=i=>frames[i].offsetLeft-frames[0].offsetLeft;
  function sync(){
    pendingFrame=0;
    if(!track.clientWidth||!nav)return;
    const left=track.scrollLeft, end=track.scrollWidth-track.clientWidth;
    current=left>=end-2?frames.length-1:frames.reduce((best,_,i)=>Math.abs(position(i)-left)<Math.abs(position(best)-left)?i:best,0);
    nav.querySelector('output').value=(current+1)+' / '+frames.length;
    nav.querySelector('[data-step="-1"]').disabled=current===0;
    nav.querySelector('[data-step="1"]').disabled=current===frames.length-1;
  }
  function go(index,instant=false){
    if(!Number.isInteger(index)||index<0||index>=frames.length)return;
    track.scrollTo({left:position(index),behavior:instant||reduced()?'instant':'smooth'});
    if(instant||reduced())sync();
  }
  if(nav){
    nav.hidden=false;sync();
    nav.addEventListener('click',ev=>{const step=ev.target.closest('[data-step]');if(step)go(current+Number(step.dataset.step));});
    track.addEventListener('scroll',()=>{if(!pendingFrame)pendingFrame=requestAnimationFrame(sync);},{passive:true});
    new ResizeObserver(sync).observe(track);
    track.addEventListener('keydown',ev=>{
      const keys={ArrowLeft:current-1,ArrowRight:current+1,Home:0,End:frames.length-1};
      if(ev.key in keys){ev.preventDefault();go(keys[ev.key]);}
    });
    track.addEventListener('dragstart',ev=>ev.preventDefault());
    track.addEventListener('pointerdown',ev=>{
      if(ev.pointerType!=='mouse'||ev.button!==0||ev.target.closest('.frame-enlarge'))return;
      drag={id:ev.pointerId,x:ev.clientX,left:track.scrollLeft,moved:false};
    });
    track.addEventListener('pointermove',ev=>{
      if(!drag||drag.id!==ev.pointerId||!ev.buttons)return;
      const distance=ev.clientX-drag.x;
      if(Math.abs(distance)<6&&!drag.moved)return;
      if(!drag.moved){drag.moved=true;track.setPointerCapture(ev.pointerId);track.classList.add('is-dragging');}
      ev.preventDefault();track.scrollLeft=drag.left-distance;
    });
    function finish(ev){
      if(!drag||drag.id!==ev.pointerId)return;
      const last=drag;drag=null;
      if(!last.moved)return;
      const shift=track.scrollLeft-last.left;
      sync();const start=frames.reduce((best,_,i)=>Math.abs(Math.min(position(i),track.scrollWidth-track.clientWidth)-last.left)<Math.abs(Math.min(position(best),track.scrollWidth-track.clientWidth)-last.left)?i:best,0);
      track.classList.remove('is-dragging');
      ignoreClick=true;setTimeout(()=>{ignoreClick=false;},250);
      go(Math.max(0,Math.min(frames.length-1,Math.abs(shift)>32&&current===start?start+Math.sign(shift):current)));
    }
    track.addEventListener('pointerup',finish);
    track.addEventListener('pointercancel',finish);
    track.addEventListener('click',ev=>{if(ignoreClick){ev.preventDefault();ev.stopPropagation();}},{capture:true});
  }
  root.reel={go,get index(){return current;},frames};
  return root.reel;
}
