import {t} from '../studio/ui.mjs';
import {orderBook} from './research-book.mjs';
import {motionStudy} from './research-motion.mjs';
export {depthAt,poseAt} from './research-model.mjs';

function mountInstrument(fig) {
  const tags=fig.parentElement.querySelector('.thesis-tags');
  if(tags && tags.nextElementSibling!==fig)tags.after(fig);
  const wearable=fig.id==='thesis-wearable';
  const instrument=wearable?motionStudy(fig):orderBook(fig);
  const panel=document.createElement('div');
  panel.className='instrument rp-controls';
  panel.innerHTML='<div class="rp-command"><strong class="instrument-title"></strong><div class="rp-modes"></div></div>'+
    '<div class="rp-timeline"><button type="button" class="rp-play" data-act="play"></button>'+
    '<div class="rp-track"><button type="button" data-act="prev">−</button><input data-act="range" type="range" min="0" step="1" value="0"><button type="button" data-act="next">+</button></div>'+
    '<span class="rp-amount"></span><button type="button" class="rp-reset" data-act="reset"></button></div><output aria-live="polite"></output>';
  fig.append(panel);
  const $=s=>panel.querySelector(s),slider=$('input'),play=$('[data-act=play]'),out=$('output');
  let value=0,animation=0;
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const still=()=>motion.matches || document.documentElement.dataset.motion==='reduce' || fig.closest('.edu-extra')?.querySelector('.research-motion-toggle')?.getAttribute('aria-pressed')==='true';
  const buttonName=()=>animation?t('暂停','Pause'):still()?(wearable?t('到末帧','Go to last frame'):t('查看撤单','Apply example')):instrument.playLabel;
  function updateButtons(){
    play.textContent=buttonName();
    play.dataset.playing=String(!!animation);
    out.setAttribute('aria-live',animation?'off':'polite');
  }
  function render(){
    const description=instrument.set(value);
    slider.max=String(instrument.max);slider.value=String(value);slider.setAttribute('aria-label',instrument.label);
    slider.setAttribute('aria-valuetext',instrument.valueLabel);
    slider.style.setProperty('--fill',100*value/instrument.max+'%');
    $('.rp-amount').textContent=instrument.valueLabel;
    $('[data-act=prev]').disabled=value===0;$('[data-act=next]').disabled=value===instrument.max;
    if(out.textContent!==description)out.textContent=description;
    updateButtons();
  }
  function stop(){
    if(animation)cancelAnimationFrame(animation);
    animation=0;updateButtons();
  }
  function playOnce(){
    if(animation){stop();return;}
    const end=instrument.playTo;
    if(still()){value=end;render();return;}
    if(!wearable || value===end)value=0;
    const start=value, duration=wearable?(end-start)*315:1150;
    const began=performance.now();
    function tick(now){
      if(document.hidden || !fig.isConnected || !fig.classList.contains('art-running') || still()){stop();return;}
      const p=Math.min(1,(now-began)/duration);
      const next=start+Math.floor((end-start)*p);
      if(p===1){stop();value=end;render();return;}
      animation=requestAnimationFrame(tick);
      if(next!==value){value=next;render();}
    }
    animation=requestAnimationFrame(tick);render();
  }
  function translate(){
    $('.instrument-title').textContent=instrument.title;
    $('[data-act=reset]').textContent=t('复位','Reset');
    $('[data-act=prev]').setAttribute('aria-label',t('上一步','Previous step'));
    $('[data-act=next]').setAttribute('aria-label',t('下一步','Next step'));
    const containers=$('.rp-modes');
    instrument.groups().forEach((group,i)=>{
      let row=containers.children[i];
      if(!row){row=document.createElement('div');row.className='rp-group';row.setAttribute('role','group');containers.append(row);}
      const labels=wearable?[t('传感器','Sensor'),t('参考姿态','Reference pose')]:[t('撤单方向','Book side'),t('深度图类型','Chart mode')];
      row.setAttribute('aria-label',labels[i]);
      group.forEach(([key,label])=>{
        let btn=row.querySelector('[data-act="'+key+'"]');
        if(!btn){btn=document.createElement('button');btn.type='button';btn.dataset.act=key;row.append(btn);}
        btn.textContent=label;
      });
    });
    render();
  }
  panel.addEventListener('click',e=>{
    const button=e.target.closest('button');if(!button)return;
    const key=button.dataset.act;
    if(key==='play'){playOnce();return;}
    stop();
    if(key==='next')value=Math.min(instrument.max,value+1);
    else if(key==='prev')value=Math.max(0,value-1);
    else value=instrument.action(key);
    render();
  });
  slider.addEventListener('input',()=>{stop();value=Number(slider.value);render();});
  const pauseIfNeeded=()=>{
    if(document.hidden || !fig.classList.contains('art-running') || still())stop();
    else updateButtons();
  };
  const visibility=new MutationObserver(pauseIfNeeded);
  visibility.observe(fig,{attributeFilter:['class']});
  document.addEventListener('visibilitychange',pauseIfNeeded);
  document.addEventListener('portfolio:motionchange',pauseIfNeeded);
  const toggle=fig.closest('.edu-extra')?.querySelector('.research-motion-toggle');
  toggle?.addEventListener('click',pauseIfNeeded);
  motion.addEventListener('change',pauseIfNeeded);
  translate();
  return {translate,dispose(){
    stop();visibility.disconnect();
    document.removeEventListener('visibilitychange',pauseIfNeeded);
    document.removeEventListener('portfolio:motionchange',pauseIfNeeded);
    toggle?.removeEventListener('click',pauseIfNeeded);motion.removeEventListener('change',pauseIfNeeded);
  }};
}

export function setupResearch(){
  const section=document.getElementById('education');if(!section)return;
  const mounted=new Map();
  const targetId=location.hash.slice(1);
  let wantsAnchor=targetId==='thesis-order-flow'||targetId==='thesis-wearable';
  const navigation=new AbortController();
  const cancelAnchor=()=>{wantsAnchor=false;navigation.abort();};
  if(wantsAnchor){
    for(const event of ['wheel','touchstart','pointerdown','keydown','hashchange']){
      window.addEventListener(event,cancelAnchor,{passive:true,signal:navigation.signal});
    }
  }
  function scan(){
    for(const [fig,binding] of mounted){
      if(!fig.isConnected){binding.dispose();mounted.delete(fig);}
    }
    for(const fig of section.querySelectorAll('.research-plate')){
      if(!mounted.has(fig))mounted.set(fig,mountInstrument(fig));
    }
    const target=wantsAnchor&&document.getElementById(targetId);
    if(target){
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        if(!wantsAnchor || location.hash.slice(1)!==targetId)return;
        target.scrollIntoView({block:'start',behavior:'instant'});cancelAnchor();
      }));
    }
  }
  const hasFigure=n=>n.nodeType===1&&(n.matches('.research-plate') || n.querySelector('.research-plate'));
  new MutationObserver(changes=>{
    if(changes.some(c=>Array.from(c.addedNodes).some(hasFigure) || Array.from(c.removedNodes).some(hasFigure)))scan();
  }).observe(section,{childList:true,subtree:true});
  new MutationObserver(()=>mounted.forEach(binding=>binding.translate())).observe(document.documentElement,{attributeFilter:['lang']});
  scan();
}
