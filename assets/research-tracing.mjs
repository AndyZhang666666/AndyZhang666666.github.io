import {t} from '../studio/ui.mjs';

const ns='http://www.w3.org/2000/svg';
function ink(tag,attributes,parent){
  const node=document.createElementNS(ns,tag);
  Object.entries(attributes).forEach(([name,value])=>node.setAttribute(name,value));
  parent.append(node);return node;
}
export function mountTracing(fig) {
  const graphic=fig.querySelector('.rp-illustration'),svg=graphic.querySelector('svg');
  const defs=ink('defs',{},svg),clip=ink('clipPath',{id:'plate-before-area'},defs);
  const window=ink('rect',{x:39,y:47,height:191,width:0},clip);
  const overlay=ink('g',{'class':'trace-before','aria-hidden':'true','clip-path':'url(#plate-before-area)'},svg);
  ink('rect',{x:39,y:47,width:467,height:191,'class':'trace-vellum'},overlay);
  const bid=ink('path',{'class':'trace-bid'},overlay),ask=ink('path',{'class':'trace-ask'},overlay);
  const grip=ink('g',{'class':'tracing-grip',role:'slider',tabindex:'0','aria-orientation':'horizontal','aria-valuemin':0,'aria-valuemax':100,'aria-labelledby':'foil-title'},svg);
  ink('rect',{x:-19,y:41,width:38,height:201,fill:'transparent'},grip);
  ink('path',{d:'M0 47V237','class':'trace-edge'},grip);
  ink('rect',{x:-10,y:99,width:20,height:33,rx:8,'class':'trace-thumb'},grip);
  ink('path',{d:'M-2 109v13m4-13v13','class':'trace-notches'},grip);
  const controls=document.createElement('div');controls.className='trace-controls';
  controls.innerHTML='<span id="foil-title"></span><span class="trace-values" aria-live="polite"></span>';
  graphic.append(controls);
  const out=controls.querySelector('.trace-values');
  let position=45;
  function place(value) {
    position=Math.max(0,Math.min(100,Math.round(value)));
    const width=467*position/100;
    window.setAttribute('width',String(width));grip.setAttribute('transform','translate('+(39+width)+' 0)');
    grip.setAttribute('aria-valuenow',String(position));grip.setAttribute('aria-valuetext',position+'%');
    fig.dataset.tracing=String(position);
  }
  grip.addEventListener('keydown',e=>{
    const changes={ArrowLeft:position-1,ArrowDown:position-1,ArrowRight:position+1,ArrowUp:position+1,PageDown:position-10,PageUp:position+10,Home:0,End:100};
    if(Object.hasOwn(changes,e.key)){e.preventDefault();place(changes[e.key]);}
  });
  function drag(e){const m=svg.getScreenCTM();if(!m)return;const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse());place((p.x-39)*100/467);}
  grip.addEventListener('pointerdown',e=>{e.stopPropagation();grip.setPointerCapture(e.pointerId);drag(e);});
  grip.addEventListener('pointermove',e=>{if(grip.hasPointerCapture(e.pointerId))drag(e);});
  grip.addEventListener('click',e=>e.stopPropagation());
  place(position);
  return {
    update(buyPath,sellPath,level,before,after){
      bid.setAttribute('d',buyPath);ask.setAttribute('d',sellPath);
      controls.querySelector('#foil-title').textContent=t('拉动描图纸 · 对照撤单前','Slide tracing paper · Before the cancellation');
      out.textContent=t('本档挂量 ','Lots at price ')+level.toFixed(2)+'　'+before+' → '+after+' '+t('手','lots');
    },
    reset(){place(45);}
  };
}

export function scrubFrames(fig,svg,lastFrame) {
  function scrub(e){
    const matrix=svg.getScreenCTM(),range=fig.querySelector('[data-act="range"]');
    if(!range||!matrix)return;
    const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());
    range.value=String(Math.max(0,Math.min(lastFrame,Math.round((p.x-24)/24))));
    range.dispatchEvent(new Event('input',{bubbles:true}));
  }
  svg.addEventListener('pointerdown',e=>{svg.setPointerCapture(e.pointerId);scrub(e);});
  svg.addEventListener('pointermove',e=>{if(svg.hasPointerCapture(e.pointerId))scrub(e);});
}
