import {withMenuEdits,withQueryEdits,search,compare,parseMenu,rules} from './search.mjs';
import {t,escapeText as esc,startPage,download} from '../ui.mjs';
const $=id=>document.getElementById(id);
let base='literal',mode='alias',q='shawerma chicken wrap',custom=[],importText='',message='',open=false;
const ruleLabels=()=>({literal:t('原词匹配','Literal terms'),alias:t('补上音译别名','Spelling aliases'),wide:t('放宽卷类，热销优先','All wraps, popular first')});
const reasonLabel=k=>({name:t('名称匹配','Name match'),terms:t('词项匹配','Term match'),category:t('扩展到卷类','Category expansion')})[k];
const menu=()=>withMenuEdits(custom);
const judgments=()=>withQueryEdits(custom);
function report(){
 const rows=compare(menu(),judgments(),base,mode);
 return {source:'Original demonstration menu and manually specified expected dish IDs; no live orders',baseline:rules[base],candidate:rules[mode],menu:menu(),query:q,rows};
}
function renderResults(){
 const labels=ruleLabels(),menuRows=menu(),rows=compare(menuRows,judgments(),base,mode);
 const name=id=>{const d=menuRows.find(x=>x.id===id);return d?t(d.zh,d.en):t('无结果','No result');};
 const expected=judgments().find(row=>row.q.toLowerCase()===q.trim().toLowerCase())?.id;
 $('menus').innerHTML=[base,mode].map((rule,i)=>{
  const result=search(menuRows,q,rule);
  return '<section class="menu-column"><header><small>'+t(i?'候选规则':'原规则',i?'Candidate':'Baseline')+'</small><h2>'+labels[rule]+'</h2></header>'+
   (result.length?'<ol>'+result.slice(0,4).map(({dish,reason})=>'<li><b>'+esc(t(dish.zh,dish.en))+'</b><span lang="ar" dir="rtl">'+esc(dish.ar)+'</span><small>'+reasonLabel(reason)+'</small></li>').join('')+'</ol>':'<div class="empty-result">'+t('这条规则没有找到菜。','No dish matches this rule.')+'</div>')+'</section>';
 }).join('');
 $('expected').textContent=expected?t('这条查询标注的目标菜　','Expected dish　')+name(expected):t('自由查询 · 尚未标注目标菜','Free query · no expected dish assigned');
 const won=rows.filter(r=>r.status==='won').length,lost=rows.filter(r=>r.status==='lost').length;
 $('totals').innerHTML='<div><strong>+'+won+'</strong>'+t('首位找回','Recovered at #1')+'</div><div><strong>−'+lost+'</strong>'+t('首位变差','Lost at #1')+'</div><div><strong>'+rows.length+'</strong>'+t('标注查询','Labeled queries')+'</div>';
 const changed=rows.filter(r=>r.status!=='same');
 $('changes').innerHTML=changed.length?changed.map(row=>'<button class="change-row" data-q="'+esc(row.q)+'"><span>'+esc(row.q)+'</span><small>'+esc(name(row.before[0]))+' → '+esc(name(row.after[0]))+'</small><b>'+ (row.status==='lost'?'−':'+')+'</b></button>').join(''):'<p>'+t('这批查询的首位命中情况相同。','First-place accuracy is unchanged for these queries.')+'</p>';
 $('changes').querySelectorAll('button').forEach(b=>b.onclick=()=>{q=b.dataset.q;$('query').value=q;renderResults();$('query').focus();});
}
function render(){
 const labels=ruleLabels(),options=sel=>Object.entries(labels).map(([k,v])=>'<option value="'+k+'" '+(sel===k?'selected':'')+'>'+v+'</option>').join('');
 $('app').innerHTML='<div class="work-layout"><aside class="tools"><label>'+t('试着搜一道菜','Search for a dish')+'<input id="query" dir="auto" maxlength="160" value="'+esc(q)+'"></label><div class="examples">'+['shawerma chicken wrap','falafel wrap','صحن شاورما دجاج'].map(v=>'<button data-example="'+v+'">'+v+'</button>').join('')+'</div><label>'+t('对照规则','Baseline rule')+'<select id="base">'+options(base)+'</select></label><label>'+t('试用规则','Candidate rule')+'<select id="mode">'+options(mode)+'</select></label><details '+(open?'open':'')+' id="imports"><summary>'+t('带入我的菜单','Add my own menu')+'</summary><label>'+t('每行填「菜名 | 别名，别名」。已有菜名会补入别名。','One dish per line: name | alias, alias. Existing dishes gain aliases.')+'<textarea id="importText" rows="4" placeholder="Mushroom pita | mushroom pocket">'+esc(importText)+'</textarea></label><button id="import">'+t('应用菜单','Apply menu')+'</button><p role="status" id="importMsg">'+esc(message)+'</p></details></aside><div class="surface"><div class="menu-paper"><header class="menu-mast"><span>قائمة الطعام</span><small>'+t('双语菜单 · 原创示例','Bilingual menu · original fixture')+'</small></header><div id="menus" class="menu-grid"></div><p id="expected"></p></div><section class="ledger"><h2>'+t('同一批查询，谁变好了？','Which searches improved?')+'</h2><div id="totals" class="metrics"></div><div id="changes"></div><button id="export">'+t('导出规则与逐条对照','Export rules and query comparison')+' ↓</button></section></div></div>';
 $('query').oninput=e=>{q=e.target.value;renderResults();};
 for(const button of $('app').querySelectorAll('[data-example]'))button.onclick=()=>{q=button.dataset.example;$('query').value=q;renderResults();};
 $('base').onchange=e=>{base=e.target.value;renderResults();};
 $('mode').onchange=e=>{mode=e.target.value;renderResults();};
 $('imports').ontoggle=e=>{open=e.target.open;};
 $('importText').oninput=e=>{importText=e.target.value;};
 $('import').onclick=()=>{try{custom=parseMenu(importText);message=t('已应用 '+custom.length+' 条菜单修改。','Applied '+custom.length+' menu edits.');q=custom[0].aliases[0];$('query').value=q;renderResults();}catch(error){message=t('请检查菜单行，保留之前的菜单：','Check your entries; the previous menu is still active: ')+error.message;}$('importMsg').textContent=message;};
 $('export').onclick=()=>download('menu-rule-comparison.json',JSON.stringify(report(),null,2),'application/json');
 renderResults();
}
startPage(render);
