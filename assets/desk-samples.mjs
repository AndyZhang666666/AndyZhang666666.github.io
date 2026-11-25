import {search, compare, dishes, originalQueries, modes} from '../studio/menu/search.mjs';
import {wallet, quote, reserve, advance, transition, receipt} from '../studio/credits/ledger.mjs';
import {escapeText as esc} from '../studio/ui.mjs';

const choose = english => (zh,en) => english ? en : zh;
const dishName = (id,en) => dishes.find(d=>d.id===id)?.[en?'en':'zh'] || (en?'No result':'无结果');
const button = (action,copy,extra='')=>'<button type="button" data-desk-act="'+action+'" '+extra+'>'+esc(copy)+'</button>';
const ruleNames = {literal:['按原词','Exact terms'],alias:['加拼写别名','Spelling aliases'],wide:['放宽到同类','Include the category']};
export const initialMenu = () => ({query:originalQueries[0].q,rule:'literal',example:0,used:false});
export function menuResult(state) {
  const matches=search(dishes,state.query,state.rule);
  const baseline=state.rule==='wide'?'alias':'literal';
  const changes=compare(dishes,originalQueries,baseline,state.rule);
  return {first:matches[0]?.dish,won:changes.filter(r=>r.status==='won'),lost:changes.filter(r=>r.status==='lost')};
}

export function menuSheet(state=initialMenu(),en=false) {
  const t=choose(en),result=menuResult(state), first=result.first;
  const list=result.lost.length?result.lost:result.won;
  const row=list[state.example%Math.max(1,list.length)];
  return '<div class="desk-menu"><div class="desk-menu-input"><form data-menu-form><label for="print-menu-query">'+t('试搜一道菜','Search the menu')+'</label><div class="desk-query"><input id="print-menu-query" name="query" type="search" required maxlength="100" dir="auto" value="'+esc(state.query)+'"><button>'+t('查找','Search')+'</button></div></form><div class="desk-rules" role="group" aria-label="'+t('搜索规则','Search rule')+'">'+modes.map(key=>button(key,t(...ruleNames[key]),'aria-pressed="'+(state.rule===key)+'"')).join('')+'</div><p class="desk-note">'+t('同一份双语菜单，18 条带正确菜名的示例查询。','One bilingual menu, 18 example queries with known dishes.')+'</p></div>'+
    '<div class="desk-menu-slip"><span class="desk-small">'+t('菜单第一位','First result')+'</span><strong data-menu-first="'+esc(first?.id||'')+'">'+esc(first?dishName(first.id,en):t('没找到这道菜','No matching dish'))+'</strong>'+
    '<span class="desk-arabic" lang="ar" dir="rtl">'+esc(first?.ar||'—')+'</span><p>'+esc(first?(en?first.zh:first.en):t('试试「加拼写别名」，再看同一条查询。','Try spelling aliases with the same query.'))+'</p></div></div>'+
    '<div class="desk-group-review"><div><b>'+t('同批查询，对照上一种规则','Same queries, compared with the previous rule')+'</b><output data-menu-score aria-live="polite">'+t('找回 ','Recovered ')+result.won.length+t(' 条 · 错排 ',' · Regressed ')+result.lost.length+'</output></div>'+
    (row?'<div class="desk-row-example"><code>'+esc(row.q)+'</code><span>'+esc(dishName(row.before[0],en))+' → '+esc(dishName(row.after[0],en))+'</span><small>'+t('正确菜名','Expected')+' · '+esc(dishName(row.expected,en))+'</small>'+
      (list.length>1?button('next-example',t('翻看下一条','Next example')):'')+'</div>':'')+'</div>'+
    (state.used?'<div class="desk-ticket-action">'+button('ticket',t('保存搜索票根 ↓','Save search ticket ↓'))+'</div>':'');
}

export const initialBill = () => ({step:0,shot:2,late:true,selected:2});
export function billResult(state) {
  let w=wallet();
  const estimate=quote(w,'director',3,12);
  if(state.step>0)w=reserve(w,'director',3,12,'cover-take');
  if(state.step===2){
    if(state.late)w=advance(w,'2026-11-25');
    for(let i=1;i<=3;i++)w=transition(w,'1-'+i,i===state.shot?'failed':'done');
  }
  return {estimate,...receipt(w)};
}
export function eventCopy(event,en) {
  const t=choose(en);
  if(event.action==='hold')return t('预留 ','Held ')+(event.gift+event.paid)+t(' 分',' credits');
  if(event.action==='done')return t('实扣 ','Charged ')+event.charged+t(' 分',' credits');
  return t('退回 ','Returned ')+(event.returnedGift+event.returnedPaid)+t(' 分，过期 ',' credits, expired ')+event.expired+t(' 分',' credits');
}

export function billSheet(state=initialBill(),en=false) {
  const t=choose(en),b=billResult(state),rows=state.step?b.batches[0].shots:[];
  const failSelect='<label>'+t('失败镜头','Failed shot')+'<select data-bill-shot>'+[1,2,3].map(n=>'<option value="'+n+'" '+(state.shot===n?'selected':'')+'>'+t('镜头 ','Shot ')+n+'</option>').join('')+'</select></label>';
  const expire='<label>'+t('结算时间','Settlement')+'<select data-bill-day><option value="late" '+(state.late?'selected':'')+'>'+t('赠分到期后','After gift expiry')+'</option><option value="early" '+(!state.late?'selected':'')+'>'+t('赠分有效期内','Before gift expiry')+'</option></select></label>';
  const amount=(label,value)=>'<div><dt>'+label+'</dt><dd>'+value+'</dd></div>';
  return '<div class="desk-bill"><div class="desk-bill-order"><span class="desk-small">'+t('三镜头制作单 · 模拟积分','Three-shot order · Sample credits')+'</span><p class="bill-multiply">3 <i>×</i> 12 <i>=</i> <b>'+b.estimate.total+'</b></p><p>'+t('团队账户有 18 赠分、90 付费分。每个镜头先预留 12 分，优先用赠分。','The team has 18 gift and 90 paid credits. Hold 12 per shot, using gifts first.')+'</p>'+
    (state.step===0?button('reserve',t('为三个镜头预留','Reserve three shots')):state.step===1?'<div class="bill-config">'+failSelect+expire+'</div>'+button('settle',t('模拟失败并结算','Fail one shot and settle')):button('reset-bill',t('再试一笔','Start another bill')))+'</div>'+
    '<div class="desk-receipt"><span class="desk-small">'+t('生成小票','Production receipt')+'</span><dl class="bill-totals">'+amount(t('预留中','On hold'),b.held)+amount(t('已实扣','Charged'),b.charged)+amount(t('退回','Returned'),b.events.reduce((n,e)=>n+(e.returnedPaid||0)+(e.returnedGift||0),0))+amount(t('已过期','Expired'),b.expired)+'</dl>'+
    (rows.length?'<div class="bill-shots">'+rows.map((s,i)=>button('shot-'+(i+1),t('镜头 ','Shot ')+(i+1)+' · '+({held:t('已预留','Held'),done:t('完成','Done'),failed:t('失败','Failed')}[s.state]),'aria-pressed="'+(state.selected===i+1)+'"')).join('')+'</div>'+
      '<ol class="bill-events" data-bill-events aria-live="polite">'+b.events.filter(e=>e.id==='1-'+state.selected).map(e=>'<li><small>'+e.day+'</small> '+esc(eventCopy(e,en))+'</li>').join('')+'</ol>':'<p>'+t('预留后可逐行对账。','Reserve the shots to inspect each entry.')+'</p>')+'</div></div>'+
    (state.step?'<div class="desk-ticket-action">'+button('ticket',t('保存积分票根 ↓','Save credit ticket ↓'))+'</div>':'');
}

export function sampleTicket(kind,state,en=false) {
  const t=choose(en),menu=kind==='menu',title=menu?t('菜单搜索票根','Menu search ticket'):t('制作积分票根','Production credit ticket');
  let lines=[];
  if(menu){
    const {first,won,lost}=menuResult(state);
    lines=[state.query,t(...ruleNames[state.rule]),t('首位','First result')+' · '+dishName(first?.id,en),
      t('找回','Recovered')+' '+won.length+' / '+t('错排','Regressed')+' '+lost.length,
      ...[...lost,...won].map(r=>r.q+' · '+dishName(r.before[0],en)+' → '+dishName(r.after[0],en))];
  }else{
    const b=billResult(state);
    lines=[t('每镜头 12 分，共 3 个镜头','3 shots at 12 credits each'),t('预留 / 实扣 / 过期','Held / charged / expired')+' · '+[b.held,b.charged,b.expired].join(' / '),
      ...b.events.map(e=>e.day+' · '+t('镜头 ','Shot ')+e.id.split('-')[1]+' · '+eventCopy(e,en))];
  }
  const url='https://andyzhang666666.github.io/studio/'+(menu?'menu':'credits')+'/'+(en?'?lang=en':'');
  return '<!doctype html><html lang="'+(en?'en':'zh-CN')+'"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+title+'</title><style>html{background:#e6dfce;color:#201d1a;font:17px/1.7 Georgia,serif}body{max-width:35em;margin:6vh auto;background:#fffaf1;padding:clamp(18px,5vw,52px);border-top:9px solid '+(menu?'#344591':'#efb72e')+'}li{border-bottom:1px dashed #cbbfa9;padding:.3em 0}a{color:#334989}@media print{body{margin:0}}</style><body><small>'+t('张千羽 · 原创模拟算例','Andy Zhang · Original example')+'</small><h1>'+title+'</h1><ul>'+lines.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ul><a href="'+url+'">'+t('打开完整工具','Open the full tool')+'</a></body></html>';
}

