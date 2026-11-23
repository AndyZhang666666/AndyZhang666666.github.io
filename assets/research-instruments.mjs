import {t} from '../studio/ui.mjs';
const positions=[0,24,52,72,72,72,49,25,0];
export function depthAt(withdraw){
 if(!Number.isInteger(withdraw)||withdraw<0||withdraw>=38)throw Error('Active bid must remain positive');
 const bid=38-withdraw,ask=71;
 return {bid,ask,spread:.25,bidPrice:5000,askPrice:5000.25,imbalance:(bid-ask)/(bid+ask)};
}
export function poseAt(step){
 if(!Number.isInteger(step)||step<0||step>=positions.length)throw Error('Unknown frame');
 const arm=positions[step],back=[0,2,4,6,6,5,3,1,0][step];
 return {arm,back,phase:step===0?'rest':step<3?'raise':step<6?'hold':step<8?'lower':'rest'};
}
export function setupResearch(){
 const container=document.querySelector('#education');if(!container)return;
 function attach(fig){
  if(fig.querySelector('.instrument'))return;
  const wear=fig.id==='thesis-wearable',max=wear?8:37;
  const panel=document.createElement('div');panel.className='instrument';fig.append(panel);
  let value=0,sensor='arm';
  function draw(restore=''){
   const x=wear?poseAt(value):depthAt(value);
   const phases={rest:t('静止','Rest'),raise:t('抬起','Raise'),hold:t('保持','Hold'),lower:t('放下','Lower')};
   const label=wear?t('动作时间轴','Movement timeline'):t('撤掉买一挂单数量','Withdraw units at best bid');
   panel.innerHTML='<div class="instrument-title"><strong>'+label+'</strong><small>'+t('教学示意数据','Illustrative data')+'</small></div><div class="instrument-track"><button data-act="prev" '+(!value?'disabled':'')+' aria-label="'+t('上一步','Previous step')+'">−</button><input data-act="range" type="range" min="0" max="'+max+'" step="1" value="'+value+'" aria-label="'+label+'"><button data-act="next" '+(value===max?'disabled':'')+' aria-label="'+t('下一步','Next step')+'">+</button><button data-act="reset">'+t('复位','Reset')+'</button></div>'+
   (wear?'<div class="sensors">'+[['arm',t('上臂','Upper arm')],['back',t('上背','Upper back')]].map(([key,name])=>'<button data-act="'+key+'" aria-pressed="'+(key===sensor)+'">'+name+'</button>').join('')+'</div>':'')+
   '<output aria-live="polite">'+(wear?phases[x.phase]+' · '+(value+1)+'/9 · '+t('上臂','Arm')+' '+x.arm+'° / '+t('上背','Back')+' '+x.back+'°':t('买一','Bid')+' '+x.bidPrice.toFixed(2)+' × '+x.bid+'　'+t('卖一','Ask')+' '+x.askPrice.toFixed(2)+' × '+x.ask+'　'+t('价差','Spread')+' '+x.spread.toFixed(2)+'　'+t('盘口不平衡','Imbalance')+' '+(x.imbalance*100).toFixed(1)+'%')+'</output>';
   updateArt(x);
   const input=panel.querySelector('input');
   // Keep the range element alive during a drag. Updating the whole panel would lose pointer capture.
   input.oninput=()=>{value=Number(input.value);updateReading();};
   panel.querySelectorAll('button').forEach(b=>b.onclick=()=>{const key=b.dataset.act;
    if(key==='prev')value=Math.max(0,value-1);else if(key==='next')value=Math.min(max,value+1);else if(key==='reset'){value=0;sensor='arm';}else sensor=key;
    draw(key);
   });
   if(restore){const el=panel.querySelector('[data-act="'+restore+'"]:not(:disabled)')||input;el.focus({preventScroll:true});}
   function updateReading(){
    const current=wear?poseAt(value):depthAt(value);updateArt(current);
    input.setAttribute('aria-valuetext',wear?phases[current.phase]+' '+(value+1)+'/9':String(value));
    panel.querySelector('[data-act=prev]').disabled=!value;panel.querySelector('[data-act=next]').disabled=value===max;
    panel.querySelector('output').textContent=wear?phases[current.phase]+' · '+(value+1)+'/9 · '+t('上臂','Arm')+' '+current.arm+'° / '+t('上背','Back')+' '+current.back+'°':t('买一','Bid')+' 5000.00 × '+current.bid+'　'+t('卖一','Ask')+' 5000.25 × 71　'+t('价差','Spread')+' 0.25　'+t('盘口不平衡','Imbalance')+' '+(current.imbalance*100).toFixed(1)+'%';
   }
  }
  function updateArt(x){
   fig.toggleAttribute('data-manual',value!==0);
   if(!wear){const best=fig.querySelector('.plate-level .plate-bid');if(best){best.setAttribute('data-best','');best.setAttribute('d','M262 81h-'+x.bid);}return;}
   fig.querySelector('[data-study-arm]')?.setAttribute('transform','rotate('+(-x.arm)+' 192 134)');
   fig.querySelector('[data-phone-arm]')?.setAttribute('transform','rotate('+(-x.arm)+' 456 171)');
   const radians=-x.arm*Math.PI/180;
   const sx=(192+23*Math.cos(radians)-17*Math.sin(radians)).toFixed(1);
   const sy=(134+23*Math.sin(radians)+17*Math.cos(radians)).toFixed(1);
   const channels='M'+sx+' '+sy+'Q249 122 266 162M178 130Q219 211 266 192M345 171Q367 171 392 154M345 192Q368 198 392 196';
   for(const selector of ['.art-flow-guide','.art-packet'])fig.querySelector(selector)?.setAttribute('d',channels);
   const feedback=fig.querySelector('.art-phone .art-tiny');
   if(feedback)feedback.textContent={rest:t('静止','Rest'),raise:t('抬起','Raise'),hold:t('保持','Hold'),lower:t('下放','Lower')}[x.phase];
   fig.dataset.sensor=sensor;
   fig.querySelectorAll('[data-node]').forEach(n=>{n.setAttribute('r',n.dataset.node===sensor?'8':'4');n.classList.toggle('sensor-current',n.dataset.node===sensor);});
   const wave=(key,y)=>Array.from({length:9},(_,i)=>{const sample=poseAt(Math.max(0,value-8+i));return(i?'L':'M')+(269+i*8.5)+' '+(y-sample[key]*(key==='arm'?.21:1.35));}).join(' ');
   for(const sel of ['.art-wave-base','.art-wave-trace'])fig.querySelector(sel)?.setAttribute('d',wave('arm',173));
   fig.querySelector('[data-second-wave]')?.setAttribute('d',wave('back',198));
  }
  fig.querySelectorAll('[data-node]').forEach(n=>n.addEventListener('click',()=>{sensor=n.dataset.node;draw();}));
  draw();fig.addEventListener('studio:lang',()=>draw());
 }
 const scan=()=>container.querySelectorAll('#thesis-wearable,#thesis-order-flow').forEach(attach);
 scan();new MutationObserver(entries=>{if(entries.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('.research-figure,.edu-extra')||n.querySelector?.('.research-figure')))))scan();}).observe(container,{childList:true,subtree:true});
 new MutationObserver(()=>container.querySelectorAll('.research-figure').forEach(f=>f.dispatchEvent(new Event('studio:lang')))).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
}
