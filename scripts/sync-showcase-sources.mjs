// Copy only public, pure display inputs. Never read settings, credentials or visitor state.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const root=path.resolve(import.meta.dirname,'..');
const sourceRoot=path.resolve(process.argv[2]||path.join(root,'..'));
const aliases={'bundle-lab':'bundle','llm-output-eval':'eval'};
const repoPath=name=>path.join(sourceRoot,fs.existsSync(path.join(sourceRoot,name))?name:aliases[name]);
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const pinned=[
  {repo:'bundle-lab',revision:'b50f57e46ef98ed594a0394e564da84a4c7099da',source:'lib/simulate.js',target:'assets/demo-preview/bundle-model.mjs'},
  {repo:'llm-output-eval',revision:'ff214286afc4483ee66dd975063e2e497286e554',source:'src/data/replay.json',target:'assets/demo-preview/eval-sample.json'},
];
const manifest={format:1,sources:[]};
for(const entry of pinned){
  const cwd=repoPath(entry.repo);
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
// Read a real mined candidate from the same pinned synthetic order corpus.
// Mining stays at build time. The browser reuses the original pure contribution model.
const bundleRevision=pinned[0].revision,bundleRoot=repoPath('bundle-lab');
const dependencyPaths=['lib/orders.js','lib/rules.js','data/orders.csv'];
const inputs=dependencyPaths.map(file=>{
 const value=execFileSync('git',['show',`${bundleRevision}:${file}`],{cwd:bundleRoot});
 if(hash(fs.readFileSync(path.join(bundleRoot,file)))!==hash(value))throw Error('Pinned candidate dependency drift: '+file);
 return {source:file,sha256:hash(value)};
});
const {parseCSV,groupOrders,priceTable}=await import(pathToFileURL(path.join(bundleRoot,'lib/orders.js')));
const {toTransactions,mineBundles}=await import(pathToFileURL(path.join(bundleRoot,'lib/rules.js')));
const {compareBundles}=await import(pathToFileURL(path.join(root,'assets/demo-preview/bundle-model.mjs')));
const parsed=parseCSV(fs.readFileSync(path.join(bundleRoot,'data/orders.csv'),'utf8'));
if(parsed.error)throw Error(parsed.error);
const transactions=toTransactions(groupOrders(parsed.rows));
const candidates=mineBundles(transactions,{limit:Infinity});
const candidate=compareBundles(candidates,{transactions,priceOf:priceTable(parsed.rows)}).find(b=>b.key==='可乐 + 鸡腿饭');
if(!candidate)throw Error('The named example must exist in canonical mined candidates');
const output=JSON.stringify({source:'Built-in synthetic orders',selection:'A familiar two-item example that exposes discount leakage; not the highest-return candidate',orderCount:transactions.length,candidateCount:candidates.length,candidate},null,2)+'\n';
fs.writeFileSync(path.join(root,'assets/demo-preview/bundle-candidate.json'),output);
manifest.sources.push({repo:'bundle-lab',revision:bundleRevision,target:'assets/demo-preview/bundle-candidate.json',inputs,outputSha256:hash(output),use:'Deterministic mining of pinned synthetic orders with canonical rules and contribution model; not live trading data'});
fs.writeFileSync(path.join(root,'assets/demo-preview/provenance.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Synced the pinned Bundle model, mined candidate and original Eval replay; provenance recorded.');
