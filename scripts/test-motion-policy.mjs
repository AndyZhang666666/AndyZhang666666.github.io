import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Execute the real module without rewriting its policy or reaching into its maps.
// This empty DOM fixture covers policy inputs and public events, not rendering.
const source=fs.readFileSync(new URL('../assets/motion-governor.mjs',import.meta.url),'utf8')
 .replace(/\bexport\s+/g,'');
const preferenceKey='portfolio-motion-preference';

function browser({osReduced=false,storedPreference=null,storageUnavailable=false}={}){
 class MediaQueryList extends EventTarget{
  constructor(media,matches){super();this.media=media;this.matches=matches;}
  change(matches){
   this.matches=matches;
   this.dispatchEvent(Object.assign(new Event('change'),{matches,media:this.media}));
  }
 }
 class PolicyEvent extends Event{
  constructor(type,{detail}){super(type);this.detail=detail;}
 }
 class Observer{observe(){}disconnect(){}}
 const system=new MediaQueryList('(prefers-reduced-motion: reduce)',osReduced);
 const fine=new MediaQueryList('(hover: hover) and (pointer: fine)',false);
 const media=new Map([[system.media,system],[fine.media,fine]]);
 const root={dataset:{},style:{setProperty(){},removeProperty(){}}};
 const document=Object.assign(new EventTarget(),{
  documentElement:root,body:{},hidden:false,readyState:'loading',
  getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],getAnimations:()=>[],
 });
 const window=new EventTarget();
 const stored=new Map(storedPreference===null?[]:[[preferenceKey,storedPreference]]);
 const events=[];
 document.addEventListener('portfolio:motionchange',event=>{
  events.push(JSON.parse(JSON.stringify(event.detail)));
 });
 let nextFrame=0;
 const frames=new Map();
 const context=vm.createContext({
  document,window,
  matchMedia:query=>{
   assert.ok(media.has(query),`Unexpected media query: ${query}`);
   return media.get(query);
  },
  localStorage:{
   getItem:key=>{if(storageUnavailable)throw Error('Storage unavailable');return stored.get(key)??null;},
   setItem:(key,value)=>{if(storageUnavailable)throw Error('Storage unavailable');stored.set(key,value);},
  },
  CustomEvent:PolicyEvent,ResizeObserver:Observer,MutationObserver:Observer,
  requestAnimationFrame:callback=>{const id=++nextFrame;frames.set(id,callback);return id;},
  cancelAnimationFrame:id=>frames.delete(id),queueMicrotask,
 });
 vm.runInContext(source,context,{filename:'assets/motion-governor.mjs'});
 return {
  root,events,stored,
  getMotionPreference:()=>context.getMotionPreference(),
  isMotionReduced:()=>context.isMotionReduced(),
  setMotionPreference:value=>context.setMotionPreference(value),
  ready(){document.readyState='interactive';document.dispatchEvent(new Event('DOMContentLoaded'));},
  osChange:value=>system.change(value),
  visibilityChange(hidden){document.hidden=hidden;document.dispatchEvent(new Event('visibilitychange'));},
 };
}

function expectPolicy(page,{preference,reduced,motion,visible}){
 assert.equal(page.getMotionPreference(),preference);
 assert.equal(page.isMotionReduced(),reduced);
 assert.equal(page.root.dataset.motion,motion);
 assert.equal(page.root.dataset.pageVisible,String(visible));
 assert.deepEqual(page.events.at(-1),{preference,reduced,visible});
}
function expectNativeChange(page,input,expected){
 const before=page.events.length;
 input();
 assert.equal(page.events.length,before+1,'The registered native event must publish one policy update');
 expectPolicy(page,expected);
}

test('DOM ready mounts policy and live OS changes follow system preference',()=>{
 const page=browser();
 assert.equal(page.getMotionPreference(),'system');
 assert.equal(page.root.dataset.motion,'full');
 assert.equal(page.root.dataset.pageVisible,'true');
 assert.equal(page.events.length,0);
 page.ready();
 expectPolicy(page,{preference:'system',reduced:false,motion:'full',visible:true});
 expectNativeChange(page,()=>page.osChange(true),{preference:'system',reduced:true,motion:'reduce',visible:true});
 expectNativeChange(page,()=>page.osChange(false),{preference:'system',reduced:false,motion:'full',visible:true});
});

test('manual reduce survives OS changes and returning to system restores live OS control',()=>{
 const page=browser();page.ready();
 page.setMotionPreference('reduce');
 expectPolicy(page,{preference:'reduce',reduced:true,motion:'reduce',visible:true});
 assert.equal(page.stored.get(preferenceKey),'reduce');
 expectNativeChange(page,()=>page.osChange(true),{preference:'reduce',reduced:true,motion:'reduce',visible:true});
 expectNativeChange(page,()=>page.osChange(false),{preference:'reduce',reduced:true,motion:'reduce',visible:true});
 page.setMotionPreference('system');
 expectPolicy(page,{preference:'system',reduced:false,motion:'full',visible:true});
 assert.equal(page.stored.get(preferenceKey),'system');
 expectNativeChange(page,()=>page.osChange(true),{preference:'system',reduced:true,motion:'reduce',visible:true});
 page.setMotionPreference('reduce');
 page.setMotionPreference('system');
 expectPolicy(page,{preference:'system',reduced:true,motion:'reduce',visible:true});
 expectNativeChange(page,()=>page.osChange(false),{preference:'system',reduced:false,motion:'full',visible:true});
});

test('native visibility events publish hidden and visible state without changing preference',()=>{
 const page=browser();page.ready();
 expectNativeChange(page,()=>page.visibilityChange(true),{preference:'system',reduced:false,motion:'full',visible:false});
 expectNativeChange(page,()=>page.osChange(true),{preference:'system',reduced:true,motion:'reduce',visible:false});
 expectNativeChange(page,()=>page.visibilityChange(false),{preference:'system',reduced:true,motion:'reduce',visible:true});
 expectNativeChange(page,()=>page.osChange(false),{preference:'system',reduced:false,motion:'full',visible:true});
});

test('saved manual reduction is restored through the normal DOM entry',()=>{
 const page=browser({storedPreference:'reduce'});page.ready();
 expectPolicy(page,{preference:'reduce',reduced:true,motion:'reduce',visible:true});
 page.setMotionPreference('system');
 expectPolicy(page,{preference:'system',reduced:false,motion:'full',visible:true});
});

test('unavailable localStorage does not disable public or native policy controls',()=>{
 const page=browser({storageUnavailable:true});page.ready();
 expectPolicy(page,{preference:'system',reduced:false,motion:'full',visible:true});
 assert.doesNotThrow(()=>page.setMotionPreference('reduce'));
 expectPolicy(page,{preference:'reduce',reduced:true,motion:'reduce',visible:true});
 expectNativeChange(page,()=>page.osChange(true),{preference:'reduce',reduced:true,motion:'reduce',visible:true});
 assert.doesNotThrow(()=>page.setMotionPreference('system'));
 expectPolicy(page,{preference:'system',reduced:true,motion:'reduce',visible:true});
 expectNativeChange(page,()=>page.osChange(false),{preference:'system',reduced:false,motion:'full',visible:true});
 expectNativeChange(page,()=>page.visibilityChange(true),{preference:'system',reduced:false,motion:'full',visible:false});
 expectNativeChange(page,()=>page.visibilityChange(false),{preference:'system',reduced:false,motion:'full',visible:true});
});
