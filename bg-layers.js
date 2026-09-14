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

  function init() {
    var about = document.getElementById('about');
    var ai = document.getElementById('ai');

    var narrow = window.matchMedia && window.matchMedia('(max-width: 900px)').matches;

    // #about：产品经理术语
    buildWords(about, PM_WORDS, narrow ? 7 : 15);
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
    }
  }, 150);
})();
