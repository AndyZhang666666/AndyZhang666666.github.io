/* ============================================================
   板块背景层 · bg-layers.js
   ------------------------------------------------------------
   #about  → 产品经理术语水印
   #ai     → AI 术语水印 + 节点连线
   并负责两块的入场节奏（正文分步、原则卡、AI 条目）
   纯装饰，不注入可交互元素。
   ============================================================ */

(function () {
  'use strict';

  function reduced() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ---------- 词表 ---------- */
  var PM_WORDS = [
    'Funnel', 'Retention', 'A/B Test', 'Eval', 'PRD',
    'North Star', 'Cohort', 'SQL', 'LTV', 'CAC',
    'Roadmap', 'User Story', 'Backlog', 'Ship', 'Iterate'
  ];
  var AI_WORDS = [
    'Agent', 'Prompt', 'Context', 'Inference', 'Embedding',
    'Fine-tune', 'RAG', 'Eval Harness', 'Latency', 'Token',
    'Guardrail', 'Tool Use', 'Multi-modal', 'Grounding'
  ];

  /* 固定的疏密布局（百分比坐标 + 漂移方向），避免每次刷新位置乱跳 */
  var SPOTS = [
    { x: 4,  y: 12, dx: 12,  dy: -16 },
    { x: 22, y: 6,  dx: -14, dy: 12  },
    { x: 41, y: 17, dx: 10,  dy: 14  },
    { x: 62, y: 9,  dx: -12, dy: -12 },
    { x: 80, y: 15, dx: 14,  dy: 10  },
    { x: 92, y: 5,  dx: -10, dy: 16  },
    { x: 8,  y: 38, dx: 16,  dy: 12  },
    { x: 30, y: 46, dx: -12, dy: -14 },
    { x: 53, y: 35, dx: 12,  dy: 16  },
    { x: 74, y: 44, dx: -16, dy: 10  },
    { x: 90, y: 33, dx: 10,  dy: -14 },
    { x: 14, y: 68, dx: -14, dy: 14  },
    { x: 36, y: 76, dx: 12,  dy: -12 },
    { x: 59, y: 66, dx: -10, dy: 16  },
    { x: 82, y: 74, dx: 14,  dy: -10 },
    { x: 68, y: 90, dx: -12, dy: -14 },
    { x: 26, y: 92, dx: 12,  dy: 12  }
  ];

  /* ---------- 建背景词层 ---------- */
  function buildWords(section, words, count) {
    if (!section) return;
    if (section.querySelector(':scope > .sec-bg')) return;   // 已建过

    var bg = document.createElement('div');
    bg.className = 'sec-bg';
    bg.setAttribute('aria-hidden', 'true');

    var spots = SPOTS.slice(0, count);
    spots.forEach(function (s, i) {
      var w = document.createElement('span');
      w.className = 'sec-bg-word';
      w.textContent = words[i % words.length];
      w.style.left = s.x + '%';
      w.style.top = s.y + '%';
      w.style.setProperty('--dx', s.dx + 'px');
      w.style.setProperty('--dy', s.dy + 'px');
      w.style.setProperty('--dur', (48 + (i % 5) * 11) + 's');
      w.style.setProperty('--delay', (-(i * 2.7)).toFixed(1) + 's');
      bg.appendChild(w);
    });

    section.insertBefore(bg, section.firstChild);
  }


  /* ---------- 关于我：产品结构图形（流程 / 漏斗 / 柱状 / 坐标）---------- */
  function buildSchematic(section) {
    if (!section) return;
    var bg = section.querySelector(':scope > .sec-bg');
    if (!bg || bg.querySelector('.sec-bg-schematic')) return;

    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'sec-bg-schematic');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');

    function el(tag, attrs) {
      var n = document.createElementNS(NS, tag);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      return n;
    }
    function node(x, y, r, i) {
      var c = el('circle', { class: 'schem-node-fill', cx: x, cy: y, r: (r || 0.45) });
      c.style.setProperty('--dur', (5 + (i % 4) * 1.3).toFixed(1) + 's');
      c.style.setProperty('--delay', (-(i * 0.8)).toFixed(1) + 's');
      return c;
    }

    // A. 顶部：一条带节点的流程链（左 → 右），4 个节点
    var flowY = 14, xs = [7, 24, 41, 58];
    for (var k = 0; k < xs.length - 1; k++) {
      svg.appendChild(el('path', {
        class: 'schem-flow',
        d: 'M' + xs[k] + ' ' + flowY + ' H' + xs[k + 1]
      }));
    }
    xs.forEach(function (x, i) { svg.appendChild(node(x, flowY, 0.5, i)); });

    // B. 右上：漏斗（三层梯形轮廓）
    var fx = 70, fy = 8, fw = 26;
    svg.appendChild(el('path', {
      class: 'schem-funnel',
      d: 'M' + fx + ' ' + fy + ' H' + (fx + fw) +
         ' L' + (fx + fw * 0.66) + ' ' + (fy + 7) +
         ' L' + (fx + fw * 0.34) + ' ' + (fy + 7) + ' Z'
    }));
    svg.appendChild(el('path', {
      class: 'schem-funnel',
      d: 'M' + (fx + fw * 0.36) + ' ' + (fy + 10) + ' H' + (fx + fw * 0.64) +
         ' L' + (fx + fw * 0.55) + ' ' + (fy + 16) +
         ' L' + (fx + fw * 0.45) + ' ' + (fy + 16) + ' Z'
    }));

    // C. 左中：一组递增的柱（增长曲线）
    var bx = 6, by = 44, bw = 3.2, gap = 2.2;
    [5, 8, 7, 12, 15, 14, 19].forEach(function (h, i) {
      svg.appendChild(el('rect', {
        class: 'schem-bar',
        x: (bx + i * (bw + gap)).toFixed(1), y: (by - h).toFixed(1),
        width: bw, height: h, rx: 0.4
      }));
    });
    // 柱顶连一条趋势线（虚线）
    svg.appendChild(el('path', {
      class: 'schem-flow',
      d: 'M' + (bx + bw / 2) + ' ' + (by - 5) +
         ' L' + (bx + (bw + gap) + bw / 2) + ' ' + (by - 8) +
         ' L' + (bx + 2 * (bw + gap) + bw / 2) + ' ' + (by - 7) +
         ' L' + (bx + 3 * (bw + gap) + bw / 2) + ' ' + (by - 12) +
         ' L' + (bx + 4 * (bw + gap) + bw / 2) + ' ' + (by - 15) +
         ' L' + (bx + 5 * (bw + gap) + bw / 2) + ' ' + (by - 14) +
         ' L' + (bx + 6 * (bw + gap) + bw / 2) + ' ' + (by - 19)
    }));

    // D. 右下：坐标轴 + 折线（留存曲线意象）
    var ox = 58, oy = 78, ow = 32, oh = 16;
    svg.appendChild(el('path', { class: 'schem-axis', d: 'M' + ox + ' ' + oy + ' V' + (oy - oh) }));
    svg.appendChild(el('path', { class: 'schem-axis', d: 'M' + ox + ' ' + oy + ' H' + (ox + ow) }));
    svg.appendChild(el('path', {
      class: 'schem-flow',
      d: 'M' + ox + ' ' + (oy - oh) +
         ' C' + (ox + 5) + ' ' + (oy - oh + 3) + ', ' + (ox + 10) + ' ' + (oy - 6) + ', ' + (ox + 18) + ' ' + (oy - 5) +
         ' S' + (ox + ow - 4) + ' ' + (oy - 3) + ', ' + (ox + ow) + ' ' + (oy - 3)
    }));
    svg.appendChild(node(ox + 18, oy - 5, 0.42, 7));
    svg.appendChild(node(ox + ow, oy - 3, 0.42, 9));

    // E. 中下：一个决策菱形（判断节点）
    var dx = 30, dy = 74, ds = 4.2;
    svg.appendChild(el('path', {
      class: 'schem-funnel',
      d: 'M' + dx + ' ' + (dy - ds) + ' L' + (dx + ds) + ' ' + dy +
         ' L' + dx + ' ' + (dy + ds) + ' L' + (dx - ds) + ' ' + dy + ' Z'
    }));

    // F. 中部散点：三两个游离节点，填补空区
    [[46, 52, 0.4], [82, 40, 0.35], [20, 88, 0.35]].forEach(function (p, i) {
      svg.appendChild(node(p[0], p[1], p[2], 11 + i));
    });

    bg.appendChild(svg);
  }

  /* ---------- AI 板块：节点连线 ---------- */
  function buildNet(section) {
    if (!section || section.querySelector(':scope > .sec-bg .sec-bg-net')) return;
    var bg = section.querySelector(':scope > .sec-bg');
    if (!bg) return;

    // 固定的一组节点（百分比坐标），连线取部分组合，形成不对称的稀疏图
    var NODES = [
      [10, 22], [26, 12], [40, 30], [22, 52], [44, 62],
      [58, 20], [70, 40], [62, 72], [80, 22], [88, 48],
      [76, 82], [34, 84], [16, 74], [50, 8], [92, 68]
    ];
    var EDGES = [
      [0, 1], [1, 2], [2, 4], [0, 3], [3, 4], [4, 5],
      [5, 6], [5, 8], [6, 7], [7, 11], [8, 9], [9, 6],
      [7, 10], [10, 14], [3, 12], [11, 12], [1, 13], [13, 5]
    ];
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'sec-bg-net');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('viewBox', '0 0 100 100');

    // 先画线，再画点，点压在线上面
    EDGES.forEach(function (e) {
      var a = NODES[e[0]], b = NODES[e[1]];
      if (!a || !b) return;
      var ln = document.createElementNS(NS, 'line');
      ln.setAttribute('x1', a[0]); ln.setAttribute('y1', a[1]);
      ln.setAttribute('x2', b[0]); ln.setAttribute('y2', b[1]);
      ln.setAttribute('vector-effect', 'non-scaling-stroke');
      svg.appendChild(ln);
    });
    NODES.forEach(function (n, i) {
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', n[0]); c.setAttribute('cy', n[1]);
      c.setAttribute('r', i % 3 === 0 ? 0.55 : 0.38);
      c.setAttribute('vector-effect', 'non-scaling-stroke');
      c.style.setProperty('--dur', (5.5 + (i % 4) * 1.6).toFixed(1) + 's');
      c.style.setProperty('--delay', (-(i * 0.9)).toFixed(1) + 's');
      svg.appendChild(c);
    });

    bg.appendChild(svg);
  }

  /* ---------- 观察：一段段进入 ---------- */
  function observe(selector, cls, step, delayBase) {
    var els = document.querySelectorAll(selector);
    if (!els.length) return;
    if (reduced()) {
      els.forEach(function (el) { el.classList.add(cls); });
      return;
    }
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add(cls); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var idx = +el.dataset.bgIdx || 0;
        el.style.setProperty('--ab-delay', (delayBase + idx * step) + 'ms');
        el.classList.add(cls);
        io.unobserve(el);
      });
    }, { threshold: 0.25, rootMargin: '0px 0px -8% 0px' });

    els.forEach(function (el, i) {
      el.dataset.bgIdx = i;
      // 已在视口内的立即处理，避免首屏空白
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.9) {
        el.style.setProperty('--ab-delay', (delayBase + i * step) + 'ms');
        el.classList.add(cls);
      } else {
        io.observe(el);
      }
    });
  }


  /* ---------- 关于 AI：每条下方补引用链接 ---------- */
  function attachRefs() {
    var items = document.querySelectorAll('.ai-view');
    if (!items.length) return;
    var refs = [];
    try { refs = (typeof data !== 'undefined' && data.aiViews && data.aiViews.items) || []; } catch (e) { refs = []; }
    if (!refs.length) {
      fetch('data.json').then(function (r) { return r.json(); }).then(function (j) {
        var items = j.aiViews && j.aiViews.items || [];
        Array.prototype.forEach.call(document.querySelectorAll('.ai-view'), function (card, i) {
          if (card.querySelector('.ai-view-ref')) return;
          var r2 = items[i];
          if (!r2 || !r2.refUrl) return;
          var a2 = document.createElement('a');
          a2.className = 'ai-view-ref';
          a2.href = r2.refUrl; a2.target = '_blank'; a2.rel = 'noopener';
          a2.textContent = r2.refLabel || r2.refUrl;
          card.appendChild(a2);
        });
      }).catch(function () {});
      return;
    }
    Array.prototype.forEach.call(items, function (card, i) {
      if (card.querySelector('.ai-view-ref')) return;
      var r = refs[i];
      if (!r || !r.refUrl) return;
      var a = document.createElement('a');
      a.className = 'ai-view-ref';
      a.href = r.refUrl;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = r.refLabel || r.refUrl;
      card.appendChild(a);
    });
  }

  function init() {
    var about = document.getElementById('about');
    var ai = document.getElementById('ai');

    var narrow = window.matchMedia && window.matchMedia('(max-width: 900px)').matches;

    // #about：产品经理术语
    buildWords(about, PM_WORDS, narrow ? 7 : 15);
    buildSchematic(about);
    // #ai：AI 术语 + 节点连线
    buildWords(ai, AI_WORDS, narrow ? 7 : 14);
    buildNet(ai);

    // 入场节奏
    observe('.about-main .about-body', 'ab-in', 130, 0);
    observe('.principle-card', 'pc-in', 0, 0);
    observe('.ai-view', 'av-in', 0, 0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // app.js 是异步 fetch 数据后渲染的：等它把 facts / principles / ai-view 写进去
  var tries = 0;
  var t = setInterval(function () {
    tries += 1;
    var done = document.querySelectorAll('.principle-card').length > 0 &&
               document.querySelectorAll('.ai-view').length > 0;
    if (done || tries > 40) {
      clearInterval(t);
      observe('.about-main .about-body', 'ab-in', 130, 0);
      observe('.principle-card', 'pc-in', 0, 0);
      observe('.ai-view', 'av-in', 0, 0);
      attachRefs();
    }
  }, 150);
})();
