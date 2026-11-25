export function sectionRange(html,id){
  const start=html.indexOf(`<section id="${id}"`);
  if(start<0)throw Error('Missing section: '+id);
  const tags=/<\/?section\b[^>]*>/g;
  tags.lastIndex=start;
  let depth=0, tag;
  while((tag=tags.exec(html))){
    depth+=tag[0].startsWith('</')?-1:1;
    if(!depth)return {start,end:tags.lastIndex};
  }
  throw Error('Unclosed section: '+id);
}
