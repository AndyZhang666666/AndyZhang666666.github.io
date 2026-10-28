// Copy only public, pure display inputs. Never read settings, credentials or visitor state.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const sourceRoot=path.resolve(process.argv[2]||path.join(root,'../demo-polish-2026-10-27'));
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const pinned=[
  {repo:'bundle-lab',revision:'55448e1b6c0ea623afd39d3230e1a3332e311f1e',source:'lib/simulate.js',target:'assets/demo-preview/bundle-model.mjs'},
  {repo:'llm-output-eval',revision:'7cbf20fcfd81767a641b0a830312e6293ea5307a',source:'src/data/replay.json',target:'assets/demo-preview/eval-sample.json'},
];
const manifest={format:1,sources:[]};
for(const entry of pinned){
  const cwd=path.join(sourceRoot,entry.repo);
  const value=execFileSync('git',['show',`${entry.revision}:${entry.source}`],{cwd});
  let output=value;
  if(entry.repo==='llm-output-eval'){
    const replay=JSON.parse(value),item=replay.items.find(item=>item.id==='e06'),run=item.runs[0];
    const dimension=run.dimensions.find(d=>d.id==='structure');
    const quote=dimension.evidence[0],offset=item.text.indexOf(quote);
    if(offset<0||item.text.indexOf(quote,offset+1)!==-1)throw Error('The saved quote must have one exact location.');
    output=Buffer.from(JSON.stringify({sampleId:item.id,label:item.label,text:item.text,runIndex:0,model:run.meta.model,recordedAt:run.meta.at,overall:run.overall,dimension,quoteOffset:offset},null,2)+'\n');
  }
  const target=path.join(root,entry.target);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,output);
  manifest.sources.push({...entry,url:`https://github.com/AndyZhang666666/${entry.repo}/blob/${entry.revision}/${entry.source}`,sourceSha256:hash(value),outputSha256:hash(output),use:entry.repo==='bundle-lab'?'Byte-identical pure calculation module':'Read-only e06 / run 0 / structure excerpt; no new model call'});
}
fs.writeFileSync(path.join(root,'assets/demo-preview/provenance.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Synced the pinned Bundle calculation and one original Eval replay; provenance recorded.');
