import {scrubFrames} from './research-tracing.mjs';
import {t} from '../studio/ui.mjs';
import {poseAt, lastFrame} from './research-model.mjs';

const phases = () => ({rest:t('静止','Rest'),raise:t('抬起','Raise'),hold:t('保持','Hold'),lower:t('放下','Lower')});
const number = n => (n>0?'+':'')+n+'°';
const xFor = i => 24 + i * 24;
const signalY = (key, v) => key==='arm' ? 45 - v * .40 : 89 - v * 3.65;

export function motionStudy(fig) {
  const $ = s => fig.querySelector(s);
  const read = $('.rp-readout');
  read.innerHTML = '<div class="rp-readout-top"><span data-r="channel"></span><strong data-r="angle"></strong></div>'+
    '<svg class="rp-trace" viewBox="0 0 247 106" aria-hidden="true"><g stroke="currentColor" opacity=".20" stroke-width=".65"><path d="M24 14h192 M24 45h192 M24 59h192 M24 89h192"/></g>'+
    '<g class="rp-wave-label"><text x="4" y="39">A</text><text x="4" y="84">B</text></g><path data-trace="arm"/><path data-trace="back"/><path data-cursor/><path data-pin-cursor/><circle data-signal-dot r="3.5"/></svg>'+
    '<div class="rp-device"><svg viewBox="0 0 58 65" aria-hidden="true"><rect x="8" y="3" width="41" height="58" rx="6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M24 7h9 M25 56h8" stroke="currentColor" stroke-linecap="round"/><circle cx="28" cy="18" r="3.5" fill="currentColor"/><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M28 23v13l-5 13 M28 36l5 13 M28 24l-6 9"/><g data-phone-arm><path d="M28 24l4 12" stroke="#ab4a3b"/></g></g></svg>'+
    '<div><small data-r="phone-label"></small><b data-r="phase"></b></div><span class="rp-frame-no" data-r="frame"></span></div><p class="rp-reference" data-r="comparison"></p>';
  for(const key of ['arm','back']){
    const samples=Array.from({length:lastFrame+1},(_,i)=>(i?'L':'M')+xFor(i)+' '+signalY(key,poseAt(i)[key]).toFixed(2)).join(' ');
    $('[data-trace="'+key+'"]').setAttribute('d',samples);
  }
  scrubFrames(fig,$('.rp-trace'),lastFrame);
  let frame=0,sensor='arm',pinned=null;
  function draw() {
    fig.dataset.studyFrame=String(frame+1);
    const p=poseAt(frame),a=p.arm*Math.PI/180,active=p[sensor],name=sensor==='arm'?t('上臂','Upper arm'):t('上背','Upper back');
    $('[data-study-arm]').setAttribute('transform','rotate('+(-p.arm)+')');
    $('[data-phone-arm]').setAttribute('transform','rotate('+(-p.arm)+' 28 24)');
    $('[data-body-trunk]').setAttribute('transform','rotate('+(-p.back)+' 217 98)');
    const leadX=217+9*Math.cos(a)+29*Math.sin(a),leadY=98-9*Math.sin(a)+29*Math.cos(a);
    $('[data-lead-arm]').setAttribute('d','M'+leadX.toFixed(2)+' '+leadY.toFixed(2)+' L327 57H378');
    $('[data-angle-arc]').setAttribute('d',p.arm?'M0 118 A118 118 0 0 0 '+(118*Math.sin(a)).toFixed(2)+' '+(118*Math.cos(a)).toFixed(2):'');
    fig.dataset.sensor=sensor;
    for(const inset of fig.querySelectorAll('[data-inset]'))inset.setAttribute('visibility',inset.dataset.inset===sensor?'visible':'hidden');
    $('[data-inset-label]').textContent=(sensor==='arm'?'IMU A':'IMU B')+' / '+t('佩戴示意','MOUNT');
    for(const key of ['arm','back']){
      $('[data-node="'+key+'"]').setAttribute('r',sensor===key?'8':'4');
      const b=$('[data-act="'+key+'"]');if(b)b.setAttribute('aria-pressed',String(sensor===key));
    }
    $('[data-r=channel]').textContent=name+t('传感器',' sensor')+' / '+(sensor==='arm'?'IMU A':'IMU B');
    $('[data-r=angle]').textContent=active+'°';
    $('[data-cursor]').setAttribute('d','M'+xFor(frame)+' 11V93');
    $('[data-signal-dot]').setAttribute('cx',xFor(frame));
    $('[data-signal-dot]').setAttribute('cy',signalY(sensor,active));
    const pin=pinned===null?null:poseAt(pinned),ghost=$('[data-ghost-arm]');
    ghost.setAttribute('visibility',pin?'visible':'hidden');
    if(pin)ghost.setAttribute('transform','rotate('+(-pin.arm)+')');
    $('[data-pin-cursor]').setAttribute('d',pin?'M'+xFor(pinned)+' 11V93':'');
    $('[data-r=phase]').textContent=phases()[p.phase];
    $('[data-r=phone-label]').textContent=t('手机反馈','Phone feedback');
    $('[data-r=frame]').textContent=String(frame+1).padStart(2,'0')+' / 09';
    $('[data-r=comparison]').textContent=pin?t('相对第 '+(pinned+1)+' 帧','Against frame '+(pinned+1))+'　'+name+' '+number(active-pin[sensor]):t('A 上臂 0–75°　 B 上背 0–8°','A · arm 0–75°   B · back 0–8°');
    const pinButton=$('[data-act=pin]');
    if(pinButton){pinButton.textContent=pin?t('清除定格','Clear reference'):t('定格对照','Pin this pose');pinButton.setAttribute('aria-pressed',String(!!pin));}
    return phases()[p.phase]+' · '+(frame+1)+'/9　'+t('上臂','Arm')+' '+p.arm+'°　'+t('上背','Back')+' '+p.back+'°';
  }
  fig.querySelectorAll('[data-node]').forEach(node=>node.addEventListener('click',()=>fig.querySelector('[data-act="'+node.dataset.node+'"]')?.click()));
  return {
    max:lastFrame,playTo:lastFrame,
    get title(){return t('动作时间轴','Movement timeline');},
    get label(){return t('动作帧','Movement frame');},
    get playLabel(){return t('播放动作','Play motion');},
    get valueLabel(){return (frame+1)+' / 9';},
    groups(){return [[['arm',t('上臂','Upper arm')],['back',t('上背','Upper back')]], [['pin',t('定格对照','Pin this pose')]]];},
    set(value){frame=value;return draw();},
    action(key){
      if(key==='arm'||key==='back')sensor=key;
      else if(key==='pin')pinned=pinned===null?frame:null;
      else if(key==='reset'){frame=0;sensor='arm';pinned=null;}
      return frame;
    }
  };
}
