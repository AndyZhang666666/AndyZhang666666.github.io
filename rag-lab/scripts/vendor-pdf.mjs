// Pin all PDF parsing resources locally. No CDN or runtime network dependency.
import {copyFile,cp,mkdir,readFile,writeFile,readdir}from'node:fs/promises';
import{createHash}from'node:crypto';
const base=new URL('../',import.meta.url),pkg=new URL('node_modules/pdfjs-dist/',base),out=new URL('vendor/',base);
const meta=JSON.parse(await readFile(new URL('package.json',pkg)));
if(meta.version!=='6.5.438')throw Error('Expected locked PDF.js 6.5.438');
await mkdir(out,{recursive:true});
const sources=['build/pdf.mjs','build/pdf.worker.mjs','LICENSE'];const manifest={package:'pdfjs-dist',version:meta.version,license:'Apache-2.0',resources:[]};
for(const source of sources){const target=source.split('/').at(-1);await copyFile(new URL(source,pkg),new URL(target,out));const bytes=await readFile(new URL(target,out));manifest.resources.push({source,target,sha256:createHash('sha256').update(bytes).digest('hex')});}
for(const folder of ['cmaps','standard_fonts']){await cp(new URL(folder+'/',pkg),new URL(folder+'/',out),{recursive:true});for(const file of (await readdir(new URL(folder+'/',out))).sort()){const target=folder+'/'+file,bytes=await readFile(new URL(target,out));manifest.resources.push({source:target,target,sha256:createHash('sha256').update(bytes).digest('hex')});}}
await writeFile(new URL('PROVENANCE.json',out),JSON.stringify(manifest,null,2)+'\n');
console.log('Vendored PDF.js parser, worker, CMaps and standard fonts; no build script executed.');
