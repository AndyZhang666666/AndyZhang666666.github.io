export const OPTIONS = {
  artDirection: { free: "自由参数", swiss: "瑞士现代主义", deconstructed: "解构主义" },
  layoutDensity: { compact: "紧凑", balanced: "均衡", airy: "大留白" },
  typography: {
    rational_sans: "利落无衬线",
    editorial_serif: "书刊衬线",
    mono_tech: "等宽科技",
  },
  alignment: {
    strict_grid: "严格网格",
    asymmetric: "错落排版",
    centered: "居中",
  },
  colorMood: {
    monochrome: "克制单色",
    muted_warm: "温柔暖色",
    high_contrast: "高对比撞色",
  },
  decorElements: {
    none: "不加装饰",
    minimal_lines: "细线点缀",
    bold_shapes: "大胆几何",
  },
};
export const validChoice = (dimension, value) =>
  typeof dimension === "string" &&
  typeof value === "string" &&
  Object.hasOwn(OPTIONS, dimension) &&
  Object.hasOwn(OPTIONS[dimension], value);
export const BASE = {
  artDirection: "free",
  layoutDensity: "compact",
  typography: "rational_sans",
  alignment: "strict_grid",
  colorMood: "muted_warm",
  decorElements: "bold_shapes",
};
const copy = (x) => JSON.parse(JSON.stringify(x));
export class Room {
  constructor() {
    this.reset();
  }
  reset() {
    this.memories = [];
    this.history = [];
    this.logs = [];
    this.context = "personal";
    this.canvas = { ...BASE };
    this.base = { ...BASE };
    this.pending = null;
    this.round = 0;
    this.content = 0;
    this.draftContent = null;
    this.seq = 0;
    this.focus = null;
  }
  log(tool, args) {
    this.logs.push({ id: ++this.seq, tool, args: copy(args) });
    this.logs = this.logs.slice(-80);
  }
  effective() {
    return Object.keys(OPTIONS)
      .map(
        (d) =>
          this.memories
            .filter(
              (m) =>
                m.dimension === d &&
                m.status === "active" &&
                (m.context === "global" || m.context === this.context),
            )
            .sort(
              (a, b) =>
                (b.type === "explicit") - (a.type === "explicit") ||
                (b.context === this.context) - (a.context === this.context) ||
                b.confidence - a.confidence ||
                b.order - a.order,
            )[0],
      )
      .filter(Boolean);
  }
  upsert(d, v, type, context, reason, confidence = 0.85) {
    if (!validChoice(d, v)) throw Error("不支持的画布参数");
    this.memories
      .filter(
        (m) =>
          m.dimension === d && m.context === context && m.status === "active",
      )
      .forEach((m) => (m.status = "overridden"));
    const m = {
      id: "mem_" + ++this.seq,
      dimension: d,
      preference: v,
      type,
      confidence: type === "explicit" ? 1 : confidence,
      context,
      sourceReason: reason,
      status: "active",
      order: this.seq,
    };
    this.memories.push(m);
    this.log("upsert_memory", {
      dimension: d,
      preference: v,
      type,
      context,
      reason,
      memory_id: m.id,
    });
    return m;
  }
  choose(side) {
    if (this.round >= 2) return;
    const n = this.round++;
    if (n === 0) {
      this.upsert(
        "layoutDensity",
        side === "a" ? "compact" : "airy",
        "implicit",
        "global",
        "第一轮版式选择；留白只是对选择原因的推测",
        0.72,
      );
      this.upsert(
        "typography",
        side === "a" ? "rational_sans" : "editorial_serif",
        "implicit",
        "personal",
        "第一轮卡片含混合特征，字体偏好有待纠偏",
        0.78,
      );
    } else
      this.upsert(
        "colorMood",
        side === "a" ? "high_contrast" : "monochrome",
        "implicit",
        "global",
        "第二轮色彩选择；启发式置信度，非统计概率",
        0.76,
      );
  }
  update(d, v, id) {
    const m = this.memories.find((m) => m.id === id);
    if (!validChoice(d, v) || !m) throw Error("工具参数或记忆依据无效");
    const step = {
      id: "step_" + ++this.seq,
      dimension: d,
      value: v,
      previous: this.canvas[d],
      memory: id,
      active: true,
      context: this.context,
    };
    this.history.push(step);
    this.canvas[d] = v;
    this.focus = id;
    this.log("update_canvas", {
      property: d,
      value: v,
      reason_memory_id: id,
      step_id: step.id,
    });
    return step;
  }
  rollback(id) {
    const s = this.history.find((s) => s.id === id);
    if (!s || !s.active) return;
    s.active = false;
    this.rebuild();
    this.log("rollback_canvas", { step_id: id });
  }
  redo() {
    const s = [...this.history].reverse().find((s) => !s.active);
    if (!s) return;
    s.active = true;
    this.rebuild();
    this.log("redo_canvas", { step_id: s.id });
  }
  rebuild() {
    this.canvas = { ...this.base };
    for (const s of this.history)
      if (s.active && s.context === this.context)
        this.canvas[s.dimension] = s.value;
  }
  reconcile() {
    this.base = { ...BASE };
    this.history = [];
    this.canvas = { ...BASE };
    for (const m of this.effective())
      this.update(m.dimension, m.preference, m.id);
  }
  feedback(d, v, reason) {
    if (!validChoice(d, v)) throw Error("不支持的反馈");
    const old = this.effective().find((m) => m.dimension === d);
    if (
      old &&
      old.preference !== v &&
      (old.type === "explicit" || old.confidence >= 0.7)
    ) {
      this.pending = { dimension: d, value: v, reason, old: copy(old) };
      this.log("ask_conflict_resolution", {
        conflict_dimension: d,
        old_val: old.preference,
        new_val: v,
        suggested_options: ["once", "global", "branch"],
      });
      return "conflict";
    }
    const m = this.upsert(d, v, "explicit", this.context, reason);
    this.update(d, v, m.id);
    return "applied";
  }
  resolve(scope) {
    if (!["once", "global", "branch"].includes(scope) || !this.pending) return;
    const p = this.pending;
    this.pending = null;
    if (scope === "once") {
      // transient evidence: shown in trace but not in long-term memories
      const m = {
        id: "once_" + ++this.seq,
        dimension: p.dimension,
        preference: p.value,
        type: "explicit",
        context: this.context,
        confidence: 1,
        sourceReason: "仅本次：" + p.reason,
        status: "overridden",
      };
      this.memories.push(m);
      this.update(p.dimension, p.value, m.id);
    } else {
      if (scope === "global")
        this.memories
          .filter((m) => m.dimension === p.dimension && m.status === "active")
          .forEach((m) => (m.status = "overridden"));
      else this.context = "work";
      this.upsert(
        p.dimension,
        p.value,
        "explicit",
        scope === "global" ? "global" : "work",
        p.reason,
      );
      this.reconcile();
    }
    this.log("resolve_conflict", { scope });
  }
  manage(id, action, value) {
    const m = this.memories.find((m) => m.id === id);
    if (!m) return;
    if (action === "delete")
      this.memories = this.memories.filter((m) => m.id !== id);
    if (action === "lock") {
      m.type = "explicit";
      m.confidence = 1;
      m.sourceReason += "；用户明确锁定";
    }
    if (
      action === "context" &&
      ["global", "work", "personal"].includes(value)
    ) {
      this.memories
        .filter(
          (x) =>
            x.id !== id &&
            x.dimension === m.dimension &&
            x.context === value &&
            x.status === "active",
        )
        .forEach((x) => (x.status = "overridden"));
      m.context = value;
    }
    this.log("manage_memory", { id, action, value: value ?? null });
    this.reconcile();
  }
  switchContext(c) {
    if (!["global", "personal", "work"].includes(c) || this.pending) return;
    this.context = c;
    this.reconcile();
  }
  restore(raw) {
    try {
      const s = JSON.parse(raw);
      if (
        s.version !== 1 ||
        !Array.isArray(s.memories) ||
        s.memories.length > 150
      )
        return false;
      if (
        !s.memories.every(
          (m) =>
            typeof m.id === "string" &&
            validChoice(m.dimension, m.preference) &&
            ["implicit", "explicit"].includes(m.type) &&
            ["global", "work", "personal"].includes(m.context) &&
            ["active", "overridden"].includes(m.status) &&
            typeof m.sourceReason === "string" &&
            Number.isFinite(m.confidence) &&
            m.confidence >= 0 &&
            m.confidence <= 1 &&
            Number.isFinite(m.order),
        )
      )
        return false;
      this.memories = s.memories;
      this.seq = Math.max(0, ...s.memories.map((m) => m.order)) + 1;
      this.round = s.round === 2 ? 2 : 0;
      this.context = ["global", "personal", "work"].includes(s.context)
        ? s.context
        : "personal";
      this.content = Number.isInteger(s.content) && s.content >= 0 && s.content <= 100000 ? s.content : 0;
      this.draftContent = Array.isArray(s.draftContent) && s.draftContent.length === 4 && s.draftContent.every(v=>typeof v==='string'&&v.length<=180) ? s.draftContent : null;
      this.pending = null;
      this.reconcile();
      return true;
    } catch {
      return false;
    }
  }
  save() {
    return JSON.stringify({
      version: 1,
      memories: [
        ...this.memories.filter(m=>m.status==='overridden'&&!m.id.startsWith('once_')).slice(-135),
        ...this.memories.filter(m=>m.status==='active'&&!m.id.startsWith('once_')),
      ],
      round: this.round,
      context: this.context,
      content: this.content,
      draftContent: this.draftContent,
    });
  }
}
export function parseFeedback(text) {
  const t = text.trim();
  // A negation is not permission to choose an arbitrary alternative.
  if(/(?:不要|别|不喜欢|不想).{0,6}(?:居中|暖色|撞色|等宽|网格|几何)/.test(t))return null;
  if(/紧凑.*留白|留白.*紧凑/.test(t) && !/不要.*留白/.test(t))return null;
  const specs = [
    ["artDirection", "swiss", /瑞士|swiss/i],
    ["artDirection", "deconstructed", /解构|deconstruct/i],
    ["typography", "rational_sans", /无衬线|利落|不要衬线|别.*衬线|sans/i],
    ["typography", "mono_tech", /等宽|mono/i],
    ["typography", "editorial_serif", /衬线|书刊|serif/i],
    ["layoutDensity", "compact", /紧凑|紧一点|太空|不要.*留白/],
    ["layoutDensity", "airy", /留白|呼吸|太挤|松一点/],
    ["colorMood", "monochrome", /单色|克制|太花|黑白/],
    ["colorMood", "high_contrast", /撞色|对比|鲜艳/],
    ["colorMood", "muted_warm", /暖色|温柔/],
    ["alignment", "centered", /居中/],
    ["alignment", "asymmetric", /错落|不对称/],
    ["alignment", "strict_grid", /网格|对齐/],
    ["decorElements", "none", /去掉装饰|不要装饰/],
    ["decorElements", "minimal_lines", /细线/],
    ["decorElements", "bold_shapes", /几何/],
  ];
  const matched = specs.filter(x=>x[2].test(t));
  if(new Set(matched.map(x=>x[0])).size>1)return null;
  const hit = matched[0];
  return hit
    ? { dimension: hit[0], value: hit[1], reason: t.slice(0, 400) }
    : null;
}
