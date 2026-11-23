import {lookup} from './assets/task-search.mjs?v=cv1';
import {quickTasks} from './content/resume-profile.mjs';
const sampleTitle=(id)=>quickTasks.find(row=>row[0]===id)?.[lang()+1];

const input=document.querySelector('#jdInput'), result=document.querySelector('#jdResult');
const submit=document.querySelector('#jdRun'), announcement=document.querySelector('#taskAnnouncement');
const examples=[...document.querySelectorAll('[data-task]')];
const lang=()=>document.documentElement.lang==='en'?1:0;
const phrase=(zh,en)=>[zh,en][lang()];
const node=(tag,txt,cls)=>{const el=document.createElement(tag);el.textContent=txt;if(cls)el.className=cls;return el;};
let active='', submitted=false;
function setControls(){
  submit.disabled=!input.value.trim();
  for(const button of examples)button.setAttribute('aria-pressed',String(button.dataset.task===active));
}
function render(){
  setControls();
  result.replaceChildren();result.hidden=!submitted;announcement.textContent='';
  if(!submitted)return;
  const {items,missing,limitations}=lookup(input.value),index=lang(),copyLines=[];
  for(const {task,parts} of items){
    const row=node('article','','task-result-row');
    const body=node('div','');
    body.append(node('small',task.kind[index]),node('h3',task.owner?task.name[index]+' · '+task.title[index]:task.name[index]),node('p',task.desc[index]));
    body.append(node('p',phrase('对应任务 · ','Task · ')+parts.join(' / '),'task-context'));
    const link=node('a',phrase('查看材料','View evidence')+' ↗');link.href=task.url;
    row.append(body,link);result.append(row);
    copyLines.push(task.name[index]+' · '+task.kind[index],parts.join(' / '),task.desc[index],new URL(task.url,location.origin).href,'');
  }
  function note(message){result.append(node('p',message,'task-note'));copyLines.push(message);}
  if(limitations.length)note(phrase('可查看跨语言召回规则与匹配纠错。独立训练或调优排序、召回模型的经历暂无公开材料。','Available evidence covers multilingual retrieval rules and matching decisions. Independent training or tuning of ranking and retrieval models has no public case here.'));
  if(missing.length)note(phrase('尚未找到公开材料 · ','No public material found for · ')+missing.join(' / '));
  if(!items.length){const link=node('a',phrase('换一个任务，或浏览完整作品库 →','Try another task, or browse all work →'));link.href='#projects';result.append(link);}
  else{
    const copy=node('button',phrase('复制结果和链接','Copy results and links'),'jd-copy');
    copy.type='button';
    copy.onclick=async()=>{const contents=copyLines.join('\n');try{await navigator.clipboard.writeText(contents);copy.textContent=phrase('已复制','Copied');}catch{const field=node('textarea','');field.value=contents;field.readOnly=true;field.setAttribute('aria-label',phrase('手动复制结果','Copy results manually'));copy.replaceWith(field);field.select();}};
    result.append(copy);
  }
  announcement.textContent=items.length?phrase('已更新相关材料','Evidence updated'):phrase('没有找到相关材料','No relevant material found');
}
function remember(){
  history.replaceState({...history.state,taskSearch:{value:input.value,active,submitted}},'');
}
function run(){submitted=!!input.value.trim();render();remember();}
document.querySelector('#taskForm').onsubmit=e=>{e.preventDefault();run();};
examples.forEach(b=>b.onclick=()=>{active=b.dataset.task;input.value=sampleTitle(active);run();});
input.oninput=()=>{const hadResult=submitted;active='';submitted=false;render();if(hadResult)remember();};
window.addEventListener('pagehide',remember);
document.querySelector('#jdClear').onclick=()=>{input.value='';active='';submitted=false;render();remember();input.focus();};
new MutationObserver(()=>{if(active)input.value=sampleTitle(active);render();}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
const saved=history.state?.taskSearch;
if(saved){active=quickTasks.some(t=>t[0]===saved.active)?saved.active:'';input.value=active?sampleTitle(active):saved.value;submitted=saved.submitted;}
render();

function revealEvidence() {
  const item=document.getElementById(location.hash.slice(1));
  if(item?.id==='resumes'){item.open=true;return;}
  if(!item?.matches('details.evidence-note'))return;
  for(let parent=item.parentElement;parent;parent=parent.parentElement){
    if(parent.tagName==='DETAILS')parent.open=true;
  }
  item.open=true;
  item.querySelector('summary').focus({preventScroll:true});
  item.scrollIntoView({block:'start'});
}
window.addEventListener('hashchange',revealEvidence);
window.addEventListener('load',revealEvidence);
revealEvidence();
