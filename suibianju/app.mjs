import {createSession,blank,simulateUnderstanding,submit,recommend,vote,decision,toggleMember,editCandidate,addCandidate,restore} from './engine.mjs';
const KEY='suibianju-demo-v1';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let s=null,role='a',note='',understanding=null,storageOk=true,emptyReason='';
try{const loaded=restore(localStorage.getItem(KEY));s=loaded.session;emptyReason=loaded.reason;if(!s)localStorage.removeItem(KEY);}catch{storageOk=false;}
function persist(){if(!s)return;try{localStorage.setItem(KEY,JSON.stringify(s));}catch{storageOk=false;message('浏览器存储不可用，当前可继续体验，但刷新可能丢失。');}}
function message(t){$('toast').textContent=t;}
function start(){s=createSession();role='a';understanding=null;note='';persist();render();message('先替小林说一句想法并确认；另外两位已有虚构条件。之后可切换角色，逐人表态。');$('editor-title')?.focus();}
function expire(){if(s&&s.expiresAt<=Date.now()){s=null;try{localStorage.removeItem(KEY);}catch{}emptyReason='expired';render();message('演示已到期，本地记录已清除。可以重新开始。');return true;}return false;}
function money(r){return Number.isFinite(r.min)&&Number.isFinite(r.max)?`¥${r.min}–${r.max} / 人`:Number.isFinite(r.max)?`最高 ¥${r.max} / 人`:'人均未知';}
function options(values,current,empty){return `<option value="">${empty}</option>`+values.map(v=>`<option ${v===current?'selected':''}>${esc(v)}</option>`).join('');}
function summary(c){return `必须满足：${[c.budget!==null?`人均最高 ${c.budget} 元`:'',c.district?`${c.district}`:'',c.noSpicy?'需提供无辣':'' ].filter(Boolean).join('、')||'未设置'}。<br>尽量满足：${[c.prefer,c.softNoSpicy?'无辣':''].filter(Boolean).join('、')||'未设置'}。<br>明确排除：${esc(c.exclude)||'未设置'}。`;}
function render(){
  if(!s){$('app').innerHTML=`<section class="empty"><h2>${emptyReason==='expired'?'这场演示已到期':emptyReason==='deleted'?'本地演示已删除':emptyReason==='corrupt'?'本地记录无法恢复，已清除':'今晚吃什么？先把「随便」拆开。'}</h2><p>用三位虚构朋友体验：确认条件 → 看共同候选 → 切换角色表态。也可一键体验无交集。</p><button class="primary" data-action="start">开始一场虚构饭局</button></section>`;return;}
  const m=s.members.find(m=>m.id===role),d=m.draft,result=recommend(s),final=decision(s),active=s.members.filter(m=>m.active);
  const title=final?`已确定：${final.name}`:!result.ready?'先收齐大家的条件':!result.feasible.length?'还没有大家都能接受的一餐':`有 ${result.feasible.length} 个共同可行方案`;
  $('app').innerHTML=`<section class="session-head"><div><h2 class="status-title ${final?'good':result.ready&&!result.feasible.length?'conflict':''}">${title}</h2><p class="muted">虚构饭局 · 周五晚餐 · ${active.filter(m=>m.confirmed).length}/${active.length} 人已确认条件 · 第 ${s.version} 版</p></div><small>本地保留至 ${new Date(s.expiresAt).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}</small></section>
  <section aria-label="演示角色切换" class="people">${s.members.map(p=>`<div class="person ${p.id===role?'active':''}"><div><strong>${p.name}</strong><span>${!p.active?'已退出':p.confirmed?'条件已确认':'待确认条件'}</span></div><button data-action="role" data-id="${p.id}" aria-pressed="${p.id===role}">${p.id===role?'当前角色':'切换体验'}</button></div>`).join('')}</section>
  <div class="workspace"><section class="editor" aria-labelledby="editor-title"><div class="section-top"><h2 id="editor-title" tabindex="-1">${m.name}的条件</h2><small>只是在切换演示角色</small></div>
  <p class="hint">此处可查看所有虚构角色，不具备真实私密权限。请勿填写真实敏感信息。</p>
  ${!m.active?`<p>该演示成员已退出。</p><button data-action="member" data-id="${m.id}">重新加入</button>`:`
  <label class="label" for="raw">先说说你的想法</label><textarea id="raw" maxlength="500" placeholder="我都行，但今天不想吃辣。">${esc(m.raw)}</textarea>
  <div class="actions"><button data-action="understand">模拟整理这句话</button><button data-action="manual">直接手动填写 ↓</button></div>
  <details><summary>试试其他说法 / 故障恢复</summary><div class="actions"><button data-action="example" data-id="budget">预算别太高</button><button data-action="example" data-id="vague">你们选就行</button><button data-action="fail">模拟整理失败</button></div></details>
  ${note?`<div class="helper" role="status">${esc(note)}${understanding?.clarify?'<p><label for="budget">最多人均多少元？下方留空也可以。</label></p>':''}</div>`:''}
  <div id="manual-fields"><label class="label" for="budget">必须满足 · 人均上限（元）</label><input id="budget" type="number" min="1" max="10000" inputmode="decimal" value="${esc(d.budget)}" placeholder="留空，不设上限">
  <label class="check"><input id="noSpicy" type="checkbox" ${d.noSpicy?'checked':''}>必须提供无辣餐食</label>
  <div class="fields"><div><label class="label" for="district">必须满足 · 商圈</label><select id="district">${options(['中山路','河西'],d.district,'不限')}</select></div><div><label class="label" for="exclude">明确排除 · 菜系</label><select id="exclude">${options(['烤肉','家常菜','粤菜','面食'],d.exclude,'不排除')}</select></div></div>
  <label class="label" for="prefer">尽量满足 · 想吃什么</label><select id="prefer">${options(['家常菜','粤菜','面食','烤肉'],d.prefer,'没有特别偏好')}</select><label class="check"><input id="softNoSpicy" type="checkbox" ${d.softNoSpicy?'checked':''}>尽量吃不辣（可协商）</label>
  <p class="hint">暂不确定：${understanding?.uncertain?'原话仍需你判断，可手动补充；未填写项不会变成硬条件。':'预算或商圈不确定时可留空，不自动推断。'}</p></div>
  ${m.confirmed?`<div class="summary"><strong>当前已确认条件</strong><p>${summary(m.conditions)}</p></div>`:''}
  <div class="actions"><button class="primary" data-action="submit">${m.confirmed?'确认修改并重新检查':'确认条件，看看能吃什么'}</button><button data-action="member" data-id="${m.id}">退出演示饭局</button></div>`}</section>
  <section class="results" aria-labelledby="results-title"><div class="section-top"><h2 id="results-title">公共候选与决定</h2><small>全部为虚构餐厅</small></div><p class="hint">只展示必要取舍，不把排除原因归到具体的人。筛选用预算区间上界；相关信息未知时，不算满足硬条件。</p>
  ${s.invalidated?'<p class="hint"><strong>条件、成员或候选有变化，旧表态已失效。</strong>请按当前版本重新确认。</p>':''}
  ${!result.ready?`<div class="helper">${result.message}</div>`:!result.feasible.length?`<div class="conflict-box"><h3>没有共同可行候选</h3><p>涉及：${esc([...new Set(result.blocked.flatMap(r=>r.reasons))].join('、'))}。</p><p>请成员自愿调整自己的条件，或补充并核实候选。系统不会放宽硬条件，也不会编造新餐厅。</p></div>`:''}
  ${(result.ready?result.feasible:s.candidates).map(r=>card(r,result.ready,final)).join('')}
  ${result.ready&&result.blocked.length?`<details class="blocked"><summary>查看 ${result.blocked.length} 个未入选候选及必要原因</summary>${result.blocked.map(r=>card(r,false,null,true)).join('')}</details>`:''}
  <div class="tools"><button data-action="conflict">体验一次无交集</button><button data-action="add">补充虚构候选</button><button data-action="recheck">重新检查候选</button></div><p class="hint">无交集按钮会给小满设定“人均上限 40 元”的演示硬条件，并使旧表态失效。</p></section></div>
  <section class="metrics"><h2>这次模拟发生了什么</h2><div class="numbers"><div><b>${s.metrics.recommendations}</b><span>生成 / 重新检查</span></div><div><b>${s.metrics.rejections}</b><span>暂不接受</span></div><div><b>${s.metrics.changes}</b><span>已确认条件修改</span></div><div><b>${s.startedAt?Math.max(0,Math.floor(((final?s.completedAt||Date.now():Date.now())-s.startedAt)/1000))+' 秒':'尚未开始'}</b><span>当前版本共同确认计时${final?' · 已停止':''}</span></div></div><p class="hint">只计本机操作，不上传分析日志；不是实际用户数据，也不证明决策效率提升。条件变化重新计时。</p></section>`;
}
function card(r,canVote,final,blocked=false){
  const yes=s.members.filter(m=>m.active&&s.votes[m.id]?.version===s.version&&s.votes[m.id]?.candidate===r.id&&s.votes[m.id]?.choice==='yes').length;
  const current=s.votes[role],is=(v)=>current?.candidate===r.id&&current.choice===v&&current.version===s.version;
  const no=Object.values(s.votes).some(v=>v.version===s.version&&v.candidate===r.id&&v.choice==='no');
  return `<article class="card" data-candidate="${r.id}"><div class="card-head"><h3>${esc(r.name)}</h3><span class="price">${money(r)}</span></div><p class="meta">${esc(r.cuisine)||'菜系未知'} · ${esc(r.district)||'商圈未知'} · ${r.noSpicy===true?'提供无辣':r.noSpicy===false?'不提供无辣':'无辣情况未知'}</p>
  ${canVote?`<p class="reason">满足当前全部已确认硬条件。${r.likes?'兼顾了部分成员的软偏好；其他软偏好仍需取舍。':'软偏好未形成优先项，可由大家选择。'}</p><p class="tally">${final?.id===r.id?'全员已接受 · 这餐定了':`${yes}/${s.members.filter(m=>m.active).length} 人接受${no?' · 有人暂不接受，请继续协商':''}`}</p><div class="actions"><button data-action="vote" data-id="${r.id}" data-choice="yes" aria-pressed="${is('yes')}">接受此方案</button><button data-action="vote" data-id="${r.id}" data-choice="no" aria-pressed="${is('no')}">暂不接受</button><button data-action="vote" data-id="${r.id}" data-choice="pending">撤回表态</button></div>`:blocked?`<p class="hint">未入选：${esc(r.reasons.join('、'))}</p>`:''}
  <details class="candidate-editor"><summary>编辑虚构候选信息</summary><label for="price-${r.id}">最高人均（元）；未知留空，保存使旧表态失效</label><input id="price-${r.id}" type="number" min="1" max="10000" value="${esc(r.max)}"><button data-action="price" data-id="${r.id}">保存候选</button></details></article>`;
}
function collect(){const m=s?.members.find(m=>m.id===role);if(!m||!$('raw'))return;m.raw=$('raw').value;m.draft={budget:$('budget').value,district:$('district').value,noSpicy:$('noSpicy').checked,exclude:$('exclude').value,prefer:$('prefer').value,softNoSpicy:$('softNoSpicy').checked};persist();}
$('app').addEventListener('input',e=>{if(['raw','budget','district','noSpicy','exclude','prefer','softNoSpicy'].includes(e.target.id))collect();});
$('app').addEventListener('click',e=>{
  const b=e.target.closest('button[data-action]');if(!b)return;
  if(b.dataset.action==='start'){start();return;}if(expire()||!s)return;
  const {action,id,choice}=b.dataset;collect();const m=s.members.find(m=>m.id===role);
  try{
    let announce='';
    if(action==='role'){role=id;understanding=null;note='';render();$('editor-title').focus();return;}
    if(action==='manual'){$('budget').focus();return;}
    if(action==='example'){m.raw=id==='budget'?'预算别太高，最好在约定的商圈里。':'没有特别想吃的，你们选就行。';note='示例已填入。点击模拟整理，或直接手动填写。';understanding=null;}
    if(action==='understand'||action==='fail'){
      understanding=simulateUnderstanding(m.raw,s.candidates,action==='fail');m.draft=understanding.draft;note=understanding.notes.join(' ')||'模拟草稿已填入。请核对后再确认，不会自动提交。';
    }
    if(action==='submit'){const changed=submit(s,role,m.draft);if(changed){s.completedAt=null;if(recommend(s).ready)s.metrics.recommendations++;}announce=changed?'已确认条件，已重新检查候选。':'条件未变化，保留当前表态。';note='';}
    if(action==='vote'){const changed=vote(s,role,id,choice);if(changed){s.completedAt=decision(s)?Date.now():null;}announce=decision(s)?'全员已确认同一方案，这餐定了。':choice==='no'?'已记录暂不接受。可以修改自己的条件，再请大家重新确认。':'表态已记录，请切换其他演示角色继续。';}
    if(action==='member'){toggleMember(s,id);s.completedAt=null;announce='成员有变化，旧表态全部失效。';}
    if(action==='price'){editCandidate(s,id,$('price-'+id).value);s.completedAt=null;announce='候选已检查；信息变化时旧表态全部失效。';}
    if(action==='add'){addCandidate(s);s.completedAt=null;announce='已补充虚构候选，未知信息如实保留。';}
    if(action==='conflict'){const c=s.members.find(m=>m.id==='c');if(!c.active)toggleMember(s,'c');submit(s,'c',{...c.conditions,budget:40});role='c';note='演示情景：小满主动确认了人均上限 40 元。你可以自愿改回 120 元或留空，再确认；系统不会自动放宽。';understanding=null;s.completedAt=null;announce='已载入无交集情景，请尝试调整条件。';}
    if(action==='recheck'){if(recommend(s).ready)s.metrics.recommendations++;announce=recommend(s).ready?'已按当前条件重新检查。':recommend(s).message;}
    persist();render();if(announce)message(announce);
  }catch(err){note=err.message;persist();render();message(err.message);}
});
$('quick').addEventListener('click',()=>{if(!s)start();else{$('editor-title')?.focus();$('editor-title')?.scrollIntoView({behavior:'auto',block:'start'});message('已回到当前演示。若要重开，请先删除本地演示。');}});
$('real').addEventListener('click',()=>{const show=$('real-info').hidden;$('real-info').hidden=!show;$('real').setAttribute('aria-expanded',String(show));});
$('delete').addEventListener('click',()=>{s=null;try{localStorage.removeItem(KEY);}catch{}emptyReason='deleted';render();message('本地演示已删除，没有服务端记录。');});
setInterval(expire,15000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)expire();});
render();if(!storageOk)message('浏览器存储不可用，刷新可能丢失内容。');
