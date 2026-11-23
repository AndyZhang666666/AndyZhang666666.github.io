import { containsKeyword, requirements } from './evidence-core.mjs';
import { tasks } from '../content/task-portfolio.mjs';

const ranking = /(?:搜索|检索|推荐).{0,6}排序|搜排|search rank(?:ing)?|ranking (?:model|experiment)|online ranking|召回模型|retrieval model (?:training|tuning)/i;
export function lookup(input) {
  const parts = requirements(input.trim().slice(0,12000));
  const found = new Map(), missing = [], limitations = [];
  for (const part of parts) {
    const ranked = ranking.test(part);
    if (ranked) limitations.push(part);
    const matches = tasks.map(task => {
      const hits = task.words.split(' ').filter(word=>containsKeyword(part,word.replaceAll('_',' ')));
      let relevance = hits.length;
      if (task.title.some(title=>containsKeyword(part,title))) relevance += 20;
      if (ranked && task.id==='rag') relevance = Math.max(2,relevance);
      if (ranked && task.id==='growth') relevance = 0;
      return {task,relevance};
    }).filter(x=>x.relevance).sort((a,b)=>b.relevance-a.relevance);
    if (!matches.length) missing.push(part);
    for (const [i,{task,relevance}] of matches.entries()) {
      const record = found.get(task.id) ?? {task,parts:[],best:0,primary:0};
      record.parts.push(part);
      record.best=Math.max(record.best,relevance);
      if(i===0) record.primary++;
      found.set(task.id,record);
    }
  }
  return {items:[...found.values()].sort((a,b)=>b.primary-a.primary||b.best-a.best).slice(0,3),missing,limitations};
}
