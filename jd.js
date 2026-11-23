import {lookup} from './assets/task-search.mjs';
import {tasks} from './content/task-portfolio.mjs';

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
    body.append(node('small',task.kind[index]),node('h3',task.name[index]),node('p',task.desc[index]));
    body.append(node('p',phrase('对应任务 · ','Task · ')+parts.join(' / '),'task-context'));
    const link=node('a',phrase('查看材料','View evidence')+' ↗');link.href=task.url;
    row.append(body,link);result.append(row);
    copyLines.push(task.name[index]+' · '+task.kind[index],parts.join(' / '),task.desc[index],new URL(task.url,location.origin).href,'');
  }
  function note(message){result.append(node('p',message,'task-note'));copyLines.push(message);}
  if(limitations.length)note(phrase('本站尚未提供线上排序实验或召回模型训练案例。可信 RAG 可以演示检索与引用核对。','This portfolio has no public online ranking experiment or retrieval-model training case. RAG Lab demonstrates retrieval and source checks.'));
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
examples.forEach(b=>b.onclick=()=>{active=b.dataset.task;input.value=tasks.find(t=>t.id===active).title[lang()];run();});
input.oninput=()=>{const hadResult=submitted;active='';submitted=false;render();if(hadResult)remember();};
window.addEventListener('pagehide',remember);
document.querySelector('#jdClear').onclick=()=>{input.value='';active='';submitted=false;render();remember();input.focus();};
new MutationObserver(()=>{if(active)input.value=tasks.find(t=>t.id===active).title[lang()];render();}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
const saved=history.state?.taskSearch;
if(saved){active=tasks.some(t=>t.id===saved.active)?saved.active:'';input.value=active?tasks.find(t=>t.id===active).title[lang()]:saved.value;submitted=saved.submitted;}
render();
