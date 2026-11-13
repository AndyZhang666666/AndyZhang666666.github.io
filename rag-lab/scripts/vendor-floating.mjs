import {build} from 'esbuild';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
await build({stdin:{contents:"export {computePosition,autoUpdate,offset,flip,shift} from '@floating-ui/dom';",resolveDir:fileURLToPath(root),sourcefile:'citation-positioning.js'},bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,legalComments:'inline',outfile:fileURLToPath(new URL('vendor/floating-ui.mjs',root)),banner:{js:'/* Floating UI DOM 1.8.0 · MIT · see floating-ui.LICENSE.txt */'}});
const licenses=[];
for(const name of ['dom','core','utils'])licenses.push(`@floating-ui/${name}\n`+await readFile(new URL(`node_modules/@floating-ui/${name}/LICENSE`,root),'utf8'));
await writeFile(new URL('vendor/floating-ui.LICENSE.txt',root),licenses.join('\n\n'));
console.log('Self-hosted citation positioning asset built; no runtime CDN.');
