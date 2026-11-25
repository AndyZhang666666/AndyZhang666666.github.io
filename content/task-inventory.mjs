import {inventory} from '../assets/work-inventory.mjs';

const aliases={rag:'rag-lab',agent:'agent-bench',group:'suibianju'};
const curatedStudios={'studio-script':'scene-revision','studio-menu':'menu-search','studio-credits':'generation-quote'};

// Editorial search vocabulary can differ from a product's public name. Resolve the
// destination from the catalog, while retaining whether a curated task opens a case.
export function catalogTasks(curated){
  const byId=new Map(inventory.map(p=>[p.id,p])), included=new Set();
  const mapped=curated.map(task=>{
    if(task.owner)return task;
    const p=byId.get(aliases[task.id]||curatedStudios[task.id]||task.id);
    if(!p)return task;
    included.add(p.id);
    return {...task, url:task.url.startsWith('/cases/')?p.method:p.url, words:task.words+' '+p.name.map(n=>n.replaceAll(' ','_')).join(' ')};
  });
  for(const p of inventory){
    if(included.has(p.id))continue;
    const kind=p.group==='cases'?['实践案例','Case study']:['作品','Portfolio work'];
    const terms=[...p.name,...p.tags,...p.tagsEn].filter(v=>typeof v==='string'&&v.trim().length>1);
    mapped.push({id:'catalog-'+p.id,title:p.title,name:p.name,kind,desc:p.title,url:p.url,words:terms.map(v=>v.trim().replaceAll(' ','_')).join(' ')});
  }
  return mapped;
}
