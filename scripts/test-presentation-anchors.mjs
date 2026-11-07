import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {test} from 'node:test';
import {rasterSize} from '../content/raster-size.mjs';
import {presentationCases} from '../content/presentation-mode.mjs';

test('all eight high-point images reserve their actual intrinsic dimensions',()=>{
 let checked=0;
 for(const href of Object.values(presentationCases)){
  const url=new URL(href,'https://example.test');
  const html=fs.readFileSync('.'+url.pathname+'index.html','utf8');
  for(const match of html.matchAll(/<img src="([^"]+)" width="(\d+)" height="(\d+)"/g)){
   const actual=rasterSize(fs.readFileSync('.'+match[1]));
   assert.deepEqual({width:Number(match[2]),height:Number(match[3])},actual,match[1]);
   checked++;
  }
 }
 assert.equal(checked,8);
});
test('follow-up changes only image dimensions, anchor opt-in and stylesheet cache version',()=>{
 const before='0621651cfe4c295fa37bf4300e6a5480445787f5';
 // Scope this historical follow-up to the case pages that existed then.
 // Newly approved projects have their own integration checks.
 const files=execFileSync('git',['ls-tree','-r','--name-only',before,'--','cases'],{encoding:'utf8'}).trim().split('\n').filter(file=>file.endsWith('/index.html'));
 for(const file of files){
  const dir=file.split('/')[1];
  if(!fs.existsSync(file))continue;
  const old=execFileSync('git',['show',`${before}:${file}`],{encoding:'utf8'});
  const current=fs.readFileSync(file,'utf8');
  const permitted=Object.values(presentationCases).some(href=>href.startsWith(`/cases/${dir}/`));
  const expected=permitted?old.replaceAll('width="1440" height="1000"','width="1440" height="900"').replace('id="mechanism" class="section"','id="mechanism" class="section case-highlight-target"').replace('/assets/case-studies.css?v=20261101-integrated1','/assets/case-studies.css?v=20261103-anchor1'):old;
  assert.equal(current,expected,file);
 }
});
test('invalid images fail rather than reintroducing a made-up aspect ratio',()=>{
 for(const invalid of [Buffer.alloc(0),Buffer.from([0xff,0xd8,0xff,0xc0,0,12]),Buffer.from('not an image')])assert.throws(()=>rasterSize(invalid),/valid PNG\/JPEG/);
});
