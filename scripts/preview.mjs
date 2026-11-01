import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const suite=path.resolve(root,'../../demo-suite-2026-10-24'),polish=path.resolve(root,'../../demo-polish-2026-10-27');
const port=Number(process.env.PREVIEW_PORT||8820);
const integrated={'llm-output-eval':'eval','bundle-lab':'bundle','commute-compare':'commute'};
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.pdf':'application/pdf','.ttf':'font/ttf','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};
const exports=new Set(['llm-output-eval','bundle-lab','growth-experiment-lab','pricing-model-sim','commute-compare','poker-bankroll-sim','poker-ev-calculator']);
function serve(req,res,originalHost=false){try{
 const u=new URL(req.url,'http://localhost'),all=decodeURIComponent(u.pathname).split('/').filter(Boolean),prefix=all[0]==='original',old=originalHost||prefix,parts=prefix?all.slice(1):all;
 let base=old?path.join(suite,'site'):root,relative=parts.join('/');
 if(exports.has(parts[0])){const own=integrated[parts[0]]&&path.resolve(root,'..',integrated[parts[0]],'out');const updated=own&&fs.existsSync(own)?own:path.join(polish,parts[0],'out');base=!old&&fs.existsSync(updated)?updated:path.join(suite,parts[0],'out');relative=parts.slice(1).join('/')}
 else if(parts[0]==='grounded-choice'){base=path.join(suite,'grounded-choice','docs');relative=parts.slice(1).join('/')}
 let file=path.resolve(base,relative);if(file!==base&&!file.startsWith(base+path.sep))throw Error('path');if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
 if(['.html','.json'].includes(path.extname(file))){let value=fs.readFileSync(file,'utf8');
  // review.html deliberately embeds the live public site, so its public origin must survive.
  if(file!==path.join(root,'review.html'))value=value.replaceAll('https://andyzhang666666.github.io',`http://127.0.0.1:${originalHost?8812:port}${old&&!originalHost?'/original':''}`);
  // Isolate original exports' absolute resource/route references while keeping their bytes on disk intact.
  if(old&&!originalHost&&base!==path.join(suite,'site'))value=value.replace(/((?:href|src)=")\/(?!\/|original\/)/g,'$1/original/');
  res.end(value);
 }else fs.createReadStream(file).pipe(res);
 }catch{res.writeHead(404);res.end('Not found')}}
http.createServer((req,res)=>serve(req,res)).listen(port,'127.0.0.1',()=>console.log(`Content-only preview http://127.0.0.1:${port}/review.html`));
if(process.env.WITH_ORIGINAL)http.createServer((req,res)=>serve(req,res,true)).listen(8812,'127.0.0.1',()=>console.log('Isolated original http://127.0.0.1:8812/'));
