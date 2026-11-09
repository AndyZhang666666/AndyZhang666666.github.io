import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {enhanceHeroV2} from '../content/hero-v2.mjs';
import {enhanceMobileNavigation} from '../content/mobile-navigation.mjs';
import {enhancePortfolioV2} from '../content/portfolio-v2.mjs';
import {patchMotionV2} from '../content/motion-v2.mjs';

const read=p=>fs.readFileSync(p,'utf8');
const before=p=>execFileSync('git',['show',`4ec678e8a96044b3f903424209c894511c984eaa:${p}`],{encoding:'utf8'});
const hero=html=>html.match(/<section id="top"[^]*?<\/section>/)[0];
test('Hero decoration preserves every supplied bilingual string, image and destination',()=>{
 const old=before('index.html'),next=enhanceHeroV2(old);
 const facts=html=>[...hero(html).matchAll(/(?:data-zh|data-en|src|href)="[^"]*"/g)].map(x=>x[0]);
 assert.deepEqual(facts(next),facts(old));
 assert.equal(enhanceHeroV2(next),next);
 assert.equal((hero(next).match(/data-hero-paper="front"/g)||[]).length,1);
 assert.equal((hero(next).match(/data-hero-paper="back"/g)||[]).length,1);
});
test('mobile directory has valid destinations and keeps the existing controls unique',()=>{
 const html=read('index.html');
 assert.equal(enhancePortfolioV2(html),html);
 for(const id of ['mobileDirectory','directoryToggle','paletteSwitch','presentationToggle','langToggle'])assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1,id);
 const menu=html.match(/<dialog id="mobileDirectory"[^]*?<\/dialog>/)[0];
 for(const [,id] of menu.matchAll(/href="#([^"]+)"/g))assert.ok(html.includes(`id="${id}"`),`Broken section link: ${id}`);
 for(const [,id] of html.matchAll(/<section\b[^>]*id="([^"]+)"/g))assert.ok(menu.includes(`href="#${id}"`),`Directory omitted section: ${id}`);
 assert.ok(menu.includes('value="system"')&&menu.includes('value="reduce"'));
 assert.equal(enhanceMobileNavigation(html),html);
 for(const dir of fs.readdirSync('cases')){
  const file=`cases/${dir}/index.html`;if(!fs.existsSync(file))continue;
  const source=read(file);assert.equal((source.match(/id="paletteSwitch"/g)||[]).length,1,file);
  assert.ok(source.includes('href="/#uses"'),file);
 }
});
test('generated case HTML preserves executable scripts, palette and native directory',()=>{
 const inspect=`
import json, sys
from html.parser import HTMLParser
class Inspector(HTMLParser):
 def __init__(self):
  super().__init__()
  self.elements=[]
 def handle_starttag(self, tag, attributes):
  self.elements.append(dict(tag=tag, attributes=dict(attributes)))
parser=Inspector()
parser.feed(sys.stdin.read())
print(json.dumps(parser.elements))
`;
 for(const dir of fs.readdirSync('cases')){
  const file=`cases/${dir}/index.html`;if(!fs.existsSync(file))continue;
  const elements=JSON.parse(execFileSync('python3',['-c',inspect],{input:read(file),encoding:'utf8'}));
  const byId=id=>elements.filter(element=>element.attributes.id===id);
  const scripts=elements.filter(element=>element.tag==='script').map(element=>element.attributes.src).filter(Boolean);
  assert.ok(scripts.includes('/scripts/case-reader.js?v=20261109-v2'),`${file}: case reader script is not executable`);
  assert.ok(scripts.includes('/assets/mobile-navigation.mjs?v=20261109-v2'),`${file}: mobile navigation script is not executable`);
  assert.equal(byId('paletteSwitch').length,1,`${file}: palette is missing or duplicated`);
  assert.equal(byId('paletteSwitch')[0].tag,'div',`${file}: palette markup was consumed by another tag`);
  assert.equal(byId('mobileDirectory').length,1,`${file}: native directory is missing or duplicated`);
  assert.equal(byId('mobileDirectory')[0].tag,'dialog',`${file}: native directory is not a dialog`);
  assert.equal(elements.filter(element=>element.tag==='button'&&element.attributes.class?.split(/\s+/).includes('ps-btn')).length,4,`${file}: four theme controls must remain available`);
 }
});
test('motion migration is idempotent and leaves all non-owner app code unchanged',()=>{
 const original=before('app.js'),patched=patchMotionV2(original);
 assert.equal(patchMotionV2(patched),patched);
 for(const fn of ['initCountUp','initNavState','initScrollProgress','initSpotlight','initCardTilt','initHeroFade','initMagnetic'])assert.ok(!patched.includes(`function ${fn}()`));
 assert.ok(!patched.includes("document.querySelectorAll('a[href^=\"#\"]').forEach(a =>"));
 assert.ok(!read('motion.js').includes("querySelectorAll('a[href^="));
 assert.ok(!read('railnav.js').includes('preventDefault'));
});
test('case theme controls bind after the parser reaches the injected palette',()=>{
 for(const state of ['loading','complete']){
  const listeners=new Map(),stored=new Map([['palette','frost']]);
  let parsed=state==='complete',ready;
  const buttons=['frost','copper','mist','indigo'].map(id=>({dataset:{palette:id},attributes:{},active:false,setAttribute(k,v){this.attributes[k]=v},classList:{toggle(_name,value){buttons.find(button=>button.classList===this).active=value;}}}));
  const palette={querySelectorAll:()=>buttons,addEventListener:(name,callback)=>listeners.set(name,callback)};
  const language={addEventListener:()=>{}};
  const doc={readyState:state,documentElement:{dataset:{palette:'frost'}},getElementById:id=>id==='langToggle'?language:id==='paletteSwitch'&&parsed?palette:null,addEventListener:(name,callback)=>{assert.equal(name,'DOMContentLoaded');ready=callback;}};
  vm.runInNewContext(read('scripts/case-reader.js'),{document:doc,localStorage:{getItem:key=>stored.get(key),setItem:(key,value)=>stored.set(key,value)}});
  if(state==='loading'){assert.ok(!listeners.has('click'));parsed=true;ready();}
  assert.ok(listeners.has('click'),'Palette never received its listener');
  listeners.get('click')({target:{closest:()=>buttons[1]}});
  assert.equal(doc.documentElement.dataset.palette,'copper');assert.equal(stored.get('palette'),'copper');
  assert.deepEqual(buttons.map(button=>button.attributes['aria-pressed']),['false','true','false','false']);
  assert.deepEqual(buttons.map(button=>button.active),[false,true,false,false]);
 }
});
