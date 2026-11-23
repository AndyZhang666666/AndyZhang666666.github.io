import {wallet,quote,reserve,transition,advance,receipt,spentBy} from './ledger.mjs';
import {startPage,t,escapeText as esc,download} from '../ui.mjs';
const $=id=>document.getElementById(id),num=id=>$(id).value.trim()===''?NaN:Number($(id).value);
let state=wallet(),who='director',count=3,unit=12,msg='',setup=false;
const whoName=k=>k==='director'?t('导演','Director'):t('剪辑师','Editor');
const stateName=k=>({held:t('已预留','Reserved'),done:t('已结算','Settled'),failed:t('失败','Failed'),cancelled:t('已取消','Cancelled')})[k];
const issue=k=>({invalid:t('请输入有效的整数和日期。','Enter valid integers and dates.'),cap:t('超过成员可用额度。','Over the member limit.'),funds:t('团队可用积分不足。','Insufficient team credits.'),date:t('工作日期只能向前推进。','The work date can only move forward.')})[k]||k;
const field=(id,label,value,min=0,max=1000000)=>'<label>'+label+'<input id="'+id+'" type="number" min="'+min+'" max="'+max+'" step="1" value="'+esc(value)+'"></label>';
const asFile=(name,obj)=>download(name,JSON.stringify(obj,null,2),'application/json');
function drawQuote(){
 let q;
 try{q=quote(state,who,count,unit);}catch{}
 $('quote').innerHTML=q?'<div class="quote-total"><small>'+t('生成前报价','Preflight quote')+'</small><strong>'+q.total+' <i>CR</i></strong></div><p>'+whoName(who)+' · '+q.count+' × '+q.unit+'</p><div class="money-line"><span>'+t('优先使用限时积分','Expiring credits first')+'</span><b>'+q.gift+'</b></div><div class="money-line"><span>'+t('所需长期积分','Regular credits needed')+'</span><b>'+q.paid+'</b></div><p>'+ (q.gates.length?q.gates.map(issue).join(' '):t('团队余额与成员额度均足够。','Within both team balance and member limit.'))+'</p>':'<p>'+issue('invalid')+'</p>';
 $('hold').disabled=!q||!!q.gates.length;$('saveQuote').disabled=!q;
}
function render(){
 const r=receipt(state),all=state.batches.flatMap(b=>b.shots),opts=['director','editor'].map(k=>'<option value="'+k+'" '+(k===who?'selected':'')+'>'+whoName(k)+'</option>').join('');
 $('app').innerHTML='<div class="work-layout"><aside class="tools"><h2>'+t('制作批次','Production batch')+'</h2><label>'+t('负责人','Owner')+'<select id="who">'+opts+'</select></label>'+field('count',t('镜头数量','Shots'),count,1,50)+field('unit',t('每镜头积分','Credits per shot'),unit,1,10000)+'<details id="setup" '+(setup?'open':'')+'><summary>'+t('团队预算与日期','Team budget and date')+'</summary>'+
 (!all.length?field('paid',t('长期积分','Regular credits'),state.paid)+field('gift',t('限时积分','Expiring credits'),state.gift)+field('director',whoName('director')+' · '+t('限额','limit'),state.caps.director)+field('editor',whoName('editor')+' · '+t('限额','limit'),state.caps.editor)+'<label>'+t('限时积分最后有效日','Last valid day')+'<input type="date" id="expiry" value="'+state.expiry+'"></label><button id="apply">'+t('应用预算','Apply budget')+'</button>':'')+
 '<label>'+t('当前工作日','Work date')+'<input id="day" type="date" min="'+state.day+'" value="'+state.day+'"></label><button id="advance">'+t('推进日期','Advance date')+'</button></details><p id="msg" role="status">'+esc(msg)+'</p></aside><div class="surface"><section class="receipt"><div class="receipt-head"><span>PRODUCTION ACCOUNTS</span><time>'+state.day+'</time></div><div id="quote" aria-live="polite"></div><div class="actions"><button class="primary" id="hold">'+t('确认报价并预留','Confirm & reserve')+'</button><button id="saveQuote">'+t('下载报价','Save quote')+' ↓</button></div></section><section class="ledger"><h2>'+t('团队账本','Team ledger')+'</h2><div class="metrics">'+[[state.paid+state.gift,t('可用积分','Available')],[r.held,t('已预留','Reserved')],[r.charged,t('实际结算','Settled')]].map(([n,l])=>'<div><strong>'+n+'</strong>'+l+'</div>').join('')+'</div><p>'+t('限时积分余量','Expiring balance')+' '+state.gift+' · '+t('到期作废','Expired')+' '+state.expired+' · '+whoName(who)+' '+spentBy(state,who)+' / '+state.caps[who]+'</p><div id="shots">'+
 all.map(s=>'<div class="shot-row"><div><b>'+t('镜头','Shot')+' '+s.id+'</b><small>'+whoName(s.who)+' · '+s.unit+' CR · '+stateName(s.state)+' · '+t('尝试','Attempt')+' '+s.attempt+'</small></div><div>'+ (s.state==='held'?[['done',t('成功','Settle')],['failed',t('失败','Fail')],['cancelled',t('取消','Cancel')]]:s.state==='failed'?[['retry',t('重试','Retry')]]:[]).map(([k,l])=>'<button data-shot="'+s.id+'" data-action="'+k+'">'+l+'</button>').join('')+'</div></div>').join('')+'</div>'+
 (state.log.length?'<details><summary>'+t('逐笔记录','Itemized transactions')+'</summary><ol>'+state.log.map(e=>'<li>'+e.day+' · '+e.id+' · '+whoName(e.member)+' · '+(e.action==='hold'?t('预留','Reserved')+' '+(e.gift+e.paid):e.action==='done'?t('扣款','Charged')+' '+e.charged:t('退回','Returned')+' '+(e.returnedGift+e.returnedPaid)+' / '+t('过期','Expired')+' '+e.expired)+'</li>').join('')+'</ol></details><button id="receipt">'+t('导出逐镜头对账单','Export itemized ledger')+' ↓</button>':'<p>'+t('确认第一笔预留后，可逐镜头结算、取消或重试。','Reserve a batch to settle, cancel or retry individual shots.')+'</p>')+'</section></div></div>';
 function apply(fn){try{state=fn();msg='';}catch(e){msg=e.message.split('+').map(issue).join(' ');}render();}
 $('setup').ontoggle=e=>{setup=e.target.open;};
 $('who').onchange=e=>{who=e.target.value;render();};
 ['unit','count'].forEach(id=>$(id).oninput=()=>{unit=num('unit');count=num('count');drawQuote();});
 $('apply')?.addEventListener('click',()=>apply(()=>wallet({paid:num('paid'),gift:num('gift'),expiry:$('expiry').value,day:$('day').value,caps:{director:num('director'),editor:num('editor')}})));
 $('advance').onclick=()=>apply(()=>advance(state,$('day').value));
 $('hold').onclick=()=>apply(()=>reserve(state,who,count,unit));
 $('saveQuote').onclick=()=>asFile('preflight-quote.json',{units:'example credits',kind:'estimate',...quote(state,who,count,unit)});
 $('receipt')?.addEventListener('click',()=>asFile('production-ledger.json',receipt(state)));
 $('shots').querySelectorAll('button').forEach(b=>b.onclick=()=>apply(()=>transition(state,b.dataset.shot,b.dataset.action)));
 drawQuote();
}
startPage(render);
