// Read-only, in-memory homepage previews. Full apps retain their own state.
const en=()=>document.documentElement.lang.startsWith('en');
const words=(node,zh,english)=>{node.dataset.zh=zh;node.dataset.en=english;node.textContent=en()?english:zh;};
const feedback=node=>{if(node.animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches)node.animate([{opacity:.45,transform:'translateY(5px)'},{opacity:1,transform:'none'}],{duration:240,easing:'cubic-bezier(.16,1,.3,1)'});};

export function initExecution(panel){
 const records=JSON.parse(panel.querySelector('#executionPreviewRecord').textContent),record=records.find(item=>item.policy==='hardened');
 const button=panel.querySelector('[data-agent-check]'),result=panel.querySelector('[data-agent-result]');
 button.disabled=false;
 button.addEventListener('click',()=>{
  const expanded=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(expanded));result.hidden=!expanded;
  words(button.querySelector('span'),expanded?'收起核对结果':'展开原操作的核对结果',expanded?'Close the reconciliation':'Inspect the original operation');
  words(panel.querySelector('[data-agent-status]'),expanded?`原操作已提交：${record.operations.length} 次业务提交、${record.ticket.notes.length} 条记录，工单保持打开。只是展开已有程序记录。`:'结果未知时先查原操作。这里不会执行工具或写入工单。',expanded?'Original operation committed: one commit, one note, ticket still open. This is a saved program record.':'Check the original operation when the result is unknown. No tool runs or ticket writes here.');
  if(expanded)feedback(result);
 });
}

const scopes={present:{date:'2026-10-28',snapshot:'baseline'},historic:{date:'2026-06-30',snapshot:'baseline'},revised:{date:'2026-10-28',snapshot:'revised'}};
export async function initRag(panel){
 // Load the canonical retrieval engine and public-only corpus on first selection.
 const [{retrieveRun},response]=await Promise.all([import('../rag-lab/engine.mjs'),fetch('/rag-lab/public-corpus.json')]);
 if(!response.ok)throw Error('Public example corpus unavailable');
 const {documents}=await response.json(),buttons=[...panel.querySelectorAll('[data-rag-scope]')],run=panel.querySelector('[data-rag-run]'),answer=panel.querySelector('[data-rag-answer]');
 let selected='present',displayed='present';
 buttons.forEach(button=>{button.disabled=false;button.addEventListener('click',()=>{
  selected=button.dataset.ragScope;buttons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  const pending=selected!==displayed;run.disabled=!pending;answer.dataset.stale=String(pending);
  words(panel.querySelector('[data-rag-status]'),pending?'条件已改变，下面仍是旧条件的结果。点击重新查找后才更新答案。':'下方结果与所选条件一致；引用可展开核对。',pending?'Scope changed. The answer below still belongs to the previous scope. Search again to update it.':'The answer matches the selected scope. Open its citation to inspect it.');
 });});
 run.addEventListener('click',()=>{
  const scope=scopes[selected],result=retrieveRun(documents,{question:'显示器可以借多久？',...scope,generation:'extractive'},'employee','original-example'),cite=result.citations[0];
  displayed=selected;run.disabled=true;answer.dataset.stale='false';
  panel.querySelector('[data-rag-result-scope]').textContent=`${scope.date} · ${scope.snapshot} · employee`;
  const days=panel.querySelector('[data-rag-days]');days.replaceChildren(document.createTextNode(result.facts[0].value.replace('天','')));const unit=document.createElement('span');words(unit,'天',' days');days.append(unit);
  panel.querySelector('[data-rag-answer-text]').textContent=result.answer;
  panel.querySelector('[data-rag-citation]').textContent=`${cite.id} · v${cite.version}`;
  panel.querySelector('[data-rag-quote]').textContent=cite.text;
  words(panel.querySelector('[data-rag-effective]'),`v${cite.version} · ${cite.effectiveFrom} 起生效${cite.effectiveTo?`，${cite.effectiveTo} 失效`:''}`,`v${cite.version} · Effective from ${cite.effectiveFrom}${cite.effectiveTo?` until ${cite.effectiveTo}`:''}`);
  panel.querySelector('[data-rag-evidence]').open=false;
  words(panel.querySelector('[data-rag-status]'),`已按 ${scope.date} / ${scope.snapshot} 重新检索，依据 ${cite.id}。原文为中文原创虚构资料，无模型调用。`,`Searched again for ${scope.date} / ${scope.snapshot}, using ${cite.id}. Source text is original fictional Chinese material. No model call.`);
  feedback(answer);
 });
}
