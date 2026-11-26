import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {directoryPage,taskFor,topicFor} from '../content/work-directory.mjs';
import {directoryHome} from '../content/directory-home.mjs';
import {renderHomeIntro} from './compose-resumes.mjs';
import {sectionRange} from '../content/section-range.mjs';
import {renderSelected,selected} from '../content/showcase.mjs';
import {lookup} from '../assets/task-search.mjs';
import {inventory} from '../assets/work-inventory.mjs';
const data=JSON.parse(fs.readFileSync('data.json')),read=f=>fs.readFileSync(f,'utf8');
const home=read('index.html'),page=read('works/index.html');
const published=execFileSync('git',['show','c4d03be:index.html'],{encoding:'utf8'});
const old=sectionRange(published,'selected');
const expected=directoryHome(published.slice(0,old.start)+renderSelected(data)+published.slice(old.end),data.projects);
const originalPhoto='src="assets/gen/portrait-light.png" alt="" width="394" height="687"';
const printPortrait='src="assets/gen/portrait-cover.webp" alt="" width="688" height="1200"';
assert.ok(expected.includes(originalPhoto), 'Compare against the original cover photograph');
const reviewed=expected.replace(originalPhoto,printPortrait)
  .replace('href="assets/hero-paper.css?v=print1"','href="assets/hero-paper.css?v=print2"');
assert.equal(home,renderHomeIntro(reviewed,data.about),'All content outside the approved homepage edits stays pinned');
assert.equal(renderHomeIntro(home,data.about),home,'Regenerating the homepage introduction is idempotent');
const actions=home.match(/<div class="hero-cta reveal">([\s\S]*?)<\/div>/)[1];
assert.deepEqual([...actions.matchAll(/<a href="([^"]+)" class="([^"]+)"/g)].map(m=>m.slice(1)),[
  ['#jd','btn btn-primary'],['#selected','btn btn-ghost'],['https://github.com/AndyZhang666666','portfolio-git']
]);
const aboutCopy=home.match(/<div class="about-main">([\s\S]*?)<\/div>/)[1];
const escapeHTML=value=>value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const paragraphs=[...aboutCopy.matchAll(/<p class="([^"]+)" data-zh="([^"]+)" data-en="([^"]+)">([^<]+)<\/p>/g)];
assert.deepEqual(paragraphs.map(m=>m.slice(1)),['lead','body','body2','body3'].map(key=>{
  const zh=escapeHTML(data.about[key]);
  return [key==='lead'?'about-lead':'about-body',zh,escapeHTML(data.about[key+'En']),zh];
}),'The visible paragraphs and both translations must match the existing profile');
assert.equal(execFileSync('git',['hash-object','assets/gen/portrait-cover.webp'],{encoding:'utf8'}).trim(),'92eebf1fdb37399861ab1e1f019884ca342f148c','Reuse the exact archived print portrait');
assert.equal(page,directoryPage(data.projects)+'\n');assert.deepEqual(inventory.map(p=>p.id),data.projects.map(p=>p.id));
assert.equal(new Set(data.projects.map(p=>p.id)).size,data.projects.length);
const released=JSON.parse(execFileSync('git',['show','c4d03be:data.json'],{encoding:'utf8'}));
for(const p of released.projects)assert.ok(inventory.some(row=>row.id===p.id),'Preserve released work: '+p.id);assert.equal((page.match(/class="work-row"/g)||[]).length,data.projects.length);
assert.ok(!home.includes('id="projectGrid"'));assert.ok(home.includes('href="/works/?topic=poker"'));
const tallies={};for(const p of data.projects){
  const topic=topicFor(p);tallies[topic]=(tallies[topic]||0)+1;
  const row=page.match(new RegExp('<article id="project-'+p.id+'"[^]*?</article>'))?.[0];assert.ok(row);
  if(p.url)assert.ok(row.includes('class="work-entry" href="'+p.url.replaceAll('&','&amp;')+'"'));
  if(p.github)assert.ok(row.includes(p.github));if(p.iterationUrl)assert.ok(row.includes(p.iterationUrl));
  assert.ok(row.includes(taskFor(p)[0]));assert.ok(row.includes('<details'));
  if(p.group==='cases')assert.ok(!row.includes('data-zh="打开工具"'));
}
for(const [topic,count] of Object.entries({ai:5,life:5,practice:3,poker:4,growth:4,strategy:1}))assert.ok(tallies[topic]>=count);
for(const s of selected)assert.ok(!home.match(new RegExp('id="project-'+s.project+'"')));
assert.deepEqual(lookup('扑克筹码管理模拟器').items[0].task.url,'/poker-bankroll-sim/');
assert.ok(lookup('套餐毛利').items.some(({task})=>task.url==='/bundle-lab/simulate/'));
const extra={id:'future-tool',name:'新作品',nameEn:'New work',subtitle:'核对条件',subtitleEn:'Check conditions',group:'main',category:'strategy',url:'/future/'};
assert.ok(directoryPage([...data.projects,extra]).includes('class="work-entry" href="/future/"'));
assert.ok(directoryPage([...data.projects,extra]).includes((data.projects.filter(p=>p.group==='main').length+1)+' 件产品实验'));
console.log('Directory verified against the published homepage, the 22 canonical records, real routes, two task queries and a future addition.');

// The public index and homepage must continue to present the same four working exhibits.
for(const html of [home,page]){
  assert.deepEqual([...html.matchAll(/<details class="print-sheet"[^>]+data-sheet="([^"]+)"/g)].map(m=>m[1]),selected.map(s=>s.id));
  for(const item of selected){
    assert.ok(html.includes('href="#print-'+item.id+'"'));
    assert.ok(html.includes('id="selected-panel-'+item.id+'"'));
  }
}
assert.ok(!page.includes('id="desktop-proof"'));
assert.equal((page.match(/<details class="work-drawer"/g)||[]).length,data.projects.length);
const bundleRow=page.match(/<article id="project-bundle"[^]*?<\/article>/)[0];
assert.equal((bundleRow.match(/class="reel-frame"/g)||[]).length,3);
assert.ok(bundleRow.includes('/assets/work/bundle-candidates.jpg'));
assert.ok(bundleRow.includes('/assets/work/bundle-ledger.jpg'));
for(const file of page.matchAll(/data-src="(\/[^"]+)"/g))assert.ok(fs.existsSync('.'+file[1]),file[1]);
console.log('Shared poster interactions, native drawers, source paths and the multi-view gallery verified.');
