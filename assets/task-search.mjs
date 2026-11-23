import {objects} from '../content/studio-objects.mjs';
import { containsKeyword, requirements } from './evidence-core.mjs';
import { tasks } from '../content/task-portfolio.mjs?v=cv1';
import { quickTasks } from '../content/resume-profile.mjs';

const training = /(?:训练|调优|training|train(?:ing)?|fine[- ]?tun\w*).{0,20}(?:召回|排序|retriev\w*|rank\w*)|(?:召回|排序|retriev\w*|rank\w*).{0,20}(?:训练|调优|training|fine[- ]?tun\w*)/i;
const byId = new Map(tasks.map(task => [task.id,task]));
export function lookup(input) {
  const found=new Map(), missing=[], limitations=[];
  function record(task,part,score,primary=false) {
    const hit=found.get(task.id)??{task,parts:new Set(),best:0,primary:0};
    hit.parts.add(part);hit.best=Math.max(hit.best,score);
    if(primary)hit.primary++;
    found.set(task.id,hit);
  }
  for(const part of requirements(input.trim().slice(0,12000))){
    if(training.test(part))limitations.push(part);
    const quick=quickTasks.find(([,zh,en])=>containsKeyword(part,zh)||containsKeyword(part,en));
    const hits=tasks.map(task=>{
      const words=task.words.split(' ').filter(w=>containsKeyword(part,w.replaceAll('_',' ')));
      let score=words.reduce((n,w)=>n+Math.min(8,w.length),0);
      if(task.title.some(t=>containsKeyword(part,t))||quick?.[0]===task.id)score+=80;
      if(score && task.owner)score+=2;
      return {task,score};
    }).filter(hit=>hit.score).sort((a,b)=>b.score-a.score);
    if(!hits.length){missing.push(part);continue;}
    hits.forEach(({task,score},i)=>record(task,part,score,i===0));
    const first=hits[0].task;
    const independent=objects.find(o=>o.evidence===first.id);
    if(independent)record(byId.get('studio-'+independent.folder),part,hits[0].score-0.05);
    if(first.related)record(byId.get(first.related),part,hits[0].score-0.1);
    if(quick?.[0]==='subscription')for(const id of ['premium','membership'])record(byId.get(id),part,2);
  }
  const items=[...found.values()].sort((a,b)=>b.primary-a.primary||b.best-a.best).slice(0,3)
    .map(hit=>({...hit,parts:[...hit.parts]}));
  return {items,missing,limitations};
}
