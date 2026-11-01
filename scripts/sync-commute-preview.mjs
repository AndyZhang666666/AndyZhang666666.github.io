// Generate a read-only projection from the exact, committed product algorithms.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const root=path.resolve(import.meta.dirname,'..'),repo=path.resolve(root,'../commute');
const revision=process.argv[2]||execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim();
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const files=['src/lib/simulate.js','src/lib/distributions.js','src/lib/presets.js','src/lib/insights.js','src/lib/tradeoff.js'];
const sources=files.map(file=>{const value=execFileSync('git',['show',`${revision}:${file}`],{cwd:repo});if(hash(value)!==hash(fs.readFileSync(path.join(repo,file))))throw Error('Uncommitted preview dependency: '+file);return {file,sha256:hash(value)};});
const load=file=>import(pathToFileURL(path.join(repo,file)));
const [{simulate,DEFAULT_SETTINGS,fmtClock},{getPreset,presetToOptions,DEFAULT_PRESET_ID},{championGroups},{compareTradeoff}]=await Promise.all([load(files[0]),load(files[2]),load(files[3]),load(files[4])]);
const options=presetToOptions(getPreset(DEFAULT_PRESET_ID)).filter((_,i)=>i===0||i===2),result=simulate(options,DEFAULT_SETTINGS,{months:2000});
const groups=championGroups(result),base=result.options.find(o=>o.id===groups.cheapest[0].id),other=result.options.find(o=>o.id!==base.id);
const value={source:'Two built-in illustrative Hangzhou estimates; no live traffic',modelVersion:result.modelVersion,settings:DEFAULT_SETTINGS,months:result.months,seed:result.seed,inputs:options,
 routes:result.options.map(o=>({id:o.id,name:o.name,daily:{p10:o.daily.p10,p50:o.daily.p50,p90:o.daily.p90,spread:o.daily.spread},monthly:o.monthly,departure:fmtClock(o.suggestedDeparture)})),
 tradeoff:{base:base.id,other:other.id,...compareTradeoff(base,other)},focus:Object.fromEntries(Object.entries(groups).map(([k,rows])=>[k,rows.map(o=>o.id)]))};
const output=JSON.stringify(value,null,2)+'\n';fs.writeFileSync(path.join(root,'assets/demo-preview/commute-example.json'),output);
fs.writeFileSync(path.join(root,'assets/demo-preview/commute-provenance.json'),JSON.stringify({repo:'commute-compare',revision,sources,outputSha256:hash(output),command:'node scripts/sync-commute-preview.mjs '+revision,use:'Read-only product-model projection; no separate homepage simulation or visitor storage'},null,2)+'\n');
console.log('Synced two canonical commute routes, tradeoffs and provenance.');
