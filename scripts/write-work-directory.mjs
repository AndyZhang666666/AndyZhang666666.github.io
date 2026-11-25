import fs from 'node:fs';
import {directoryPage,taskFor} from '../content/work-directory.mjs';
export function writeWorkDirectory(data) {
  const works=new URL('../works/',import.meta.url);
  fs.mkdirSync(works,{recursive:true});
  fs.writeFileSync(new URL('index.html',works),directoryPage(data.projects)+'\n');
  const inventory=data.projects.map(p=>({id:p.id,name:[p.name,p.nameEn||p.name],title:taskFor(p),url:p.url||p.iterationUrl||'/works/#project-'+p.id,method:p.iterationUrl||'/works/#project-'+p.id,group:p.group,tags:p.tags||[],tagsEn:p.tagsEn||[]}));
  fs.writeFileSync(new URL('../assets/work-inventory.mjs',import.meta.url),'// Generated from the same project records as /works/.\nexport const inventory = '+JSON.stringify(inventory,null,2)+';\n');
}
