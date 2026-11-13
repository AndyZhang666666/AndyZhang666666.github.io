import {hasUnappliedCopy,validateCopy} from './studio-state.js?v=20261112-craft1';
import {ARTBOARDS,artworkDefault,normalizeArtwork,packedArtwork,artworkSignature,canvasProvenance,restoreSceneDirection} from './artwork.js?v=20261112-craft1';
import {imageFromFile,storeImage,readImage,clearImages} from './image-store.js?v=20261112-craft1';
import {feedbackSuggestions,revokePreference,restorePreferenceSnapshot,memoryTime} from './interaction-helpers.js?v=20261112-craft1';
import {visibleRoom, replacedRules, trialParameter, posterPng, savePreference} from './exports.js?v=20261112-craft1';
import {DIRECTIONS,layoutStatus} from './directions.js?v=20261112-craft1';
import {compareAuthorizedScenes,namespaceSceneSvg} from './scene-comparison.js?v=20261112-craft1';
import {parseBrief,importPreview,applyBrief,validCandidate} from './preferences.js?v=20261112-craft1';
import { Room, OPTIONS, parseFeedback, validChoice } from "./engine.js?v=20261112-craft1";
import { createComparison, applyComparison, comparisonIsCurrent, briefMarkdown, posterSvg, styleBrief, DIMENSIONS } from './experiments.js?v=20261112-craft1';
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
const room = new Room();
room.artwork=artworkDefault();
const STORE = "tasteroom-v1";
let timer,
  epoch = 0,
  running = false,
  queue = [],
  storageOK = true;
let mode = "mock";
let comparison=null,comparisonSide=null,memoryUndo=null;
let artworkFingerprint='',editorDetails=null,imageNotice='',imageEpoch=0;
let exportRequest=null,galleryReturn=null,comparisonReturn=null,keyboardInput=false;
document.addEventListener('keydown',()=>{keyboardInput=true;});document.addEventListener('pointerdown',()=>{keyboardInput=false;});
const detailIds=['editWhen','editWhere','editAction'],detailKeys=['when','where','action'];
const eventPresets=[{when:'周六 19:30',where:'城市放映室',action:'自由入场 · 请提前报名'},{when:'周日 14:00',where:'街角书店',action:'带一本旧书，换一个故事'},{when:'周五 16:00',where:'团队交流室',action:'面向所有好奇产品的人'}];
let explorer=null,activePath="create",candidates=[],importDraft=null;
let feedbackHints=null,lastFeedback=null,editorDraft=null,lastDownloadUrl=null,restoredCanvas=false;
// Existing memories survive; a fresh session starts with an editable Swiss canvas.
if(room.round!==2){room.round=2;room.canvas.artDirection='swiss';room.base.artDirection='swiss';}
function displayedRoom(){return visibleRoom(room,comparison,comparisonSide);}
fetch("./mode.json")
  .then((r) => r.json())
  .then((c) => {
    mode = c.mode === "model" ? "model" : "mock";
    if (mode === "model")
      document.querySelector(".intro>span").textContent =
        "服务端模型解析 · 本地执行工具 · 失败自动降级";
  })
  .catch(() => {});
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
try {
  const raw=localStorage.getItem(STORE);room.restore(raw);
  const saved=JSON.parse(raw||"null");room.artwork=normalizeArtwork(saved?.artwork);if(saved?.editorDetails&&detailKeys.every(k=>typeof saved.editorDetails[k]==='string'&&saved.editorDetails[k].length<=100))editorDetails=saved.editorDetails;if(Array.isArray(saved?.editorDraft)&&saved.editorDraft.length===4&&saved.editorDraft.every(s=>typeof s==='string'&&s.length<=180))editorDraft=saved.editorDraft;candidates=Array.isArray(saved?.candidates)?saved.candidates.filter(validCandidate).slice(0,2):[];if(saved?.draftCanvas&&Object.entries(saved.draftCanvas).every(([d,v])=>validChoice(d,v))){room.canvas={...room.canvas,...saved.draftCanvas};restoredCanvas=true;}
} catch {
  storageOK = false;
}
const names = {
  artDirection: "设计方向",
  layoutDensity: "留白",
  typography: "字体",
  alignment: "对齐",
  colorMood: "色彩",
  decorElements: "装饰",
};
const ctx = { global: "全局", personal: "个人展览／活动", work: "工作汇报" };
const content = [
  [
    "周末灵感计划",
    "无用之美<br>周末放映室",
    "把日常调慢一格。<br>看一部电影，聊一段生活。",
    "城市漫游 · 自由入场",
  ],
  [
    "春日交换计划",
    "带一本书<br>换一个周末",
    "把读过的故事，递给陌生人。<br>旧书交换与一杯慢咖啡。",
    "街角书店 · 原创样例",
  ],
  [
    "工作分享计划",
    "从想法<br>到下一步",
    "一次关于产品判断的分享。<br>把问题想清楚，把动作做具体。",
    "团队交流 · 虚构活动",
  ],
];
const contentStarters=[{copy:content[0],details:eventPresets[0]},{copy:['一起做点事','创作者招募\n让想法发生','寻找愿意动手的人。\n设计、文字、技术，欢迎带上你的作品。','城市创作小组 · 原创示例'],details:{when:'11月30日前',where:'线上与城市共创空间',action:'附一份作品报名 · 期待认识你'}},{copy:content[2],details:eventPresets[2]}];
function persist() {
  try {
    localStorage.setItem(STORE, JSON.stringify({...JSON.parse(room.save()),draftCanvas:room.canvas,artwork:packedArtwork(room.artwork),candidates:candidates.map(c=>({...c,artwork:packedArtwork(c.artwork)})),editorDraft,editorDetails}));
  } catch {
    storageOK = false;
  }
}
function stop() {
  epoch++;
  clearTimeout(timer);
  running = false;
  queue = [];
}
function speak(t) {
  $("#reply").textContent = t;
}
function renderChoices() {
  const color = explorer?.round === 1;
  const currentContent=room.draftContent||content[room.content%content.length];
  $("#question").textContent = color
    ? "哪一种颜色，更像你？"
    : "哪一张，让你想多看一眼？";
  $("#round").textContent = color ? "色彩选择 · 2 / 2" : "版式选择 · 1 / 2";
  $("#choices").innerHTML = ["a", "b"].map((side,i)=>{
    const variant={...room.canvas,artDirection:room.canvas.artDirection==='free'?'swiss':room.canvas.artDirection,...(color?{colorMood:i===0?'high_contrast':'monochrome'}:{layoutDensity:i===0?'compact':'airy',typography:i===0?'rational_sans':'editorial_serif'})};
    const label=color?(i===0?'高对比撞色':'克制单色'):(i===0?'紧凑无衬线':'留白书刊');
    return `<button class="choice" data-choice="${side}" aria-label="选择${i===0?'A':'B'}：${label}"><div class="explore-poster">${posterSvg({...room,canvas:variant},currentContent)}</div><span class="choice-label"><span>${label}</span><span>偏爱这张 ↗</span></span></button>`;
  }).join('');

}
function renderMemories() {
  $("#effectiveRules").innerHTML=room.effective().map(m=>`<p><strong>${esc(names[m.dimension])}</strong> ${esc(OPTIONS[m.dimension][m.preference])}<small>${esc(ctx[m.context])} · ${m.type==='explicit'?'已授权 / 生效中':'待验证线索'}<br>${esc(memoryTime(m))}</small><button type="button" data-revoke="${esc(m.id)}" aria-label="撤销${esc(ctx[m.context])}${esc(names[m.dimension])}规则">撤销</button></p>`).join('')||'<p class="empty">还没有保存规则。当前构图和导出都不要求授权记忆。</p>';
  $('#authorizedScenes').innerHTML=['personal','work'].map(scope=>{const rules=room.memories.filter(m=>m.context===scope&&m.status==='active'&&m.type==='explicit'&&!m.id.startsWith('once_'));const latest=rules.slice().sort((a,b)=>(Date.parse(b.updatedAt||b.createdAt||'')||0)-(Date.parse(a.updatedAt||a.createdAt||'')||0))[0];return `<section><strong>${ctx[scope]}</strong><span>${rules.length?'已授权 '+rules.length+' 项':'尚未授权'}</span><small>${latest?esc(memoryTime(latest)):'仅试用不产生场景记忆'}</small><button type="button" data-context="${scope}">查看这个场景</button></section>`;}).join('');
  const relevant = room.memories.filter(
    (m) =>
      m.status === "active" &&
      (m.context === "global" || m.context === room.context),
  );
  for (const type of ["explicit", "implicit"]) {
    const list = relevant.filter((m) => m.type === type);
    $("#" + type + "Count").textContent = list.length;
    $("#" + type + "Memories").innerHTML = list.length
      ? list
          .map(
            (m) =>
              `<article class="memory ${room.focus === m.id ? "focused" : ""}"><div class="memory-title"><b>${esc(OPTIONS[m.dimension][m.preference])}</b><span>${type === "explicit" ? "本人明确规则" : "待验证线索"}</span></div><p>${esc(m.sourceReason)}</p><div class="memory-actions"><select aria-label="${esc(names[m.dimension])}记忆的场景" data-memory-context="${m.id}">${Object.entries(
                ctx,
              )
                .map(
                  ([k, v]) =>
                    `<option value="${k}" ${m.context === k ? "selected" : ""}>${v}</option>`,
                )
                .join(
                  "",
                )}</select>${type === "implicit" ? `<button data-lock="${m.id}">锁定</button>` : ""}<button data-delete="${m.id}">删除</button><button data-evidence="${m.id}" aria-label="查看${esc(names[m.dimension])}依据">依据 ↗</button></div></article>`,
          )
          .join("")
      : `<p class="empty">${type === "explicit" ? "你的明确指令会放在这里。<br>它不会把猜测当成你的命令。" : "做两次直觉选择，看看它猜中了什么。"}</p>`;
  }
  $("#memoryCount").textContent = relevant.length;
}
function renderLogs() {
  const labels = {
    upsert_memory: "记录偏好及来源",
    update_canvas: "依照记忆修改画布",
    rollback_canvas: "撤回指定操作，保留其他修改",
    redo_canvas: "恢复已撤回操作",
    ask_conflict_resolution: "发现冲突，暂停并请求仲裁",
    resolve_conflict: "应用你的仲裁",
    manage_memory: "用户直接管理记忆",
    confirm_comparison: "单变量对照后，由本人确认适用范围",
    skip_comparison: "两张都不选，没有推断偏好",
  };
  $("#logCount").textContent = room.logs.length;
  $("#logs").innerHTML =
    [...room.logs]
      .reverse()
      .map((l) => {
        const s = room.history.find((s) => s.id === l.args.step_id);
        return `<div class="log"><code>${esc(l.tool)}(${esc(JSON.stringify(l.args))})</code><p>${esc(labels[l.tool] || l.tool)}</p>${l.tool === "update_canvas" && s?.active ? `<button data-rollback="${s.id}">撤回并纠偏</button> <button data-evidence="${s.memory}">查看依据</button>` : ""}</div>`;
      })
      .join("") ||
    '<p class="empty">还没有调用。每一条记录都来自实际状态变化。</p>';
}
function render() {
  if(comparison&&!comparisonIsCurrent(room,comparison)){comparison=null;comparisonSide=null;}
  const ready = !explorer;
  const shown=displayedRoom();
  $('#startCreate').setAttribute('aria-pressed',String(activePath==='create'));
  $('#startExplore').setAttribute('aria-pressed',String(activePath==='explore'));
  $('#storageNotice').hidden=storageOK;$('#storageNotice').textContent='本机存储不可用；仍可编辑、比较和导出，刷新会结束本次草稿。';
  $("#probe").hidden = ready;
  $("#experiment").hidden = !ready;
  if (!ready) renderChoices();
  const p = $("#poster");
  Object.entries({
    density: "layoutDensity",
    typography: "typography",
    alignment: "alignment",
    color: "colorMood",
    decor: "decorElements",
  }).forEach(([k, v]) => (p.dataset[k] = shown.canvas[v]));
  const c = room.draftContent || content[room.content % content.length];
  $("#posterCategory").textContent = c[0];
  $("#posterHeading").innerHTML = c[1].split(/<br\s*\/?\s*>|\n/i).map(esc).join('<br>');
  $("#posterSub").innerHTML = c[2].split(/<br\s*\/?\s*>|\n/i).map(esc).join('<br>');
  $("#posterFooter").textContent = c[3];
  const direction=shown.canvas.artDirection||'free',visual=$('#directionPreview');
  $('#canvasTitle').textContent=direction==='free'?'自由参数 · 当前画布':OPTIONS.artDirection[direction]+' · 当前画布';
  visual.hidden=false;p.hidden=true;
  const stamp=JSON.stringify([shown.canvas,room.posterSettings,c,artworkSignature(room.artwork),!!room.artwork.image?.dataUrl]);
  if(stamp!==artworkFingerprint){artworkFingerprint=stamp;visual.innerHTML=posterSvg(shown,c);const object=visual;object.getAnimations().forEach(a=>a.cancel());if(!keyboardInput&&!matchMedia('(prefers-reduced-motion:reduce)').matches)object.animate([{opacity:.65,transform:'translateY(5px)'},{opacity:1,transform:'none'}],{duration:240,easing:'cubic-bezier(.16,1,.3,1)'});}
  $$('[data-direction]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.direction===direction));b.disabled=!!room.pending});
  const directionRule=room.effective().find(m=>m.dimension==='artDirection'&&m.preference===direction&&m.type==='explicit');
  $('#rememberDirection').hidden=!ready||direction==='free'||!!comparison;$('#rememberDirection').disabled=!!room.pending||running||directionRule?.context===room.context;
  $('#rememberDirection').textContent=directionRule?.context===room.context?'✓ 当前场景已记住该方向':'记住当前场景的设计方向';
  $('#directionStatus').textContent=ready?(directionRule?`「${OPTIONS.artDirection[direction]}」已按你授权的${ctx[directionRule.context]}规则应用。`:`正在试用「${OPTIONS.artDirection[direction]}」；这次试用不会新增长期记忆。`):'也可以先完成两次直觉选择，再拆开验证偏爱。';
  $('#updateContent').disabled=!!room.pending||running;syncEditStatus();
  const layout=layoutStatus(shown,c);$('#overflowActions').hidden=layout.ok;$('#layoutWarning').hidden=layout.ok;$('#layoutWarning').textContent=layout.issues.join('；')+'。内容保留，调整后才能导出。';
  const provenance=canvasProvenance(room,shown),a=room.artwork,board=ARTBOARDS[a.format];
  $('#provenanceDirection').textContent=`当前构图：${OPTIONS.artDirection[provenance.direction]} · ${provenance.remembered?'✓ 当前场景已记住':provenance.inherited?'沿用已授权全局方向':'临时试用未记入记忆'}`;
  $('#provenanceTrial').textContent=provenance.temporary?'含临时试用改动 · 不改变已授权规则':'作品内容与长期偏好分别保存';
  $('#restoreSceneDirection').hidden=!provenance.canRestore;$('#restoreSceneDirection').disabled=!!room.pending||running;
  $('#canvasCaption').textContent=`${board.width} × ${board.height} · ${board.name} · PNG与当前画布一致，SVG保留文字编辑性`;
  $('#artboardFormat').value=a.format;$('#imageAdjustments').hidden=!a.image;$('#imageFit').value=a.imageFit;$('#imageX').value=a.imageX;$('#imageY').value=a.imageY;
  $('#imageStatus').textContent=imageNotice||(a.image?(a.image.dataUrl?'当前主图仅在本机使用；切换构图和尺寸可重新检查裁切。':'主图未恢复，请重新选择或移除；其余作品和偏好保留。'):'JPG / PNG / WebP，最大5MB，只在本机处理。');
  const design=DIRECTIONS[direction];$('#directionCapacity').textContent=design?board.name+' · '+design.capacity+' · '+design.use:'自由参数：自行调整六项属性。';
  $('#titleScale').value=String(Math.round((room.posterSettings?.titleScale||1)*100));$('#titleScaleValue').textContent=$('#titleScale').value+'%';$('#lineBreaks').value=room.posterSettings?.lineBreaks||'auto';$('#densityControl').value=shown.canvas.layoutDensity;
  $('#openDirections').disabled=!!room.pending;$('#quickDirections').disabled=!!room.pending;$('#pinCandidate').disabled=!!room.pending||running||candidates.length>=2;$('#pinCandidate').textContent=candidates.length>=2?'已满，移除后再留':'留作候选';
  renderDirections(c);renderCandidates();
  $$("[data-context]").forEach((b) => {
    b.setAttribute("aria-pressed", b.dataset.context === room.context);
    b.disabled = !!room.pending;
  });
  $("#contextNote").textContent =
    ctx[room.context] +
    "：明确规则优先，继承全局偏好。" +
    (!storageOK ? " 浏览器禁用存储，本次仅保存在内存。" : "");
  renderMemories();
  renderLogs();
  document.body.classList.toggle("has-conflict", !!room.pending);
  $("#conflict").hidden = !room.pending;
  $("#feedback").hidden = !!room.pending;
  if (room.pending) {
    const p = room.pending;
    $("#conflictText").textContent =
      `原记忆「${OPTIONS[p.dimension][p.old.preference]}」（${ctx[p.old.context]}）与新要求「${OPTIONS[p.dimension][p.value]}」冲突。你希望记住到什么范围？`;
    showBrain(false);
  }
  $("#pause").textContent = running ? "暂停整理" : "按记忆重新整理";
  $("#runState").textContent = room.pending
    ? "等待你的仲裁"
    : running
      ? "逐步整理中…"
      : "可随时纠偏";
  $("#undo").disabled = !room.history.some((s) => s.active) || !!room.pending;
  $("#redo").disabled = !room.history.some((s) => !s.active) || !!room.pending;
  $("#newContent").disabled = !!room.pending;
  $("#pause").disabled = !!room.pending;
  $('#startComparison').disabled=!!room.pending;
  $('#exportBrief').disabled=!ready||!!room.pending||running;
  $('#exportPoster').disabled=!ready||!!room.pending||running||!layout.ok;
  $('#exportPng').disabled=!ready||!!room.pending||running||!layout.ok;
  $('#crossSceneCompare').disabled=!ready||!!room.pending||running||!!comparison;
  $('#exportBriefJson').disabled=!ready||!!room.pending||running;
  $('#importBrief').disabled=!!room.pending||running;
  $('#undoMemory').disabled=!memoryUndo||!!room.pending||running;
  $$(".phases li").forEach((el,i)=>el.classList.toggle('current',i===(comparisonSide?2:comparison?1:0)));
  renderComparison();
  $('#feedbackHints').hidden=!feedbackHints;
  if(feedbackHints){$('#feedbackHintNote').textContent=feedbackHints.note;$('#feedbackHintChoices').innerHTML=feedbackHints.choices.map((c,i)=>`<button type="button" data-intent-index="${i}">${esc(c.label)}</button>`).join('');}
  $('#rememberFeedback').hidden=!lastFeedback||room.canvas[lastFeedback.dimension]!==lastFeedback.value||!!room.pending;
  persist();
  $('#storageNotice').hidden=storageOK;
}
function renderComparison(){
  $('#comparisonPanel').hidden=!comparison;
  $('.artboard').hidden=!!comparison&&!comparisonSide;
  if(!comparison)return;
  $('#comparisonDimension').value=comparison.dimension;
  $('#directionPair').hidden=comparison.dimension!=='artDirection';
  $('#comparisonTitle').textContent=comparison.dimension==='artDirection'?'同一内容，比较整体构图':'同一内容，只变一项';
  $('#comparisonScopeNote').textContent=comparison.dimension==='artDirection'?'艺术方向包含构图、字形和图形的整体变化。选择只说明这次更喜欢这个方向，不推断其他五项偏好。':'内容、构图与其他参数保持不变，只比较所选参数。';
  const container=$('#comparisonVariants');container.replaceChildren();container.hidden=!!comparisonSide;
  $('#backToComparison').hidden=!comparisonSide;
  $('#skipComparison').hidden=!!comparisonSide;
  comparison.variants.forEach((variant,i)=>{
    const wrap=document.createElement('div');wrap.className='comparison-variant';
    const poster=document.createElement('div');poster.className='direction-preview';
    poster.innerHTML=posterSvg({...room,canvas:variant},room.draftContent||content[room.content%content.length]);
    poster.setAttribute('aria-label',`${i===0?'A':'B'} 方案：${OPTIONS[comparison.dimension][variant[comparison.dimension]]}`);
    const button=document.createElement('button');button.type='button';button.dataset.comparisonSide=i===0?'a':'b';button.textContent=`试用 ${i===0?'A':'B'} · ${OPTIONS[comparison.dimension][variant[comparison.dimension]]}`;
    button.setAttribute('aria-pressed',String(comparisonSide===button.dataset.comparisonSide));wrap.append(poster,button);container.append(wrap);
  });
  $('#comparisonDecision').hidden=!comparisonSide;
  $('[data-comparison-scope="current"]').disabled=room.context==='global';
  $('[data-comparison-scope="current"] small').textContent=room.context==='global'?'请先切到日常或工作':'只替换当前场景同维度规则';
  if(comparisonSide){
    const v=comparison.variants[comparisonSide==='a'?0:1][comparison.dimension];
    $('#canvasTitle').textContent='临时试用 · '+OPTIONS[comparison.dimension][v];
    $('#comparisonChoice').textContent=`当前试用「${OPTIONS[comparison.dimension][v]}」。可以直接导出；如需记住，只保存${DIMENSIONS[comparison.dimension]}这一维。`;
    const describe=scope=>{const rules=replacedRules(room,comparison.dimension,scope);return rules.length?rules.map(m=>`${ctx[m.context]}「${OPTIONS[m.dimension][m.preference]}」`).join('、'):'无旧规则';};
    $('#replacementSummary').textContent=`当前场景将替换：${describe('current')}。全局保存将替换所有场景该维度：${describe('global')}。仅试用不修改规则。`;
  }
}

// A native read-only dialog keeps the editor, context, undo history and memory untouched.
const sceneDialog=$('#sceneComparisonDialog');
const sceneOrigin={personal:'个人授权',work:'工作授权',global:'全局继承',default:'默认值'};
$('#crossSceneCompare').onclick=()=>{
 if($('#crossSceneCompare').disabled||room.pending||running||comparison||document.querySelector('dialog[open]'))return;
 const applied=room.draftContent||content[room.content%content.length];
 const model=compareAuthorizedScenes(room,applied);
 const posters=$('#sceneComparisonPosters');posters.replaceChildren();
 for(const view of model.scenes){
  const article=document.createElement('article');article.className='scene-poster';
  const heading=document.createElement('h3');heading.textContent=view.context==='personal'?'个人场景':'工作场景';
  const scope=document.createElement('p');scope.className='scene-scope';
  scope.textContent=view.sceneRuleCount?`${view.sceneRuleCount}项场景授权 · ${view.inheritedRuleCount}项全局继承`:`暂无场景授权 · ${view.inheritedRuleCount?'继承'+view.inheritedRuleCount+'项全局规则':'使用默认值'}`;
  const image=document.createElement('div');image.className='scene-poster-image';
  image.innerHTML=namespaceSceneSvg(posterSvg(view,view.content),'scene-'+view.context);
  article.append(heading,scope,image);
  const layout=layoutStatus(view,view.content);
  if(!layout.ok){const warning=document.createElement('p');warning.className='scene-capacity-warning';warning.textContent='这套规则下文案超出建议容量。请关闭对照，调整文案或方向后再检查。';article.append(warning);}
  posters.append(article);
 }
 const differences=$('#sceneComparisonDifferences');differences.replaceChildren();
 $('#sceneComparisonSummary').textContent=model.differences.length?`有${model.differences.length}项参数不同；差异来自各场景的授权及其全局继承。`:'两侧参数相同。尚未分别授权时会使用相同默认值；相同构图也可能来自不同的授权范围。';
 for(const difference of model.differences){
  const row=document.createElement('li'),title=document.createElement('strong');title.textContent=names[difference.dimension];row.append(title);
  for(const context of ['personal','work']){const value=difference[context],cell=document.createElement('span');cell.textContent=`${context==='personal'?'个人':'工作'}：${OPTIONS[difference.dimension][value.value]} · ${sceneOrigin[value.origin]}`;row.append(cell);}
  differences.append(row);
 }
 $('#crossSceneCompare').setAttribute('aria-expanded','true');sceneDialog.showModal();
};
$('#closeSceneComparison').onclick=()=>sceneDialog.close();
sceneDialog.addEventListener('close',()=>{
 $('#crossSceneCompare').setAttribute('aria-expanded','false');
 $('#sceneComparisonPosters').replaceChildren();$('#sceneComparisonDifferences').replaceChildren();
 $('#crossSceneCompare').focus({preventScroll:true});
});
function organize() {
  stop();
  comparison=null;comparisonSide=null;
  if (room.pending) return;
  room.base = { ...room.base };
  queue = room
    .effective()
    .filter((m) => room.canvas[m.dimension] !== m.preference);
  if (!queue.length) {
    speak("当前画布已经符合此场景的记忆。换一套内容，验证它是否还记得。");
    render();
    return;
  }
  running = true;
  const token = epoch;
  function next() {
    if (token !== epoch) return;
    const m = queue.shift();
    if (!m) {
      running = false;
      speak("整理完成。它猜得对吗？点一句反馈，教它区分审美和场景。");
      render();
      return;
    }
    room.update(m.dimension, m.preference, m.id);
    speak(
      `调整${names[m.dimension]}为「${OPTIONS[m.dimension][m.preference]}」，依据 ${m.id}。你可以撤回这一步。`,
    );
    render();
    timer = setTimeout(next, 650);
  }
  render();
  timer = setTimeout(next, 650);
}
async function submitFeedback(text) {
  stop();
  comparison=null;comparisonSide=null;feedbackHints=null;lastFeedback=null;
  const requestEpoch = epoch;
  let parsed;
  let parserLabel = mode === "model" ? "模型解析" : "本地规则";
  try {
    // Real mode is available only on the optional same-origin Node server. Pages has no endpoint.
    if (mode === "model") {
      speak("正在通过服务端解析；超时将回到本地规则。");
      const resp = await fetch("./api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: AbortSignal.timeout(5500),
      });
      if (!resp.ok) throw Error("模型不可用");
      parsed = await resp.json();
      speak("真实模型已解析；由本地状态机校验和执行。");
    } else parsed = parseFeedback(text);
  } catch {
    parsed = parseFeedback(text);
    parserLabel = "模型失败，已降级本地规则";
  }
  if (requestEpoch !== epoch) return;
  if (!parsed || !validChoice(parsed.dimension, parsed.value)) {
    speak(
      "还没理解整句话。下面给出几个手动起点，选择只试用本张作品；不会取半句擅自写入记忆。",
    );
    feedbackHints=feedbackSuggestions(text);render();
    requestAnimationFrame(()=>{const hints=$('#feedbackHints');hints.focus({preventScroll:true});hints.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});});
    return;
  }
  trialParameter(room,parsed.dimension,parsed.value);lastFeedback={dimension:parsed.dimension,value:parsed.value};
  speak(parserLabel+'：只试用这项调整，没有新增长期偏好。满意后可明确选择记住的场景。');
  render();
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if(b.dataset.direction){previewDirection(b.dataset.direction);return;}
  if (b.dataset.choice && explorer) {
    explorer.choose(b.dataset.choice);
    if(explorer.round===2){const priorDirection=room.canvas.artDirection==='free'?'swiss':room.canvas.artDirection;explorer.reconcile();for(const [d,v] of Object.entries(explorer.canvas))if(d!=='artDirection')trialParameter(room,d,v);trialParameter(room,'artDirection',priorDirection);explorer=null;speak('两次选择只生成临时画布；没有新增规则。现在可以任意比较两种构图，再决定是否记住。');beginComparison('artDirection');return;}
    render();return;

  }
  if (b.dataset.feedback) submitFeedback(b.dataset.feedback);
  if (b.dataset.resolve) {
    stop();
    comparison=null;memoryUndo=null;
    room.resolve(b.dataset.resolve);
    speak(
      b.dataset.resolve === "once"
        ? "这次破例；换内容或切场景时恢复长期记忆。"
        : b.dataset.resolve === "branch"
          ? "工作规则单独记下了。切回日常审美，看看区别。"
          : "全局已更新为明确规则；旧猜测已被覆盖。",
    );
    render();
  }
  if (b.dataset.context) {
    stop();
    comparison=null;comparisonSide=null;
    room.switchContext(b.dataset.context);
    speak("已调用「" + ctx[room.context] + "」的有效记忆重新排版。");
    render();
  }
  if (b.dataset.rollback) {
    stop();
    room.rollback(b.dataset.rollback);
    speak("已撤回指定修改，其他维度保留。告诉它哪里不合适，再决定是否改记忆。");
    render();
    $("#input").focus();
  }
  for (const [key, action] of [
    ["lock", "lock"],
    ["delete", "delete"],
  ])
    if (b.dataset[key]) {
      stop();
      comparison=null;memoryUndo=JSON.stringify(room);
      room.manage(b.dataset[key], action);
      speak("记忆已更新，画布按剩余有效规则重新生成。");
      render();
    }
  if (b.dataset.evidence) {
    room.focus = b.dataset.evidence;
    render();
    speak("已高亮这一步引用的记忆。绿色条目说明了它为什么改。");
    if (innerWidth <= 650) showBrain(true);
  }
});
document.addEventListener("change", (e) => {
  const id = e.target.dataset.memoryContext;
  if (id) {
    stop();
    comparison=null;memoryUndo=JSON.stringify(room);
    room.manage(id, "context", e.target.value);
    speak("记忆已迁移，当前画布只使用此场景内有效规则。");
    render();
  }
});
$("#feedbackForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const t = $("#input").value.trim();
  if (t) {
    $("#input").value = "";
    submitFeedback(t);
  }
});
$("#pause").onclick = () => {
  if (running) {
    stop();
    speak("已暂停，后续操作取消。你可以继续整理或直接纠偏。");
    render();
  } else organize();
};
$("#undo").onclick = () => {
  stop();
  const s = [...room.history].reverse().find((s) => s.active);
  if (s) room.rollback(s.id);
  speak("已撤回上一步。重做只恢复画布，不改长期记忆。");
  render();
};
$("#redo").onclick = () => {
  stop();
  room.redo();
  render();
};
$("#newContent").onclick = () => {
  if(!confirmReplaceEditor(true))return;
  stop();
  comparison=null;comparisonSide=null;
  room.content++;
  room.draftContent=null;room.artwork={...room.artwork,details:{...eventPresets[room.content%content.length]}};editorDetails=null;imageNotice='';
  room.reconcile();
  speak("换了新内容，已按当前场景记忆重新整理；尺寸、主图和字号设置保留，请检查本张效果。");
  render();
  syncContentEditor();
};
$("#cancelConflict").onclick = () => {
  room.pending = null;
  speak("已取消这次纠偏，保留原画布和记忆。");
  render();
  syncContentEditor();
};
$("#reset").onclick = () => {
  if(!window.confirm('清空当前作品草稿、候选和已保存偏好？这会删除本机数据，请先导出需要保留的作品和说明书。'))return;
  stop();
  comparison=null;comparisonSide=null;memoryUndo=null;
  room.reset();room.artwork=artworkDefault();clearImages().catch(()=>{});editorDetails=null;imageNotice='';imageEpoch++;room.round=2;room.canvas.artDirection='swiss';room.base.artDirection='swiss';explorer=null;candidates=[];editorDraft=null;lastFeedback=null;feedbackHints=null;
  try {
    localStorage.removeItem(STORE);
  } catch {}
  showBrain(false);
  render();
  syncContentEditor();
};
function showBrain(on) {
  document.body.classList.toggle("brain-open", on);
  $("#showCanvas").setAttribute("aria-pressed", !on);
  $("#showBrain").setAttribute("aria-pressed", on);
  $("#showBrain").setAttribute("aria-expanded", String(on));
}
$("#showCanvas").onclick = () => showBrain(false);
$("#showBrain").onclick = () => showBrain(true);
$('#startCreate').onclick=()=>{stop();explorer=null;activePath='create';comparison=null;comparisonSide=null;render();syncContentEditor();speak('继续当前作品；文案、临时画布与已保存偏好均保留。');};
$('#startExplore').onclick=()=>{activePath='explore';startFlexibleComparison();};
$('#startIntuition').onclick=()=>{stop();comparison=null;comparisonSide=null;activePath='explore';explorer=new Room();render();$('#probe').scrollIntoView({block:'nearest'});};
$('#backToComparison').onclick=()=>{comparisonSide=null;render();};
function beginComparison(dimension){
  if(!comparison)comparisonReturn={element:document.activeElement,scroll:scrollY};
  stop();explorer=null;comparisonSide=null;
  try{
    const pair=dimension==='artDirection'?[$('#compareA').value,$('#compareB').value]:null;
    comparison=createComparison(room,dimension,pair);render();$('#comparisonPanel').scrollIntoView({block:'nearest'});speak(dimension==='artDirection'?'同一内容，两套整体构图；选择不推断其他参数。':'只比较这一项；选择不会立即写入记忆。');
  }catch(e){speak(e.message)}
}
function startFlexibleComparison(){const current=Object.hasOwn(DIRECTIONS,room.canvas.artDirection)?room.canvas.artDirection:'swiss';$('#compareA').value=current;$('#compareB').value=Object.keys(DIRECTIONS).find(d=>d!==current);syncPairOptions();beginComparison('artDirection');}
$('#startComparison').onclick=startFlexibleComparison;
$('#comparisonDimension').onchange=()=>beginComparison($('#comparisonDimension').value);
function syncPairOptions(){for(const [a,b] of [['compareA','compareB'],['compareB','compareA']])for(const option of $('#'+a).options)option.disabled=option.value===$('#'+b).value;}
for(const id of ['compareA','compareB']){$('#'+id).innerHTML=Object.entries(DIRECTIONS).map(([key,d])=>`<option value="${key}">${d.name}</option>`).join('');$('#'+id).onchange=()=>{syncPairOptions();beginComparison('artDirection')};}
$('#compareA').value='swiss';$('#compareB').value='deconstructed';syncPairOptions();
$('#refreshComparison').onclick=()=>beginComparison('artDirection');
$('#closeComparison').onclick=()=>{comparison=null;comparisonSide=null;render();if(comparisonReturn){scrollTo({top:comparisonReturn.scroll,behavior:'instant'});comparisonReturn.element?.focus({preventScroll:true});}speak('已关闭对照；尚未确认的选择不会被记住。');};
$('#skipComparison').onclick=()=>{try{applyComparison(room,comparison,'skip');comparison=null;comparisonSide=null;render();speak('两张都不选，没有新增或修改任何偏好。');}catch(e){speak(e.message);}};
document.addEventListener('click',e=>{
  const side=e.target.closest('[data-comparison-side]');if(side){comparisonSide=side.dataset.comparisonSide;render();return;}
  const scope=e.target.closest('[data-comparison-scope]');if(scope){try{stop();if(scope.dataset.comparisonScope!=='once')memoryUndo=JSON.stringify(room);applyComparison(room,comparison,comparisonSide,scope.dataset.comparisonScope);comparison=null;comparisonSide=null;render();speak('只更新了本次对照的维度和你授权的范围。换内容或场景，继续验证是否适用。');}catch(err){speak(err.message);}}
});
$('#directDimension').innerHTML=Object.entries(DIMENSIONS).map(([d,label])=>`<option value="${d}">${label}</option>`).join('');
function directValues(){const d=$('#directDimension').value;$('#directValue').innerHTML=Object.entries(OPTIONS[d]).map(([v,label])=>`<option value="${v}">${label}</option>`).join('');$('#directValue').value=room.canvas[d];}
$('#directDimension').onchange=directValues;directValues();
$('#applyDirect').onclick=()=>{stop();comparison=null;comparisonSide=null;trialParameter(room,$('#directDimension').value,$('#directValue').value);render();speak('只试用当前参数；导出使用当前画布，没有新增长期规则。');};
$('#saveDirect').onclick=()=>openRule($('#directDimension').value,$('#directValue').value);
$('#undoMemory').onclick=()=>{if(!memoryUndo)return;stop();const snapshot=memoryUndo;memoryUndo=null;restorePreferenceSnapshot(room,snapshot);comparison=null;comparisonSide=null;render();speak('上次记忆操作已撤回。当前作品、文案和临时参数保持，不会被授权撤销删除。');};
function download(name,type,text){if(lastDownloadUrl)URL.revokeObjectURL(lastDownloadUrl);lastDownloadUrl=URL.createObjectURL(text instanceof Blob?text:new Blob([text],{type}));const link=$('#latestDownloadLink');link.href=lastDownloadUrl;link.download=name;link.textContent='重新保存 '+(name.endsWith('.png')?'PNG':name.endsWith('.svg')?'SVG':'文件');$('#latestExport').hidden=false;link.click();}
$('#exportBrief').onclick=()=>{if(room.pending||running)return;download('偏爱实验室-偏好说明书.md','text/markdown;charset=utf-8',briefMarkdown(room));speak('说明书已导出，线索和明确规则分开列出；其中可能包含你输入的反馈，请自行保管。');};
async function exportArtwork(format){if(room.pending||running||!layoutStatus(displayedRoom(),room.draftContent||content[room.content%content.length]).ok)return;const current=room.draftContent||content[room.content%content.length];if(format==='svg'){download('偏爱实验室-风格海报.svg','image/svg+xml;charset=utf-8',posterSvg(displayedRoom(),current));speak('已生成当前画布的 SVG；保留可编辑文字，不含私人反馈或记忆。');return;}const button=$('#exportPng'),exportSize=ARTBOARDS[room.artwork.format];button.disabled=true;button.textContent='正在生成…';try{const blob=await posterPng(displayedRoom(),current);download('偏爱实验室-海报.png','image/png',blob);speak(`已生成 ${exportSize.width} × ${exportSize.height} PNG；图片不含私人反馈或记忆。`);}catch(e){speak(e.message);}finally{button.textContent='导出 PNG ↗';render();}}
function copyDirty(){return hasUnappliedCopy(room.draftContent||content[room.content%content.length],room.artwork.details,editorDraft,editorDetails);}
function syncEditStatus(){const dirty=copyDirty();$('.canvas-update-bar').classList.toggle('is-dirty',dirty);$('#mobileDirty').hidden=!dirty;$('#canvasEditStatus').textContent=dirty?'有未应用编辑':'当前画布';$('#canvasEditNote').textContent=dirty?'输入已留在本机；更新后才进入作品。':'文案已应用，可以导出。';}
function requestExport(format){if(copyDirty()){exportRequest=format;$('#unappliedExportError').textContent='';$('#unappliedExportDialog').showModal();}else exportArtwork(format);$('.format-menu').open=false;}
$('#exportPoster').onclick=()=>requestExport('svg');$('#exportPng').onclick=()=>requestExport('png');
$('#exportCurrentCanvas').onclick=()=>{const format=exportRequest;exportRequest=null;$('#unappliedExportDialog').close();if(format)exportArtwork(format);};
$('#applyThenExport').onclick=()=>{if(!applyContent()){ $('#unappliedExportError').textContent=$('#contentStatus').textContent;return;}const format=exportRequest;exportRequest=null;$('#unappliedExportDialog').close();if(format)exportArtwork(format);};
$('#cancelUnappliedExport').onclick=()=>{exportRequest=null;$('#unappliedExportDialog').close();};
$('#unappliedExportDialog').addEventListener('cancel',()=>{exportRequest=null;});
let ruleDraft=null;
function showRuleReplacement(){const scope=$('#saveRuleScope').value,rules=replacedRules(room,ruleDraft.dimension,scope);$('#saveRuleReplaced').textContent='将替换：'+(rules.length?rules.map(m=>`${ctx[m.context]}「${OPTIONS[m.dimension][m.preference]}」`).join('、'):'没有旧规则')+'。其他维度不变。';}
function openRule(dimension,value){stop();comparison=null;comparisonSide=null;ruleDraft={dimension,value};$('#saveRuleDescription').textContent=`只保存${names[dimension]}：「${OPTIONS[dimension][value]}」。当前场景：${ctx[room.context]}。导出作品不需要保存。`;$('#saveRuleScope [value="current"]').disabled=room.context==='global';$('#saveRuleScope').value=room.context==='global'?'global':'current';showRuleReplacement();$('#saveRuleDialog').showModal();}
$('#saveRuleScope').onchange=showRuleReplacement;
$('#confirmRule').onclick=()=>{if(!ruleDraft)return;memoryUndo=JSON.stringify(room);savePreference(room,ruleDraft.dimension,ruleDraft.value,$('#saveRuleScope').value);ruleDraft=null;render();speak('已按确认范围保存这一项规则，可以撤回上次记忆操作。');};
$('#rememberDirection').onclick=()=>openRule('artDirection',room.canvas.artDirection);
function confirmReplaceEditor(includeCurrent=false,kind='content'){if(!editorDraft&&!editorDetails&&!(includeCurrent&&(room.draftContent||room.artwork.image||detailKeys.some(k=>room.artwork.details[k]))))return true;if(!window.confirm(kind==='candidate'?'采用候选将替换当前文案、活动信息、尺寸、构图、参数与主图。候选和已授权偏好保留，是否继续？':'替换当前文案及活动信息？未保存的编辑会被替换；主图、尺寸、候选与已授权偏好保留。'))return false;editorDraft=null;editorDetails=null;return true;}
function syncContentEditor(){const c=editorDraft||room.draftContent||content[room.content%content.length];['editCategory','editTitle','editSubtitle','editFooter'].forEach((id,i)=>$('#'+id).value=c[i].replace(/<br\s*\/?\s*>/gi,'\n'));detailIds.forEach((id,i)=>$('#'+id).value=(editorDetails||room.artwork.details)[detailKeys[i]]);}
$('#posterContentForm').addEventListener('input',e=>{if(!['editCategory','editTitle','editSubtitle','editFooter',...detailIds].includes(e.target.id))return;editorDetails=Object.fromEntries(detailIds.map((id,i)=>[detailKeys[i],$('#'+id).value]));editorDraft=['editCategory','editTitle','editSubtitle','editFooter'].map(id=>$('#'+id).value);persist();syncEditStatus();$('#contentStatus').textContent='文案草稿已保留；点更新画布后，比较和导出才使用新文案。没有写入偏好。';});
function applyContent(){if(room.pending||running)return false;const values=['editCategory','editTitle','editSubtitle','editFooter'].map(id=>$('#'+id).value.trim());const error=validateCopy(values);if(error){$('#contentStatus').textContent=error;return false;}stop();comparison=null;comparisonSide=null;room.draftContent=values;room.artwork.details=Object.fromEntries(detailIds.map((id,i)=>[detailKeys[i],$('#'+id).value.trim()]));editorDraft=null;editorDetails=null;room.log('edit_poster_content',{fields:['category','title','subtitle','footer'],preference_inferred:false});render();$('#contentPreset').value='custom';$('#contentStatus').textContent='画布已更新；没有写入任何偏好，导出会使用这份内容。';return true;}
$('#posterContentForm').onsubmit=e=>{e.preventDefault();if(applyContent()&&e.submitter?.id==='mobileApply')setMobileMode(false);};
function setMobileMode(editing){document.body.classList.toggle('mobile-editing',editing);$('#mobileCanvas').setAttribute('aria-pressed',String(!editing));$('#mobileEdit').setAttribute('aria-pressed',String(editing));const target=editing?$('.poster-content-editor'):$('.canvas-update-bar');target.scrollIntoView({block:'start',behavior:'instant'});if(!editing)$('#mobileCanvas').focus({preventScroll:true});}
$('#mobileEdit').onclick=()=>setMobileMode(true);$('#mobileCanvas').onclick=()=>setMobileMode(false);$('#mobileBackCanvas').onclick=()=>setMobileMode(false);
function previewDirection(value){
  if(!validChoice('artDirection',value)||room.pending)return;
  stop();comparison=null;comparisonSide=null;room.round=2;explorer=null;
  trialParameter(room,'artDirection',value);room.log('preview_direction',{direction:value,persisted:false});
  closeDirectionLibrary();
  render();syncContentEditor();speak('只切换本张构图；其他参数和长期记忆不变。可继续编辑、比较或导出。');
}
function renderDirections(c){
  if($('#directionGallery').hidden)return;
  $('#directionGallery').innerHTML=Object.entries(DIRECTIONS).map(([id,d])=>`<button type="button" class="direction-card" data-direction="${id}" aria-pressed="${displayedRoom().canvas.artDirection===id}"><span class="direction-thumbnail">${posterSvg({...room,canvas:{...room.canvas,artDirection:id}},c)}</span><strong>${d.name}</strong><span>${d.detail}</span><small>${d.use} · ${d.capacity}</small></button>`).join('')+`<button type="button" class="free-direction" data-direction="free">高级：自由参数<span>使用下方参数调整，不作为一种艺术风格</span></button>`;
}
function closeDirectionLibrary(){const dialog=$('#directionLibrary');$('#directionGallery').hidden=true;$('#openDirections').setAttribute('aria-expanded','false');$('#quickDirections').setAttribute('aria-expanded','false');if(dialog.open)dialog.close();galleryReturn?.focus({preventScroll:true});}
$('#openDirections').onclick=()=>{galleryReturn=$('#quickDirections');$('#directionGallery').hidden=false;$('#openDirections').setAttribute('aria-expanded','true');$('#quickDirections').setAttribute('aria-expanded','true');renderDirections(room.draftContent||content[room.content%content.length]);$('#directionLibrary').showModal();};
$('#quickDirections').onclick=()=>$('#openDirections').click();$('#closeDirectionLibrary').onclick=closeDirectionLibrary;$('#directionLibrary').addEventListener('cancel',e=>{e.preventDefault();closeDirectionLibrary();});
function renderCandidates(){
  $('#candidateList').innerHTML=candidates.length?candidates.map((candidate,i)=>`<article><div class="candidate-image">${posterSvg({...room,canvas:candidate.canvas,posterSettings:candidate.posterSettings,artwork:normalizeArtwork(candidate.artwork),draftContent:null},candidate.content)}</div><div><strong>${esc(OPTIONS.artDirection[candidate.canvas.artDirection])}</strong><span>${esc(candidate.content[1].replace(/\n/g,' '))}</span><button type="button" data-candidate="${i}">用这个继续</button><button type="button" data-remove-candidate="${i}" aria-label="移除候选 ${i+1}">移除</button></div></article>`).join(''):'<p class="empty">还没有候选。换方向前先留一张，最多两张，可随时移除。</p>';
}
$('#pinCandidate').onclick=()=>{if(candidates.length>=2||room.pending)return;const shown=displayedRoom();candidates.push(JSON.parse(JSON.stringify({canvas:shown.canvas,content:room.draftContent||content[room.content%content.length],posterSettings:room.posterSettings,artwork:room.artwork})));render();speak('已留下作品快照；没有保存审美规则。');};
document.addEventListener('click',e=>{
 const load=e.target.closest('[data-candidate]'),remove=e.target.closest('[data-remove-candidate]');
 if(load){if(room.pending||!confirmReplaceEditor(true,'candidate'))return;const candidate=candidates[Number(load.dataset.candidate)];if(!validCandidate(candidate))return;stop();comparison=null;comparisonSide=null;explorer=null;activePath='create';for(const [d,v] of Object.entries(candidate.canvas))trialParameter(room,d,v);room.draftContent=[...candidate.content];room.posterSettings={...candidate.posterSettings};room.artwork=normalizeArtwork(candidate.artwork);imageNotice='';render();syncContentEditor();speak('按候选继续编辑；原有偏好规则未改变。');}
 if(remove){candidates.splice(Number(remove.dataset.removeCandidate),1);render();}
});
$('#autoWrap').onclick=()=>{if(room.pending)return;const current=room.draftContent||content[room.content%content.length];stop();comparison=null;comparisonSide=null;room.draftContent=current.map((v,i)=>i===1||i===2?v.replace(/<br\s*\/?\s*>|\n/gi,''):v);room.posterSettings.lineBreaks='auto';render();syncContentEditor();speak('重新平衡了换行，文字全部保留；若仍过密，请减少文字或更换构图。');};
$('#reduceTitle').onclick=()=>{if(room.pending)return;stop();comparison=null;comparisonSide=null;room.posterSettings.titleScale=Math.max(.65,(room.posterSettings.titleScale||1)-.1);render();};
$('#titleScale').oninput=()=>{if(room.pending)return;stop();comparison=null;comparisonSide=null;room.posterSettings.titleScale=Number($('#titleScale').value)/100;render();};
$('#lineBreaks').onchange=()=>{if(room.pending)return;comparison=null;comparisonSide=null;room.posterSettings.lineBreaks=$('#lineBreaks').value;render();};
$('#densityControl').onchange=()=>{if(room.pending)return;comparison=null;comparisonSide=null;trialParameter(room,'layoutDensity',$('#densityControl').value);render();};
$('#contentPreset').onchange=()=>{if($('#contentPreset').value==='custom'||room.pending)return;if(!confirmReplaceEditor(true)){$('#contentPreset').value='custom';return;}stop();comparison=null;comparisonSide=null;const starter=contentStarters[Number($('#contentPreset').value)];room.draftContent=[...starter.copy];room.artwork.details={...starter.details};editorDetails=null;render();syncContentEditor();speak('已填入原创示例内容；构图和偏好保持不变。');};
$('#exportBriefJson').onclick=()=>{if(room.pending||running)return;download('偏爱实验室-偏好说明书.json','application/json;charset=utf-8',JSON.stringify(styleBrief(room),null,2));speak('已导出可重新导入的说明书；其中包含私人反馈依据，请自行保管。');};
$('#importBrief').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>262144)throw Error('说明书最大 256 KB。');importDraft=parseBrief(await file.text());const preview=importPreview(room,importDraft);$('#importSummary').innerHTML=preview.map(rule=>`<p><strong>${esc(names[rule.dimension])}：${esc(OPTIONS[rule.dimension][rule.value])}</strong><span>${esc(ctx[rule.scope])} · ${esc(rule.status)}</span><small>替换：${rule.replaces.length?rule.replaces.map(old=>esc(OPTIONS[old.dimension][old.value])).join('、'):'无同场景旧规则'}</small></p>`).join('');$('#importDialog').showModal();}catch(error){importDraft=null;speak(error.message)}finally{e.target.value='';}};
$('#cancelImport').onclick=()=>{importDraft=null;$('#importDialog').close();};
$('#confirmImport').onclick=()=>{if(!importDraft)return;try{stop();memoryUndo=JSON.stringify(room);const count=applyBrief(room,importDraft);comparison=null;comparisonSide=null;importDraft=null;$('#importDialog').close();render();speak(`已导入 ${count} 条规则，按当前场景应用；文案没有变化，可撤回本次导入。`);}catch(error){speak(error.message);$('#importDialog').close();}};
render();
syncContentEditor();
// A portfolio link may open a composition directly; this is a preview, never consent to memory.
const linkedDirection=new URLSearchParams(location.search).get('direction');
const navigationType=performance.getEntriesByType('navigation')[0]?.type;
if(linkedDirection&&validChoice('artDirection',linkedDirection)&&!(restoredCanvas&&['reload','back_forward'].includes(navigationType)))previewDirection(linkedDirection);

$('#rememberFeedback').onclick=()=>{if(lastFeedback)openRule(lastFeedback.dimension,lastFeedback.value);};
document.addEventListener('click',e=>{
 const intent=e.target.closest('[data-intent-index]');
 if(intent&&feedbackHints){const choice=feedbackHints.choices[Number(intent.dataset.intentIndex)];if(!choice)return;stop();comparison=null;comparisonSide=null;
  if(choice.setting==='titleScale'){room.posterSettings={...room.posterSettings,titleScale:Math.min(1.3,Math.max(.65,(room.posterSettings?.titleScale||1)+choice.delta))};lastFeedback=null;}
  else{trialParameter(room,choice.dimension,choice.value);lastFeedback={dimension:choice.dimension,value:choice.value};}
  feedbackHints=null;render();speak('按你点击的选项临时试用；未理解或执行整句要求，也未保存偏好。可检查画布后再决定。');
 }
 const revoke=e.target.closest('[data-revoke]');if(revoke){stop();memoryUndo=JSON.stringify(room);if(revokePreference(room,revoke.dataset.revoke)){comparison=null;comparisonSide=null;render();speak('已撤销这条场景规则。当前作品保留，今后不再按它整理；也可撤回上次记忆操作。');}}
});

$('#restoreSceneDirection').onclick=()=>{if(room.pending||running)return;stop();comparison=null;comparisonSide=null;if(restoreSceneDirection(room)){render();speak('已恢复本场景授权方向；其他临时参数、文案和记忆库保持。');}};
$('#artboardFormat').onchange=()=>{if(room.pending)return;stop();comparison=null;comparisonSide=null;room.artwork.format=$('#artboardFormat').value;render();speak('尺寸已切换并重新排版；不是拉伸原图。请检查文字与裁切后导出。');};
$('#posterImage').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;const token=++imageEpoch;try{const image=await imageFromFile(file);if(token!==imageEpoch)return;try{await storeImage(image);imageNotice='主图已保存在本机；不会上传，也不写入偏好。';}catch(err){imageNotice=err.message;}if(token!==imageEpoch)return;stop();comparison=null;comparisonSide=null;room.artwork.image=image;room.artwork.imageX=50;room.artwork.imageY=50;render();}catch(err){imageNotice=err.message;render();}finally{e.target.value='';}};
for(const id of ['imageFit','imageX','imageY'])$('#'+id).oninput=()=>{if(room.pending)return;comparison=null;comparisonSide=null;room.artwork[id]=id==='imageFit'?$('#'+id).value:Number($('#'+id).value);render();};
$('#removeImage').onclick=()=>{if(room.pending)return;imageEpoch++;comparison=null;comparisonSide=null;room.artwork.image=null;imageNotice='已移除本张主图；候选中的图片保留。';render();};
async function restoreArtworkImages(){for(const a of [room.artwork,...candidates.map(c=>c.artwork)].filter(Boolean)){if(a.image&&!a.image.dataUrl){try{const saved=await readImage(a.image.id);if(saved?.id===a.image.id)a.image=saved;}catch(err){imageNotice=err.message;}}}artworkFingerprint='';render();}
restoreArtworkImages();

$('#closeMemory').onclick=()=>{showBrain(false);$('#showBrain').focus({preventScroll:true});};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('brain-open')&&!document.querySelector('dialog[open]')){$('#closeMemory').click();}});
