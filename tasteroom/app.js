import { Room, OPTIONS, parseFeedback, validChoice } from "./engine.js";
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
              `<article class="memory ${room.focus === m.id ? "focused" : ""}"><div class="memory-title"><b>${esc(OPTIONS[m.dimension][m.preference])}</b><span>${type === "explicit" ? "明确锁定" : Math.round(m.confidence * 100) + "% 推测"}</span></div><p>${esc(m.sourceReason)}</p><div class="memory-actions"><select aria-label="${esc(names[m.dimension])}记忆的场景" data-memory-context="${m.id}">${Object.entries(
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
  persist();
}
function organize() {
  stop();
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
      "本地规则暂时没理解这句话。试试“多留白”“用无衬线”“单色”“居中”或快捷反馈；不会写入猜测记忆。",
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
render();
