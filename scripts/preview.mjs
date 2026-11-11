import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const sourceRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const root=process.env.PREVIEW_ROOT?path.resolve(process.env.PREVIEW_ROOT):sourceRoot;
const suite=path.resolve(root,'../../demo-suite-2026-10-24');
const polish=path.resolve(root,'../../demo-polish-2026-10-27');
const port=Number(process.env.PREVIEW_PORT||8860);
if(!Number.isInteger(port)||port<1||port>65535)throw Error('PREVIEW_PORT must be a valid local port');
const integrated={'llm-output-eval':'eval','bundle-lab':'bundle','commute-compare':'commute','poker-squid-lab':'poker-squid-lab'};
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.pdf':'application/pdf','.ttf':'font/ttf','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};
const exports=new Set(['llm-output-eval','bundle-lab','growth-experiment-lab','pricing-model-sim','commute-compare','poker-bankroll-sim','poker-ev-calculator','poker-squid-lab']);
const ragFiles=new Set(['index.html','app.mjs','engine.mjs','workspace.mjs','personal-workbench.mjs','task-catalog.mjs','task-loop.mjs','import-errors.mjs','style.css','public-corpus.json','favicon.svg']);
const privateFolders=new Set(['server','backend','tests','evidence','corpus','node_modules']);

function publicPath(parts){
  if(parts.some(p=>p.startsWith('.')||p.includes('\\')||p.includes('\0')||p.toLowerCase()==='node_modules'))return false;
  if(parts.some(p=>['server','backend'].includes(p.toLowerCase())||/^(?:server|backend)\.(?:[mc]?js|ts|py)$/i.test(p)))return false;
  const [module,child]=parts.map(p=>p.toLowerCase());
  if(module==='scripts')return parts.length===2&&child==='case-reader.js';
  if(module==='rag-lab'){
    if(!child)return true;
    if(child==='vendor')return parts.length===3&&['pdf.mjs','pdf.worker.mjs'].includes(parts[2])||parts.length===4&&['cmaps','standard_fonts'].includes(parts[2])&&/^[A-Za-z0-9_.-]+$/.test(parts[3]);
    return parts.length===2&&ragFiles.has(child);
  }
  if(module==='tasteroom'&&(privateFolders.has(child)||/^(?:server|backend|model-adapter)(?:[.-]|$)/i.test(child||'')))return false;
  return true;
}

function serve(req,res,originalHost=false){
  try{
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end('Method not allowed');}
    const u=new URL(req.url,'http://localhost');
    if(u.pathname==='/__preview__'){res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Type','application/json');if(req.method==='HEAD')return res.end();return res.end(JSON.stringify({preview:'product-depth-with-portfolio-v2',root,sourceRoot,port}));}
    const all=decodeURIComponent(u.pathname).split('/').filter(Boolean);
    const prefix=all[0]==='original',old=originalHost||prefix,parts=prefix?all.slice(1):all;
    if(!publicPath(parts))throw Error('private path');
    let base=old?path.join(suite,'site'):root,relative=parts.join('/');
    if(exports.has(parts[0])){
      const own=integrated[parts[0]]&&path.resolve(sourceRoot,'..',integrated[parts[0]],'out');
      const updated=own&&fs.existsSync(own)?own:path.join(polish,parts[0],'out');
      base=!old&&fs.existsSync(updated)?updated:path.join(suite,parts[0],'out');
      relative=parts.slice(1).join('/');
      if(!fs.existsSync(base)){res.writeHead(302,{Location:new URL(u.pathname+u.search,'https://andyzhang666666.github.io/').href});return res.end();}
    }else if(parts[0]==='grounded-choice'){
      base=path.join(suite,'grounded-choice','docs');relative=parts.slice(1).join('/');
      if(!fs.existsSync(base)){res.writeHead(302,{Location:new URL(u.pathname+u.search,'https://andyzhang666666.github.io/').href});return res.end();}
    }
    let file=path.resolve(base,relative);
    if(file!==base&&!file.startsWith(base+path.sep))throw Error('outside public root');
    if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
    // Check the real destination too: a symlink must not bypass the public boundary.
    const realBase=fs.realpathSync(base),realFile=fs.realpathSync(file);
    if(realFile!==realBase&&!realFile.startsWith(realBase+path.sep))throw Error('outside public root');
    const resolvedParts=path.relative(realBase,realFile).split(path.sep);
    if(!publicPath(resolvedParts))throw Error('private destination');
    res.setHeader('Cache-Control','no-store');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
    if(req.method==='HEAD')return res.end();
    if(['.html','.json'].includes(path.extname(file))){
      let value=fs.readFileSync(file,'utf8');
      // The review shell deliberately points at the real released site.
      if(file!==path.join(root,'review.html'))value=value.replaceAll('https://andyzhang666666.github.io',`http://127.0.0.1:${originalHost?8812:port}${old&&!originalHost?'/original':''}`);
      if(old&&!originalHost&&base!==path.join(suite,'site'))value=value.replace(/((?:href|src)=")\/(?!\/|original\/)/g,'$1/original/');
      return res.end(value);
    }
    fs.createReadStream(file).on('error',()=>res.destroy()).pipe(res);
  }catch{res.writeHead(404);res.end('Not found');}
}

http.createServer((req,res)=>serve(req,res)).listen(port,'127.0.0.1',()=>console.log(`2026-11-09 joint product review: http://127.0.0.1:${port}/review.html`));
if(process.env.WITH_ORIGINAL)http.createServer((req,res)=>serve(req,res,true)).listen(8812,'127.0.0.1',()=>console.log('Isolated original http://127.0.0.1:8812/'));
