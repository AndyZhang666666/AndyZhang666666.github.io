import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
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
 assert.ok(menu.includes('value="system"')&&menu.includes('value="reduce"'));
 assert.equal(enhanceMobileNavigation(html),html);
 for(const dir of fs.readdirSync('cases')){
  const file=`cases/${dir}/index.html`;if(!fs.existsSync(file))continue;
  const source=read(file);assert.equal((source.match(/id="paletteSwitch"/g)||[]).length,1,file);
  assert.ok(source.includes('href="/#uses"'),file);
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
