// Local website-only candidate. Independent tools open their existing public release.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const baseline = path.resolve(root,'../baseline');
const publicTools = new Set(['llm-output-eval','bundle-lab','commute-compare','growth-experiment-lab','pricing-model-sim','poker-bankroll-sim','poker-ev-calculator','grounded-choice']);
const mime = {'.html':'text/html; charset=utf-8','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.pdf':'application/pdf','.woff2':'font/woff2','.ttf':'font/ttf'};

function preview(base,port) {
  return http.createServer((req,res) => {
    try {
      const url = new URL(req.url,'http://127.0.0.1');
      const parts = decodeURIComponent(url.pathname).split('/').filter(Boolean);
      if (publicTools.has(parts[0])) {
        res.writeHead(302,{Location:new URL(url.pathname+url.search,'https://andyzhang666666.github.io/').href});
        res.end();
        return;
      }
      let file = path.resolve(base,parts.join('/'));
      if (file !== base && !file.startsWith(base+path.sep)) throw Error('Invalid path');
      if (fs.statSync(file).isDirectory()) file = path.join(file,'index.html');
      res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'});
      if (req.method === 'HEAD') res.end();
      else fs.createReadStream(file).pipe(res);
    } catch {
      res.writeHead(404);res.end('Not found');
    }
  }).listen(port,'127.0.0.1',() => console.log(`Local ${base===root?'candidate':'baseline'}: http://127.0.0.1:${port}/`));
}
preview(root,Number(process.env.PREVIEW_PORT||8860));
if (fs.existsSync(baseline)) preview(baseline,Number(process.env.BASELINE_PORT||8861));
