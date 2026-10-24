import {createSession,blank,simulateUnderstanding,submit,recommend,vote,decision,toggleMember,updateCandidate,addCandidate,addMember,restore} from './engine.mjs?v=20261024-v2';
import {voluntaryPlans,prepareVoluntaryDraft,previewConditions,informationGaps,buildDecision,decisionText} from './product.mjs?v=20261024-v2';
const KEY='suibianju-demo-v1';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let s=null,role='a',note='',understanding=null,storageOk=true,emptyReason='',preview=null;
try{const loaded=restore(localStorage.getItem(KEY));s=loaded.session;emptyReason=loaded.reason;if(!s)localStorage.removeItem(KEY);}catch{storageOk=false;}
function persist(){if(!s)return;try{localStorage.setItem(KEY,JSON.stringify(s));}catch{storageOk=false;message('浏览器存储不可用，当前可继续体验，但刷新可能丢失。');}}
function message(t){$('toast').textContent=t;}
function start(){s=createSession();role='a';understanding=null;note='';preview=null;persist();render();message('先替小林说一句想法并确认；另外两位已有虚构条件。之后可切换角色，逐人表态。');$('editor-title')?.focus();}
function expire(){if(s&&s.expiresAt<=Date.now()){s=null;try{localStorage.removeItem(KEY);}catch{}emptyReason='expired';render();message('演示已到期，本地记录已清除。可以重新开始。');return true;}return false;}
function money(r){return Number.isFinite(r.min)&&Number.isFinite(r.max)?`¥${r.min}–${r.max} / 人`:Number.isFinite(r.max)?`最高 ¥${r.max} / 人`:'人均未知';}
function options(values,current,empty){return `<option value="">${empty}</option>`+values.map(v=>`<option ${v===current?'selected':''}>${esc(v)}</option>`).join('');}
function summary(c){return `必须满足：${[c.budget!==null?`人均最高 ${c.budget} 元`:'',c.district?`${esc(c.district)}`:'',c.noSpicy?'需提供无辣':'' ].filter(Boolean).join('、')||'未设置'}。<br>尽量满足：${[esc(c.prefer),c.softNoSpicy?'无辣':''].filter(Boolean).join('、')||'未设置'}。<br>明确排除：${esc(c.exclude)||'未设置'}。`;}
function render(){
  if(!s){$('app').innerHTML=`<section class="empty"><h2>${emptyReason==='expired'?'这场演示已到期':emptyReason==='deleted'?'本地演示已删除':emptyReason==='corrupt'?'本地记录无法恢复，已清除':'今晚，先把条件摊开。'}</h2><p>同一句「随便」，背后可能是三种不同的顾虑。</p><div class="opening-table"><div><strong>小林</strong><p>“我都行，但今天不想吃辣。”</p><span>还需要本人确认</span></div><div><strong>阿禾</strong><p>“别选烤肉，其他可以商量。”</p><span>虚构条件已备好</span></div><div><strong>小满</strong><p>“120 元以内，就在中山路吧。”</p><span>虚构条件已备好</span></div></div><p class="hint">点击上方「开始快速体验」，先确认条件，再逐人表态。不会用多数票替少数人做决定。</p></section>`;return;}
  const m=s.members.find(m=>m.id===role),d=m.draft,result=recommend(s),final=decision(s),active=s.members.filter(m=>m.active);
  const title=final?`已确定：${final.name}`:!result.ready?'先收齐大家的条件':!result.feasible.length?'还没有大家都能接受的一餐':`有 ${result.feasible.length} 个共同可行方案`;
  const plans=voluntaryPlans(s,role),gaps=informationGaps(s);
  $('app').innerHTML=`<section class="session-head"><div><h2 class="status-title ${final?'good':result.ready&&!result.feasible.length?'conflict':''}">${esc(title)}</h2><p class="muted">虚构饭局 · 周五晚餐 · ${active.filter(m=>m.confirmed).length}/${active.length} 人已确认条件 · 第 ${s.version} 版</p></div><small>本地保留至 ${new Date(s.expiresAt).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}</small></section>
  <ol class="journey" aria-label="当前饭局进度"><li class="${!result.ready?'current':''}">说清条件</li><li class="${result.ready&&!final?'current':''}">比较与协商</li><li class="${final?'current':''}">共同确认，带走决定</li></ol>
  <section aria-label="演示角色切换" class="people">${s.members.map(p=>`<div class="person ${p.id===role?'active':''}"><div><strong>${esc(p.name)}</strong><span>${!p.active?'已退出':p.confirmed?'条件已确认':'待确认条件'}</span></div><button data-action="role" data-id="${p.id}" aria-pressed="${p.id===role}">${p.id===role?'当前角色':'切换体验'}</button></div>`).join('')}</section>
  <details class="group-settings"><summary>体验 4–5 人协商</summary><label for="new-member">新模拟朋友的名字</label><div class="actions"><input id="new-member" maxlength="20" placeholder="仅使用虚构名字"><button data-action="add-member" ${s.members.length>=5?'disabled':''}>加入模拟朋友</button></div><p class="hint">新成员需要自己确认条件和表态；加入会使旧确认失效。没有真实邀请或跨设备同步。</p></details>
  <div class="workspace"><section class="editor" aria-labelledby="editor-title"><div class="section-top"><h2 id="editor-title" tabindex="-1">${esc(m.name)}的条件</h2><small>只是在切换演示角色</small></div>
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
  <div class="actions"><button data-action="preview">先预演草稿的影响</button><button class="primary" data-action="submit">${m.confirmed?'确认修改并重新检查':'确认条件，看看能吃什么'}</button><button data-action="member" data-id="${m.id}">退出演示饭局</button></div>
  ${preview?`<div class="draft-preview" role="status"><h3>预演，不是已确认结果</h3><p>${preview.ready?`当前展示 ${preview.before.length} 个共同候选，按这份草稿将展示 ${preview.after.length} 个：${preview.after.map(r=>esc(r.name)).join('、')||'仍无交集'}。`:esc(preview.message)}</p><p>${preview.invalidatesVotes?'若确认，全部旧表态将失效，大家需要重新接受。':preview.changed?'只有点击确认，才会改动当前饭局。':'草稿与已确认条件相同，不会清空已有表态。'}</p><p class="hint">原条件和表态没有变化；继续编辑后，请重新预演。</p></div>`:''}`}</section>
  <section class="results" aria-labelledby="results-title"><div class="section-top"><h2 id="results-title" tabindex="-1">公共候选与决定</h2><small>全部为虚构餐厅</small></div><p class="hint">只展示必要取舍，不把排除原因归到具体的人。筛选用预算区间上界；相关信息未知时，不算满足硬条件。</p>
  ${s.invalidated&&!final?'<p class="hint"><strong>条件、成员或候选有变化，旧表态已失效。</strong>请按当前版本重新确认。</p>':''}
  ${!result.ready?`<div class="helper">${result.message}</div>`:!result.feasible.length?`<div class="conflict-box"><h3>没有共同可行候选</h3><p>涉及：${esc([...new Set(result.blocked.flatMap(r=>r.reasons))].join('、'))}。</p><p>请成员自愿调整自己的条件，或补充并核实候选。系统不会放宽硬条件，也不会编造新餐厅。</p></div>`:''}
  ${result.ready&&!result.feasible.length?`<section class="negotiation"><h3>不替你妥协，先看看下一步</h3>${plans.length?`<p>以下仅针对当前角色「${esc(m.name)}」，按预算增加最少排序。不触碰忌口、位置与排除菜系。</p>${plans.map(p=>`<div class="proposal"><strong>${esc(p.name)}</strong><p>你的上限 ¥${p.from} → ¥${p.to}（增加 ¥${p.delta}），其余已确认条件不变即可出现此候选。</p><button data-action="prepare-plan" data-id="${esc(p.id)}" data-version="${p.version}">只填入我的草稿，先预演</button></div>`).join('')}`:'<p>没有仅调整你本人预算就能解决的候选。可以补充信息，或切换其他模拟角色，由其本人查看自愿调整的可能；不是要求任何人让步。</p>'}${gaps.length?`<p class="hint">也可以先补信息：${gaps.map(g=>`${esc(g.name)}（${esc(g.missing.join('、'))}）`).join('；')}。补齐不代表一定符合其他条件。</p>`:''}</section>`:''}
  ${final?`<section class="decision-receipt" aria-label="共同决定单"><p class="receipt-state">共同确认完成 · 第 ${s.version} 版</p><h3>${esc(final.name)}</h3><p>${money(final)} · ${esc(final.district)||'商圈待核实'}</p><p>${active.length} 位模拟成员明确接受同一候选。当前已确认的硬条件全部通过。</p><div class="actions"><button data-action="copy-decision">复制决定单</button><button data-action="download-decision">下载决定单</button></div><p class="hint">这是模拟决定，不是预订凭证。行动前核实真实价格、营业、餐食及座位；不会导出个人原话或逐人条件。</p></section>`:''}
  ${(result.ready?result.feasible:s.candidates).map(r=>card(r,result.ready,final)).join('')}
  ${result.ready&&result.blocked.length?`<details class="blocked"><summary>查看 ${result.blocked.length} 个未入选候选及必要原因</summary>${result.blocked.map(r=>card(r,false,null,true)).join('')}</details>`:''}
  <div class="tools"><button data-action="conflict">体验一次无交集</button><button data-action="add">补充虚构候选</button><button data-action="recheck">重新检查候选</button></div><p class="hint">无交集按钮会给小满设定“人均上限 40 元”的演示硬条件，并使旧表态失效。</p></section></div>
  <details class="metrics"><summary>查看这次模拟的过程记录</summary><div class="numbers"><div><b>${s.metrics.recommendations}</b><span>生成 / 重新检查</span></div><div><b>${s.metrics.rejections}</b><span>暂不接受</span></div><div><b>${s.metrics.changes}</b><span>已确认条件修改</span></div><div><b id="elapsed">${s.startedAt?Math.max(0,Math.floor(((final?s.completedAt||Date.now():Date.now())-s.startedAt)/1000))+' 秒':'尚未开始'}</b><span>当前版本共同确认计时${final?' · 已停止':''}</span></div></div><p class="hint">只计本机操作，不上传分析日志；不是实际用户数据，也不证明决策效率提升。条件变化重新计时。</p></details>`;
}
function card(r,canVote,final,blocked=false){
  const yes=s.members.filter(m=>m.active&&s.votes[m.id]?.version===s.version&&s.votes[m.id]?.candidate===r.id&&s.votes[m.id]?.choice==='yes').length;
  const current=s.votes[role],is=(v)=>current?.candidate===r.id&&current.choice===v&&current.version===s.version;
  const no=Object.values(s.votes).some(v=>v.version===s.version&&v.candidate===r.id&&v.choice==='no');
  return `<article class="card" data-candidate="${r.id}"><div class="card-head"><h3>${esc(r.name)}</h3><span class="price">${money(r)}</span></div><p class="meta">${esc(r.cuisine)||'菜系未知'} · ${esc(r.district)||'商圈未知'} · ${r.noSpicy===true?'提供无辣':r.noSpicy===false?'不提供无辣':'无辣情况未知'}</p>
  ${canVote?`<p class="reason">满足当前全部已确认硬条件。${r.likes?'兼顾了部分成员的软偏好；其他软偏好仍需取舍。':'软偏好未形成优先项，可由大家选择。'}</p><p class="tally">${final?.id===r.id?'全员已接受 · 这餐定了':`${yes}/${s.members.filter(m=>m.active).length} 人接受${no?' · 有人暂不接受，请继续协商':''}`}</p><div class="actions"><button data-action="vote" data-id="${r.id}" data-choice="yes" aria-pressed="${is('yes')}">接受此方案</button><button data-action="vote" data-id="${r.id}" data-choice="no" aria-pressed="${is('no')}">暂不接受</button><button data-action="vote" data-id="${r.id}" data-choice="pending">撤回表态</button></div>`:blocked?`<p class="hint">未入选：${esc(r.reasons.join('、'))}</p>`:''}
  ${canVote&&!final&&is('yes')?`<div class="next-person"><button data-action="next-voter" data-id="${r.id}">切到下一位，继续表态</button><span class="hint">不替任何人接受。</span></div>`:''}
  <details class="candidate-editor"><summary>编辑虚构候选信息</summary><p>仅用于虚构数据。保存变化会清除旧表态；未知请留空。</p><label for="name-${r.id}">候选名称</label><input id="name-${r.id}" maxlength="40" value="${esc(r.name)}"><div class="fields"><div><label for="cuisine-${r.id}">菜系</label><select id="cuisine-${r.id}">${options(['家常菜','粤菜','烤肉','面食'],r.cuisine,'未知')}</select></div><div><label for="area-${r.id}">商圈</label><select id="area-${r.id}">${options(['中山路','河西'],r.district,'未知')}</select></div><div><label for="min-${r.id}">最低人均（元）</label><input id="min-${r.id}" type="number" min="1" max="10000" value="${esc(r.min)}"></div><div><label for="price-${r.id}">最高人均（元）</label><input id="price-${r.id}" type="number" min="1" max="10000" value="${esc(r.max)}"></div></div><label for="spicy-${r.id}">是否提供无辣餐食</label><select id="spicy-${r.id}">${options(['提供','不提供'],r.noSpicy===null?'':r.noSpicy?'提供':'不提供','未知')}</select><div class="actions"><button data-action="price" data-id="${r.id}">保存候选</button></div></details></article>`;
}
function collect(){const m=s?.members.find(m=>m.id===role);if(!m||!$('raw'))return;m.raw=$('raw').value;m.draft={budget:$('budget').value,district:$('district').value,noSpicy:$('noSpicy').checked,exclude:$('exclude').value,prefer:$('prefer').value,softNoSpicy:$('softNoSpicy').checked};persist();}
$('app').addEventListener('input',e=>{if(['raw','budget','district','noSpicy','exclude','prefer','softNoSpicy'].includes(e.target.id)){collect();preview=null;document.querySelector('.draft-preview')?.remove();}});
$('app').addEventListener('click',e=>{
  const b=e.target.closest('button[data-action]');if(!b)return;
  if(b.dataset.action==='start'){start();return;}if(expire()||!s)return;
  const {action,id,choice}=b.dataset;collect();const m=s.members.find(m=>m.id===role);
  try{
    let announce='';
    if(action==='role'){role=id;understanding=null;note='';preview=null;render();$('editor-title').focus();return;}
    if(action==='preview'){preview=previewConditions(s,role,m.draft);announce='预演完成；已确认条件和表态均未改变。';}
    if(action==='prepare-plan'){m.draft=prepareVoluntaryDraft(s,role,id,Number(b.dataset.version));preview=previewConditions(s,role,m.draft);note='只将预算填入了你的草稿，其他草稿保留。预演计算全部未确认修改；仍需由你点击确认。';announce='建议已填入草稿，尚未修改饭局条件。';}
    if(action==='add-member'){role=addMember(s,$('new-member').value);preview=null;understanding=null;note='请这位模拟朋友确认自己的条件，所有人随后重新表态。';announce='加入了新模拟成员，旧表态已失效。';}
    if(action==='next-voter'){const next=s.members.find(p=>p.active&&p.id!==role&&!(s.votes[p.id]?.version===s.version&&s.votes[p.id]?.candidate===id&&s.votes[p.id]?.choice==='yes'));if(next){role=next.id;preview=null;note='';understanding=null;announce=`现在由${next.name}自行表态；未代其做任何选择。`;}else announce='当前没有下一位待接受成员，请检查各自表态。';}
    if(action==='download-decision'||action==='copy-decision'){
      const text=decisionText(s);buildDecision(s);
      if(action==='copy-decision'&&navigator.clipboard){navigator.clipboard.writeText(text).then(()=>message('决定单已复制，只含公共决定与核实提醒。')).catch(()=>message('浏览器未允许复制；请使用“下载决定单”。'));return;}
      const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='随便局-共同决定.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);announce='已下载模拟决定单，不含个人原话或逐人条件。';
    }
    if(action==='manual'){$('budget').focus();return;}
    if(action==='example'){m.raw=id==='budget'?'预算别太高，最好在约定的商圈里。':'没有特别想吃的，你们选就行。';note='示例已填入。点击模拟整理，或直接手动填写。';understanding=null;}
    if(action==='understand'||action==='fail'){
      preview=null;
      understanding=simulateUnderstanding(m.raw,s.candidates,action==='fail');m.draft=understanding.draft;note=understanding.notes.join(' ')||'模拟草稿已填入。请核对后再确认，不会自动提交。';
    }
    if(action==='submit'){const changed=submit(s,role,m.draft);preview=null;if(changed){s.completedAt=null;if(recommend(s).ready)s.metrics.recommendations++;}announce=changed?'已确认条件，已重新检查候选。':'条件未变化，保留当前表态。';note='';}
    if(action==='vote'){const changed=vote(s,role,id,choice);if(changed){s.completedAt=decision(s)?Date.now():null;}announce=decision(s)?'全员已确认同一方案，这餐定了。':choice==='no'?'已记录暂不接受。可以修改自己的条件，再请大家重新确认。':'表态已记录，请切换其他演示角色继续。';}
    if(action==='member'){toggleMember(s,id);s.completedAt=null;announce='成员有变化，旧表态全部失效。';}
    if(action==='price'){const value=$('spicy-'+id).value;const changed=updateCandidate(s,id,{name:$('name-'+id).value,cuisine:$('cuisine-'+id).value,district:$('area-'+id).value,min:$('min-'+id).value,max:$('price-'+id).value,noSpicy:value===''?null:value==='提供'});if(changed)s.completedAt=null;announce='候选已检查；信息变化时旧表态全部失效。';}
    if(action==='add'){addCandidate(s);s.completedAt=null;announce='已补充虚构候选，未知信息如实保留。';}
    if(action==='conflict'){const c=s.members.find(m=>m.id==='c');if(!c.active)toggleMember(s,'c');submit(s,'c',{...c.conditions,budget:40});role='c';note='演示情景：小满主动确认了人均上限 40 元。你可以自愿改回 120 元或留空，再确认；系统不会自动放宽。';understanding=null;s.completedAt=null;announce='已载入无交集情景，请尝试调整条件。';}
    if(action==='recheck'){if(recommend(s).ready)s.metrics.recommendations++;announce=recommend(s).ready?'已按当前条件重新检查。':recommend(s).message;}
    if(preview&&preview.version!==s.version)preview=null;
    if(action==='conflict'||action==='example'||action==='member')preview=null;
    persist();render();if(announce)message(announce);if(action==='submit'&&innerWidth<=600&&recommend(s).ready)$('results-title').scrollIntoView({block:'start'});
  }catch(err){note=err.message;persist();render();message(err.message);}
});
$('quick').addEventListener('click',()=>{if(!s)start();else{$('editor-title')?.focus();$('editor-title')?.scrollIntoView({behavior:'auto',block:'start'});message('已回到当前演示。若要重开，请先删除本地演示。');}});
$('real').addEventListener('click',()=>{const show=$('real-info').hidden;$('real-info').hidden=!show;$('real').setAttribute('aria-expanded',String(show));});
$('delete').addEventListener('click',()=>{s=null;try{localStorage.removeItem(KEY);}catch{}emptyReason='deleted';render();message('本地演示已删除，没有服务端记录。');});
setInterval(()=>{expire();const timer=$('elapsed');if(timer&&s?.startedAt){const end=decision(s)?s.completedAt||Date.now():Date.now();timer.textContent=Math.max(0,Math.floor((end-s.startedAt)/1000))+' 秒';}},1000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)expire();});
render();if(!storageOk)message('浏览器存储不可用，刷新可能丢失内容。');
