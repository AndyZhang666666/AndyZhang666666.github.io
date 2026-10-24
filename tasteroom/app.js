import { Room, OPTIONS, parseFeedback, validChoice } from "./engine.js";
import { createComparison, applyComparison, comparisonIsCurrent, briefMarkdown, posterSvg, DIMENSIONS } from './experiments.js';
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
const room = new Room();
const STORE = "tasteroom-v1";
let timer,
  epoch = 0,
  running = false,
  queue = [],
  storageOK = true;
let mode = "mock";
let comparison=null,comparisonSide=null,memoryUndo=null;
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
  room.restore(localStorage.getItem(STORE));
} catch {
  storageOK = false;
}
const names = {
  layoutDensity: "留白",
  typography: "字体",
  alignment: "对齐",
  colorMood: "色彩",
  decorElements: "装饰",
};
const ctx = { global: "全局", personal: "日常审美", work: "工作汇报" };
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
function persist() {
  try {
    localStorage.setItem(STORE, room.save());
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
  const color = room.round === 1;
  $("#question").textContent = color
    ? "哪一种颜色，更像你？"
    : "哪一张，让你想多看一眼？";
  $("#round").textContent = color ? "色彩选择 · 2 / 2" : "版式选择 · 1 / 2";
  $("#choices").innerHTML = ["a", "b"]
    .map(
      (s, i) =>
        `<button class="choice" data-choice="${s}" aria-label="选择${i === 0 ? "A" : "B"}：${color ? (i === 0 ? "高对比撞色" : "克制单色") : i === 0 ? "紧凑网格" : "留白书刊"}"><div class="mini ${s} ${color ? (i === 0 ? "colorful" : "mono") : ""}"><span class="mini-top">周末灵感计划 / TasteRoom</span><div><div class="mini-title">无用之美<br>周末放映室</div><div class="graphic"></div></div><div class="mini-sub">把日常调慢一格。<br>看一部电影，聊一段生活。</div></div><div class="choice-label"><span>${color ? (i === 0 ? "高对比撞色" : "克制单色") : i === 0 ? "紧凑网格" : "留白书刊"}</span><span>偏爱这张 ↗</span></div></button>`,
    )
    .join("");
}
function renderMemories() {
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
  const ready = room.round === 2;
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
  }).forEach(([k, v]) => (p.dataset[k] = room.canvas[v]));
  const c = content[room.content % content.length];
  $("#posterCategory").textContent = c[0];
  $("#posterHeading").innerHTML = c[1];
  $("#posterSub").innerHTML = c[2];
  $("#posterFooter").textContent = c[3];
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
    document.body.classList.remove("brain-open");
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
  $('#exportPoster').disabled=!ready||!!room.pending||running;
  $('#undoMemory').disabled=!memoryUndo||!!room.pending||running;
  $$(".phases li").forEach((el, i) =>
    el.classList.toggle(
      "current",
      i ===
        (ready
          ? room.logs.some((l) => l.tool === "resolve_conflict")
            ? 2
            : 1
          : 0),
    ),
  );
  renderComparison();
  persist();
}
function renderComparison(){
  if(comparison&&!comparisonIsCurrent(room,comparison)){comparison=null;comparisonSide=null;}
  $('#comparisonPanel').hidden=!comparison;
  if(!comparison)return;
  $('#comparisonDimension').value=comparison.dimension;
  const container=$('#comparisonVariants');container.replaceChildren();
  comparison.variants.forEach((variant,i)=>{
    const wrap=document.createElement('div');wrap.className='comparison-variant';
    const poster=$('#poster').cloneNode(true);poster.removeAttribute('id');poster.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));
    Object.entries({density:'layoutDensity',typography:'typography',alignment:'alignment',color:'colorMood',decor:'decorElements'}).forEach(([attribute,d])=>poster.dataset[attribute]=variant[d]);
    poster.setAttribute('aria-label',`${i===0?'A':'B'} 方案：${OPTIONS[comparison.dimension][variant[comparison.dimension]]}`);
    const button=document.createElement('button');button.type='button';button.dataset.comparisonSide=i===0?'a':'b';button.textContent=`选 ${i===0?'A':'B'} · ${OPTIONS[comparison.dimension][variant[comparison.dimension]]}`;
    button.setAttribute('aria-pressed',String(comparisonSide===button.dataset.comparisonSide));wrap.append(poster,button);container.append(wrap);
  });
  $('#comparisonDecision').hidden=!comparisonSide;
  $('[data-comparison-scope="current"]').disabled=room.context==='global';
  $('[data-comparison-scope="current"] small').textContent=room.context==='global'?'请先切到日常或工作':'不改变其他场景';
  if(comparisonSide){const v=comparison.variants[comparisonSide==='a'?0:1][comparison.dimension];$('#comparisonChoice').textContent=`你选择了「${OPTIONS[comparison.dimension][v]}」。这里只记录${DIMENSIONS[comparison.dimension]}，不推断其他偏好。应用前，请决定范围：`;}
}
function organize() {
  stop();
  comparison=null;comparisonSide=null;memoryUndo=null;
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
  comparison=null;comparisonSide=null;memoryUndo=null;
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
      "本地规则暂时没理解这句话，或其中包含多项/否定要求。可展开“直接选参数”逐项调整；不会只取半句擅自写入记忆。",
    );
    render();
    return;
  }
  const r = room.feedback(parsed.dimension, parsed.value, text);
  speak(
    parserLabel +
      "：" +
      (r === "conflict"
        ? "先暂停。偏爱不该被一次新要求悄悄覆盖。"
        : "已把这条明确反馈应用到当前场景。"),
  );
  render();
  if (r === "conflict") $("#conflict button").focus();
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.choice) {
    room.choose(b.dataset.choice);
    render();
    if (room.round === 2) {
      speak("两次选择只是猜测。接下来看看它会怎样整理。");
      organize();
    }
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
    comparison=null;memoryUndo=null;
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
      comparison=null;memoryUndo=room.save();
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
    comparison=null;memoryUndo=room.save();
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
  stop();
  comparison=null;memoryUndo=null;
  room.content++;
  room.reconcile();
  speak("换了新内容；所有排版工具已重新读取当前场景的记忆。本次例外已结束。");
  render();
};
$("#cancelConflict").onclick = () => {
  room.pending = null;
  speak("已取消这次纠偏，保留原画布和记忆。");
  render();
};
$("#reset").onclick = () => {
  stop();
  comparison=null;comparisonSide=null;memoryUndo=null;
  room.reset();
  try {
    localStorage.removeItem(STORE);
  } catch {}
  showBrain(false);
  render();
};
function showBrain(on) {
  document.body.classList.toggle("brain-open", on);
  $("#showCanvas").setAttribute("aria-pressed", !on);
  $("#showBrain").setAttribute("aria-pressed", on);
}
$("#showCanvas").onclick = () => showBrain(false);
$("#showBrain").onclick = () => showBrain(true);
$('#startComparison').onclick=()=>{
  stop();comparison=createComparison(room,$('#comparisonDimension').value);comparisonSide=null;render();
  $('#comparisonPanel').scrollIntoView({block:'nearest'});speak('现在只比较一项；选择不会立即写入记忆。');
};
$('#comparisonDimension').onchange=()=>{comparison=createComparison(room,$('#comparisonDimension').value);comparisonSide=null;render();};
$('#closeComparison').onclick=()=>{comparison=null;comparisonSide=null;render();speak('已关闭对照；尚未确认的选择不会被记住。');};
$('#skipComparison').onclick=()=>{try{applyComparison(room,comparison,'skip');comparison=null;comparisonSide=null;render();speak('两张都不选，没有新增或修改任何偏好。');}catch(e){speak(e.message);}};
document.addEventListener('click',e=>{
  const side=e.target.closest('[data-comparison-side]');if(side){comparisonSide=side.dataset.comparisonSide;render();return;}
  const scope=e.target.closest('[data-comparison-scope]');if(scope){try{stop();memoryUndo=null;applyComparison(room,comparison,comparisonSide,scope.dataset.comparisonScope);comparison=null;comparisonSide=null;render();speak('只更新了本次对照的维度和你授权的范围。换内容或场景，继续验证是否适用。');}catch(err){speak(err.message);}}
});
$('#directDimension').innerHTML=Object.entries(DIMENSIONS).map(([d,label])=>`<option value="${d}">${label}</option>`).join('');
function directValues(){const d=$('#directDimension').value;$('#directValue').innerHTML=Object.entries(OPTIONS[d]).map(([v,label])=>`<option value="${v}">${label}</option>`).join('');$('#directValue').value=room.canvas[d];}
$('#directDimension').onchange=directValues;directValues();
$('#applyDirect').onclick=()=>{stop();comparison=null;memoryUndo=null;const d=$('#directDimension').value,v=$('#directValue').value;const status=room.feedback(d,v,`本人通过参数控件明确选择${OPTIONS[d][v]}`);render();speak(status==='conflict'?'先选择记忆范围，不会直接覆盖旧规则。':'已只调整这一项，并记在当前场景。');};
$('#undoMemory').onclick=()=>{if(!memoryUndo)return;stop();const snapshot=memoryUndo;memoryUndo=null;room.restore(snapshot);comparison=null;render();speak('上次删除、锁定或迁移已撤回；画布按恢复后的记忆重新生成。');};
function download(name,type,text){const url=URL.createObjectURL(new Blob([text],{type})),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('#exportBrief').onclick=()=>{if(room.pending||running)return;download('偏爱实验室-偏好说明书.md','text/markdown;charset=utf-8',briefMarkdown(room));speak('说明书已导出，线索和明确规则分开列出；其中可能包含你输入的反馈，请自行保管。');};
$('#exportPoster').onclick=()=>{if(room.pending||running)return;download('偏爱实验室-风格海报.svg','image/svg+xml;charset=utf-8',posterSvg(room,content[room.content%content.length]));speak('已导出按当前风格重排的矢量海报；没有调用生图服务。');};
render();
