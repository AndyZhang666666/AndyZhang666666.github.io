import {examples,createStory,rows,revise,scriptText} from './story.mjs';
import {t,escapeText as esc,startPage,download,isEnglish} from '../ui.mjs';
const $=id=>document.getElementById(id);
let story,source,customSource=false,undo=[],active=2,editKey=null,editType='doubt',draft='',form=null,notice='';
const pad=n=>String(n).padStart(2,'0');
function setStory(next){undo.push(story);story=next;notice='';}
function starter(){
 const en=isEnglish();source=examples[en?'en':'zh'].join('\n\n');
 return createStory(source,3,t('阿禾','Ahe'),t('寄信人是林岚','Lin Lan sent the letter'));
}
function importView(){return '<form id="importer" class="import-form"><label>'+t('角色','Character')+'<input id="who" required maxlength="80" value="'+esc(form.character)+'"></label><label>'+t('这个角色将知道什么？','What will the character learn?')+'<input id="what" required maxlength="240" value="'+esc(form.fact)+'"></label><label>'+t('场名占一行，下一行起写正文，场间留空行。用【知情】标出依赖这条事实的对白。','Put the scene title first, dialogue below, and a blank line between scenes. Mark lines that depend on the fact with 【知情】.')+'<textarea id="scenes" required rows="11">'+esc(form.text)+'</textarea></label><label>'+t('原定揭晓场次','Original reveal scene')+'<input type="number" required min="1" max="30" id="firstReveal" value="'+form.reveal+'"></label><button class="primary">'+t('载入剧本','Load script')+'</button> <button type="button" id="cancelImport">'+t('返回','Cancel')+'</button></form>';}
function render(){
 if(!story)story=starter();
 const all=rows(story),conflicts=all.filter(r=>r.conflict),scene=story.scenes[active],lines=all.filter(r=>r.scene===active+1);
 const choices=story.scenes.map((s,i)=>'<option value="'+(i+1)+'" '+(story.reveal===i+1?'selected':'')+'>'+pad(i+1)+' · '+esc(s.title)+'</option>').join('');
 $('app').innerHTML='<div class="work-layout"><aside class="tools"><h2>'+t('人物知情线','Character timeline')+'</h2><p>'+esc(story.character)+' · '+esc(story.fact)+'</p><label>'+t('在哪一场揭晓？','When is the reveal?')+'<select id="reveal">'+choices+'</select></label><nav class="scene-index" aria-label="'+t('场景','Scenes')+'">'+story.scenes.map((s,i)=>'<button data-scene="'+i+'" aria-pressed="'+(i===active)+'"><small>'+pad(i+1)+'</small> '+esc(s.title)+(conflicts.some(c=>c.scene===i+1)?' <b>●</b>':'')+'</button>').join('')+'</nav><button id="own">'+t('带入自己的场景','Use my scenes')+'</button></aside><div class="surface">'+(form?importView():
 '<section class="script-sheet"><div class="script-top">'+t('场次','Scene')+' <b>'+pad(active+1)+' / '+pad(story.scenes.length)+'</b></div><h2>'+esc(scene.title)+'</h2><p class="pencil">'+(active+1===story.reveal?t('这一场揭晓','The reveal happens here'):active+1<story.reveal?t('此时尚未揭晓','Before the reveal'):t('此时已经揭晓','After the reveal'))+'</p>'+
 lines.map(r=>'<div class="script-line '+(r.conflict?'early':'')+'">'+(r.edit?.type==='clue'?'<small>'+esc(r.edit.wording)+'</small>':'')+(r.edit?.type==='omit'?'<del>'+esc(r.text)+'</del>':esc(r.edit?.type==='doubt'?r.edit.wording:r.text))+
 (r.conflict?'<button data-edit="'+r.key+'">'+t('这句提前知情 · 修订','Premature knowledge · revise')+'</button>':'')+'</div>').join('')+
 (editKey?'<div class="edit-area"><label>'+t('怎么处理这句？','How should this line change?')+'<select id="type">'+[['doubt',t('改为猜测','Make it a suspicion')],['clue',t('提前补一条线索','Add an earlier clue')],['omit',t('删掉这句','Omit the line')]].map(([k,v])=>'<option value="'+k+'" '+(k===editType?'selected':'')+'>'+v+'</option>').join('')+'</select></label>'+(editType==='omit'?'':'<label>'+t('确认写进剧本的文字','Wording to insert')+'<textarea id="draft" rows="3" maxlength="2000">'+esc(draft)+'</textarea></label>')+'<button class="primary" id="accept">'+t('采纳这次修改','Apply revision')+'</button> <button id="dismiss">'+t('放弃草稿','Discard draft')+'</button></div>':'')+'</section>')+
 '<section class="ledger"><h2>'+t('修订记录','Revision record')+'</h2><p>'+t('待处理的标记对白','Open marked lines')+' <b>'+conflicts.length+'</b> · '+t('已采纳','Accepted')+' <b>'+Object.keys(story.edits).length+'</b></p>'+
 (conflicts.length?'<button id="next">'+t('下一句待修订','Next flagged line')+'</button> ':'')+'<button id="undo" '+(!undo.length?'disabled':'')+'>'+t('撤回上一步','Undo last change')+'</button> <button id="export">'+t('导出剧本和改动清单','Export script & notes')+' ↓</button></section><p role="status" id="notice">'+esc(notice)+'</p></div></div>';
 $('reveal').onchange=e=>{setStory({...story,reveal:Number(e.target.value)});editKey=null;form=null;render();};
 for(const b of $('app').querySelectorAll('[data-scene]'))b.onclick=()=>{active=Number(b.dataset.scene);editKey=null;form=null;render();};
 $('own').onclick=()=>{form={text:source,character:story.character,fact:story.fact,reveal:story.reveal};editKey=null;render();$('who').focus();};
 if(form){
  const sync=()=>{form={character:$('who').value,fact:$('what').value,text:$('scenes').value,reveal:Number($('firstReveal').value)};};
  $('importer').oninput=sync;
  $('importer').onsubmit=e=>{e.preventDefault();sync();try{const next=createStory(form.text,form.reveal,form.character,form.fact);story=next;customSource=true;source=form.text;undo=[];active=0;form=null;notice=t('已载入你的场景。','Your scenes are loaded.');render();}catch{$('notice').textContent=t('请检查角色、事实、场次和揭晓位置。至少需要两场，每场包括标题和正文。','Check the character, fact and reveal. Include at least two titled scenes with dialogue.');}};
  $('cancelImport').onclick=()=>{form=null;render();};
 }
 function suggest(){if(customSource)return '';return editType==='doubt'?t('阿禾：会不会是林岚？','Ahe: Could it have been Lin Lan?'):t('她认出了信封角落里林岚独有的落款。','She recognizes Lin Lan’s distinctive signature on the envelope.');}
 function edit(r){active=r.scene-1;editKey=r.key;editType='doubt';draft=suggest();form=null;render();}
 for(const b of $('app').querySelectorAll('[data-edit]'))b.onclick=()=>edit(all.find(r=>r.key===b.dataset.edit));
 if($('next'))$('next').onclick=()=>edit(conflicts[0]);
 if(editKey){
  $('type').onchange=e=>{editType=e.target.value;draft=suggest();render();};
  if($('draft'))$('draft').oninput=e=>draft=e.target.value;
  $('accept').onclick=()=>{try{setStory(revise(story,editKey,editType,editType==='omit'?'':draft));editKey=null;render();}catch{$('notice').textContent=t('先写下准备采纳的文字。','Enter wording before applying.');}};
  $('dismiss').onclick=()=>{editKey=null;render();};
 }
 $('undo').onclick=()=>{if(undo.length){story=undo.pop();editKey=null;form=null;render();}};
 $('export').onclick=()=>download('scene-revisions.md',scriptText(story,isEnglish()),'text/markdown;charset=utf-8');
}
startPage(render);
