// Exact, previously published verification images. No uploads or image transforms.
// Archive capture records retain their original local filenames and dimensions.
const size=Object.freeze({width:1440,height:1000});
export const evalPublicCoverUrl='https://raw.githubusercontent.com/AndyZhang666666/llm-output-eval/9f66e9e730041033c4f90f2def6102952516c276/docs/screenshots/workbench-20261112/desktop.jpg';
export const ragPublicCoverPath='/assets/work/showcase/rag-lab-craft.png';
export const publicCovers=Object.freeze({
 eval:Object.freeze({
  full:evalPublicCoverUrl,thumbnail:evalPublicCoverUrl,size,
  kind:'previously-public-verification-screenshot',
  sourceRepository:'AndyZhang666666/llm-output-eval',
  sourceCommit:'9f66e9e730041033c4f90f2def6102952516c276',
  sourcePath:'docs/screenshots/workbench-20261112/desktop.jpg',
  sourceBlob:'1ff02c0101ab1a90e97f6af7012b75b2e36020ed',
  sourceBytes:113326,
  bytePolicy:'Reference the existing fixed public URL; do not copy or upload image bytes.'
 }),
 'rag-lab':Object.freeze({
  full:ragPublicCoverPath,thumbnail:ragPublicCoverPath,size,
  kind:'previously-public-verification-screenshot',
  sourceRepository:'AndyZhang666666/AndyZhang666666.github.io',
  sourceCommit:'b205bb708bb6737e2e7772b73ef1444842e017ea',
  sourcePath:'rag-lab/evidence/craft-20261112/rag-1440-initial.png',
  sourceBlob:'2b590d957293d3c07cea90f2f21ea385ba4e2330',
  bytePolicy:'Reuse the already-public Git blob unchanged; no format or pixel conversion.'
 })
});
export function publicCoverFor(id){return Object.hasOwn(publicCovers,id)?publicCovers[id]:null;}
export function fixedPublicCoverDimensions(source){
 if(source===evalPublicCoverUrl||source===ragPublicCoverPath||source==='showcase/rag-lab-craft.png')return {...size};
 return null;
}
