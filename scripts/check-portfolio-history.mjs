// Historical display contracts stay on their real, immutable reviewed baseline.
// Current product, calculation, state and safety checks run separately in CI.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const root=path.resolve(import.meta.dirname,'..');
const baseline=JSON.parse(fs.readFileSync(path.join(root,'docs/verification/selected-depth-baseline-20261109.json'),'utf8'));
if(!/^[a-f0-9]{40}$/.test(baseline.revision))throw Error('Historical protection requires an explicit full commit SHA');
const actual=execFileSync('git',['rev-parse',`${baseline.revision}^{commit}`],{cwd:root,encoding:'utf8'}).trim();
if(actual!==baseline.revision)throw Error('Historical commit resolution changed');
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'portfolio-approved-baseline-'));
const checkout=path.join(temporary,'checkout');
const commands=[
 ['scripts/test-four-selected.mjs'],
 ['scripts/test-personal-art-direction.mjs'],
 ['--test','scripts/test-presentation-mode.mjs','scripts/test-presentation-anchors.mjs','scripts/test-squid-integration.mjs','scripts/test-portfolio-v2.mjs','scripts/test-motion-policy.mjs'],
];
let attached=false;
try{
 execFileSync('git',['worktree','add','--detach',checkout,baseline.revision],{cwd:root,stdio:'inherit'});attached=true;
 console.log(`Historical reviewed display baseline: ${baseline.revision}. These are NOT current product-depth results.`);
 for(const args of commands)execFileSync(process.execPath,args,{cwd:checkout,stdio:'inherit'});
 execFileSync('git',['diff','--exit-code'],{cwd:checkout,stdio:'inherit'});
 const report={passed:true,scope:'Original, unchanged display/frozen-content tests on the approved historical baseline only',revision:baseline.revision,commands:commands.map(args=>['node',...args].join(' ')),currentProductClaim:false};
 if(process.env.PORTFOLIO_HISTORY_REPORT)fs.writeFileSync(process.env.PORTFOLIO_HISTORY_REPORT,JSON.stringify(report,null,2)+'\n');
 console.log('PASS: historical display contracts remain valid on their original approved baseline. Current product-depth checks are separate.');
}finally{
 if(attached)execFileSync('git',['worktree','remove',checkout],{cwd:root,stdio:'inherit'});
 fs.rmSync(temporary,{recursive:true,force:true});
}
