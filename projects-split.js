/* ============================================================
   项目区分组 · projects-split.js
   ------------------------------------------------------------
   把 #projectGrid 里由 app.js 渲染出的 .project-card 按规则
   移动到两组容器里（不重渲染，保留 embed.js / tilt / reveal 绑定）：
     .pgroup-main   AI 产品与增长
     .pgroup-poker  德州扑克（含还未上线的占位卡）
   依赖：#projectGrid 已存在；卡片结构见 app.js renderProjects()
   ============================================================ */

(function () {
  'use strict';

  var GRID_ID = 'projectGrid';
  var ORDER = ['main', 'poker'];
  var GROUPS = {
    main:  { key: 'main',  zh: 'AI 产品与增长', en: 'AI Product & Growth' },
    poker: { key: 'poker', zh: '德州扑克',       en: "Texas Hold'em" }
  };
  /* 每组保底的占位卡数量：数据里已有的 .placeholder 会先计入，不足才补。
     扑克 ×2 与通勤三个项目已全部上线，占位卡不再补 —— 机制留着，
     以后要预告新项目时把对应数字调回 1 即可。 */
  var TARGET_PH = { main: 0, poker: 0 };

  var POKER_RE = /德州|扑克|poker|hold'?em/i;
  /* 「牌」单独判断，先剔除「品牌 / 招牌 / 牌照 / 门牌」这类误命中 */
  var PAI_EXCLUDE = /品牌|招牌|牌照|门牌|牌子/g;

  var DIAMOND =
    '<svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">' +
    '<path d="M6 .9 11.1 6 6 11.1 .9 6Z"/></svg>';

  var io = null;
  var busy = false;

  function isEn() {
    return (document.documentElement.lang || '').toLowerCase().indexOf('en') === 0;
  }
  function reduced() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function textOf(el) {
    if (!el) return '';
    return [el.getAttribute('data-zh'), el.getAttribute('data-en'), el.textContent].join(' ');
  }

  /* ---- 1. 分组规则：name 或 tags 含 德州 / 扑克 / poker / 牌 ---- */
  function isPoker(card) {
    var name = textOf(card.querySelector('.project-name'));
    var tags = Array.prototype.map.call(
      card.querySelectorAll('.project-tag'),
      function (t) { return t.textContent; }
    ).join(' ');
    var s = name + ' ' + tags;
    if (POKER_RE.test(s)) return true;
    return /牌/.test(s.replace(PAI_EXCLUDE, ''));
  }

  /* ---- 2. 构建组容器 ---- */
  function buildGroup(def) {
    var g = document.createElement('div');
    g.className = 'pgroup pgroup-' + def.key;
    g.setAttribute('data-pgroup', def.key);

    var head = document.createElement('div');
    head.className = 'pgroup-head reveal';

    var h = document.createElement('h3');
    h.className = 'pgroup-title';
    if (def.key === 'poker') {
      var mark = document.createElement('span');
      mark.className = 'pgroup-mark';
      mark.innerHTML = DIAMOND;
      h.appendChild(mark);
    }
    /* data-zh/en 挂在内层 span：app.js updateLanguage 写 textContent，
       挂在 h3 上会把前面的符号一起抹掉 */
    var label = document.createElement('span');
    label.className = 'pgroup-label';
    label.setAttribute('data-zh', def.zh);
    label.setAttribute('data-en', def.en);
    label.textContent = isEn() ? def.en : def.zh;
    h.appendChild(label);

    var count = document.createElement('span');
    count.className = 'pgroup-count';
    count.setAttribute('aria-label', 'count');
    count.textContent = '0';

    head.appendChild(h);
    head.appendChild(count);

    var grid = document.createElement('div');
    grid.className = 'pgroup-grid';

    g.appendChild(head);
    g.appendChild(grid);
    return g;
  }

  function ensureGroup(root, key) {
    return root.querySelector(':scope > .pgroup-' + key) || buildGroup(GROUPS[key]);
  }

  /* ---- 3. 占位卡（不写具体项目名） ---- */
  function buildPlaceholder() {
    var a = document.createElement('article');
    a.className = 'project-card placeholder pg-ph';
    a.setAttribute('aria-label', isEn() ? 'Project in progress' : '项目进行中');
    var en = isEn();
    a.innerHTML =
      '<div class="project-card-inner">' +
        '<span class="pg-ph-mark" aria-hidden="true"></span>' +
        '<div class="pg-ph-title" data-zh="项目进行中 / In progress" data-en="In progress">' +
          (en ? 'In progress' : '项目进行中 / In progress') +
        '</div>' +
        '<div class="pg-ph-sub" data-zh="即将上线" data-en="Coming soon">' +
          (en ? 'Coming soon' : '即将上线') +
        '</div>' +
      '</div>';
    return a;
  }

  /* ---- 4. 组标题入场：复用站内 .reveal → .visible ---- */
  function revealHeads(root) {
    var heads = root.querySelectorAll('.pgroup-head.reveal:not(.visible)');
    if (!heads.length) return;
    if (reduced() || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(heads, function (h) { h.classList.add('visible'); });
      return;
    }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('visible');
            io.unobserve(en.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    }
    Array.prototype.forEach.call(heads, function (h) { io.observe(h); });
  }

  /* ---- 5. 核心：把散落在 #projectGrid 直接子级的卡片挪进对应组 ---- */
  function regroup(root) {
    if (busy) return;
    var stray = root.querySelectorAll(':scope > .project-card');
    if (!stray.length) {
      /* 已经分好组，或 app.js 还没渲染 */
      return;
    }
    busy = true;
    try {
      root.classList.add('is-split');

      var groups = {};
      ORDER.forEach(function (k) { groups[k] = ensureGroup(root, k); });

      Array.prototype.forEach.call(stray, function (card) {
        var key = isPoker(card) ? 'poker' : 'main';
        groups[key].querySelector('.pgroup-grid').appendChild(card);
      });

      ORDER.forEach(function (k) {
        var g = groups[k];
        var grid = g.querySelector('.pgroup-grid');

        /* 占位卡补足到目标数量（数据里已有的先算） */
        var have = grid.querySelectorAll(':scope > .project-card.placeholder').length;
        for (var i = have; i < TARGET_PH[k]; i++) grid.appendChild(buildPlaceholder());

        /* 占位卡一律沉到组尾，保持相对顺序 */
        Array.prototype.forEach.call(
          grid.querySelectorAll(':scope > .project-card.placeholder'),
          function (p) { grid.appendChild(p); }
        );

        g.querySelector('.pgroup-count').textContent =
          String(grid.querySelectorAll(':scope > .project-card').length);
      });

      /* 保证组顺序：main 在前、poker 在后（appendChild 对已有子节点即移动） */
      ORDER.forEach(function (k) { root.appendChild(groups[k]); });

      revealHeads(root);
    } finally {
      busy = false;
    }
  }

  /* ---- 6. 初始化：app.js 异步渲染，用 MutationObserver 等它 ---- */
  function init() {
    var root = document.getElementById(GRID_ID);
    if (!root) return;

    regroup(root);

    var mo = new MutationObserver(function () { regroup(root); });
    mo.observe(root, { childList: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
