import {isMotionReduced} from './motion-governor.mjs?v=20261109-v2';

export function citationLine(panel) {
  const desk=panel.querySelector('.preview-eval'),source=desk.querySelector('[data-eval-citation]');
  const target=desk.querySelector('[data-eval-full-quote]'),ink=desk.querySelector('.proof-connector path');
  function draw() {
    if(!desk.hasAttribute('data-joined')||panel.hidden)return;
    const parent=desk.getBoundingClientRect(),a=source.getBoundingClientRect(),b=target.getBoundingClientRect();
    const stacked=b.left<a.right-8;
    const x1=(stacked?a.left+12:a.right)-parent.left, y1=(stacked?a.bottom:a.top+a.height/2)-parent.top;
    const x2=b.left-parent.left, y2=b.top-parent.top+b.height/2;
    const gutter=stacked?10:(x1+x2)/2;
    ink.setAttribute('d','M'+x1+' '+y1+' H'+gutter+' V'+y2+' H'+x2);
  }
  new ResizeObserver(draw).observe(desk);
  desk.addEventListener('toggle',()=>requestAnimationFrame(draw),true);
  return active=>{
    desk.toggleAttribute('data-joined',active);
    if(active)desk.querySelector('.preview-full-source').open=true;
    requestAnimationFrame(draw);
  };
}

export function changePoster(canvas,svg) {
  const parts = root => [...root.querySelectorAll('svg text,svg image')];
  const key=el=>el.tagName.toLowerCase()==='image'?'image':el.textContent.trim();
  const old=new Map(parts(canvas).map(el=>[key(el),el.getBoundingClientRect()]));
  canvas.innerHTML=svg;
  if(isMotionReduced()||document.hidden)return;
  for(const el of parts(canvas)){
    const prior=old.get(key(el)),now=el.getBoundingClientRect();
    if(!prior||!now.width||!now.height)continue;
    const m=el.getScreenCTM();if(!m)continue;
    const p=new DOMPoint(prior.x-now.x,prior.y-now.y,0,0).matrixTransform(m.inverse());
    el.animate([{translate:p.x+'px '+p.y+'px',opacity:.62},{translate:'0px 0px',opacity:1}],{duration:430,easing:'cubic-bezier(.2,.78,.2,1)'});
  }
}
