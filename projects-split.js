/* ============================================================
   项目区分组 · projects-split.js
   ------------------------------------------------------------
   把 #projectGrid 里由 app.js 渲染出的 .project-card 按规则
   按真实任务分类筛选，仍复用三个容器与原卡片，不重建 Demo：
     .pgroup-main   产品与实验
     .pgroup-cases  也做过这些
     .pgroup-poker  德州扑克
   依赖：#projectGrid 已存在；卡片结构见 app.js renderProjects()
   ============================================================ */

(function () {
  'use strict';

  var GRID_ID = 'projectGrid';
  var ORDER = ['main', 'cases', 'poker'];
  var GROUPS = {
    main:  { key: 'main',  zh: '产品与实验', en: 'Products & Experiments' },
    cases: { key: 'cases', zh: '也做过这些', en: 'Other things I have built' },
    poker: { key: 'poker', zh: '德州扑克',       en: "Texas Hold'em" }
  };
  /* 每组保底的占位卡数量：数据里已有的 .placeholder 会先计入，不足才补。
     扑克 ×2 与通勤三个项目已全部上线，占位卡不再补 —— 机制留着，
     以后要预告新项目时把对应数字调回 1 即可。 */
  var TARGET_PH = { main: 0, cases: 0, poker: 0 };
  // Each current project has one primary task. Do not infer categories from AI buzzwords.
  var CATEGORIES = [
    { key: 'all', zh: '全部作品', en: 'All work', ids: [] },
    { key: 'ai', zh: 'AI 与评测', en: 'AI & Evaluation', ids: ['eval', 'filing', 'agent-bench', 'rag-lab'] },
    { key: 'life', zh: '生活与设计', en: 'Life & Design', ids: ['taste', 'suibianju', 'grounded', 'commute'] },
    { key: 'growth', zh: '增长与商业化', en: 'Growth & Monetisation', ids: ['growth', 'pricing', 'bundle'] },
    { key: 'practice', zh: '其他实践', en: 'Other Practice', ids: ['fde', 'research-agent', 'content'] },
    { key: 'poker', zh: '德州工具', en: 'Poker Tools', ids: ['poker-quiz', 'bankroll', 'poker-ev', 'squid-lab'] }
  ];
  var activeCategory = 'all';

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

  function words(el, zh, en) {
    el.setAttribute('data-zh', zh);
    el.setAttribute('data-en', en);
    el.textContent = isEn() ? en : zh;
  }
  function categoryFor(id) {
    return CATEGORIES.find(function (category) { return category.ids.indexOf(id) !== -1; });
  }
  function cardsIn(root) {
    return Array.prototype.slice.call(root.querySelectorAll('.project-card[data-project-id]'));
  }
  function markCardCategories(root) {
    cardsIn(root).forEach(function (card) {
      var category = categoryFor(card.dataset.projectId);
      if (!category) return;
      card.dataset.libraryCategory = category.key;
      var kind = card.querySelector('.project-kind');
      if (!kind) return;
      if (!kind.dataset.libraryKindZh) {
        kind.dataset.libraryKindZh = kind.dataset.zh || kind.textContent;
        kind.dataset.libraryKindEn = kind.dataset.en || kind.textContent;
      }
      words(kind, category.zh + ' · ' + kind.dataset.libraryKindZh, category.en + ' · ' + kind.dataset.libraryKindEn);
    });
  }
  function ensureFilters(root) {
    if (!cardsIn(root).length) return null;
    var section = root.closest('#projects');
    var controls = section.querySelector('.library-controls');
    if (controls) return controls;
    controls = document.createElement('div');
    controls.className = 'library-controls';
    var heading = document.createElement('div');
    heading.className = 'library-filter-heading';
    var title = document.createElement('p');
    title.className = 'library-filter-label';
    words(title, '作品分类', 'Browse by task');
    var status = document.createElement('p');
    status.className = 'library-filter-status';
    status.id = 'libraryFilterStatus';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    heading.appendChild(title);
    heading.appendChild(status);
    var list = document.createElement('div');
    list.className = 'library-filter-list';
    list.setAttribute('role', 'group');
    list.setAttribute('aria-label', isEn() ? 'Filter projects by task' : '按任务筛选作品');
    CATEGORIES.forEach(function (category) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'library-filter';
      button.dataset.libraryFilter = category.key;
      button.setAttribute('aria-controls', GRID_ID);
      button.setAttribute('aria-pressed', String(category.key === activeCategory));
      var label = document.createElement('span');
      words(label, category.zh, category.en);
      var count = document.createElement('span');
      count.className = 'library-filter-count';
      button.appendChild(label);
      button.appendChild(count);
      button.addEventListener('click', function () { applyFilter(root, category.key, true); });
      list.appendChild(button);
    });
    controls.appendChild(heading);
    controls.appendChild(list);
    root.parentNode.insertBefore(controls, root);
    return controls;
  }
  function applyFilter(root, key, animate) {
    var category = CATEGORIES.find(function (item) { return item.key === key; });
    if (!category) return;
    activeCategory = key;
    var cards = cardsIn(root);
    var visible = 0;
    cards.forEach(function (card) {
      card.hidden = key !== 'all' && card.dataset.libraryCategory !== key;
      if (!card.hidden) visible++;
    });
    ORDER.forEach(function (groupKey) {
      var group = root.querySelector(':scope > .pgroup-' + groupKey);
      if (!group) return;
      var count = group.querySelectorAll('.project-card[data-project-id]:not([hidden])').length;
      group.hidden = count === 0;
      group.querySelector('.pgroup-count').textContent = String(count);
      if (groupKey === 'main') {
        var name = ['ai','life','growth'].indexOf(key) !== -1 ? category : GROUPS.main;
        words(group.querySelector('.pgroup-label'), name.zh, name.en);
      }
    });
    var controls = ensureFilters(root);
    if (controls) {
      controls.querySelectorAll('[data-library-filter]').forEach(function (button) {
        var spec = CATEGORIES.find(function (item) { return item.key === button.dataset.libraryFilter; });
        var count = spec.key === 'all' ? cards.length : cards.filter(function (card) { return card.dataset.libraryCategory === spec.key; }).length;
        button.setAttribute('aria-pressed', String(spec.key === key));
        button.querySelector('.library-filter-count').textContent = String(count);
      });
      words(controls.querySelector('.library-filter-status'), key === 'all' ? '全部 ' + visible + ' 项作品' : category.zh + ' · ' + visible + ' 项 / 共 ' + cards.length + ' 项', key === 'all' ? 'All ' + visible + ' projects' : category.en + ' · ' + visible + ' of ' + cards.length + ' projects');
    }
    root.dataset.libraryFilter = key;
    if (animate && !reduced() && root.animate) {
      root.animate([{opacity:.65, transform:'translateY(6px)'},{opacity:1, transform:'translateY(0)'}], {duration:220,easing:'cubic-bezier(.16,1,.3,1)'});
    }
    revealHeads(root);
  }
  function revealLinkedProject(root, hash) {
    if (!hash || hash.indexOf('#project-') !== 0) return false;
    var id;
    try { id = decodeURIComponent(hash.slice(1)); } catch (_) { return false; }
    var card = document.getElementById(id);
    if (!card || !root.contains(card)) return false;
    if (card.hidden) applyFilter(root, card.dataset.libraryCategory || 'all', false);
    return true;
  }

  /* ---- 1. 分组规则：name 或 tags 含 德州 / 扑克 / poker / 牌 ---- */
  function isPoker(card) {
    if (card.dataset.projectGroup) return card.dataset.projectGroup === 'poker';
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
        var key = card.dataset.projectGroup === 'cases' ? 'cases' : isPoker(card) ? 'poker' : 'main';
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

      markCardCategories(root);
      applyFilter(root, activeCategory, false);
      revealLinkedProject(root, location.hash);
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

    var initialHash = location.hash;
    if (initialHash.indexOf('#project-') === 0) {
      var touched = false;
      var interactionEvents = ['pointerdown', 'wheel', 'keydown', 'touchstart'];
      var stopCorrection = function () { touched = true; };
      interactionEvents.forEach(function (name) { window.addEventListener(name, stopCorrection, {once:true,passive:true}); });
      document.addEventListener('portfolio:ready', function () {
        (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () {
          requestAnimationFrame(function () { requestAnimationFrame(function () {
            if (!touched && location.hash === initialHash && revealLinkedProject(root, initialHash)) {
              document.getElementById(decodeURIComponent(initialHash.slice(1))).scrollIntoView({block:'start',behavior:'instant'});
            }
            interactionEvents.forEach(function (name) { window.removeEventListener(name, stopCorrection); });
          }); });
        });
      }, {once:true});
    }

    // Reveal before the site's existing anchor handler measures the destination.
    document.addEventListener('click', function (event) {
      var link = event.target.closest && event.target.closest('a[href]');
      if (!link) return;
      var destination;
      try { destination = new URL(link.href, location.href); } catch (_) { return; }
      if (destination.origin === location.origin && destination.pathname === location.pathname) {
        if (destination.hash === '#projects') applyFilter(root, 'all', false);
        else revealLinkedProject(root, destination.hash);
      }
    }, true);
    window.addEventListener('hashchange', function () {
      if (location.hash === '#projects') {
        applyFilter(root, 'all', false);
        return;
      }
      if (revealLinkedProject(root, location.hash)) {
        var card = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        requestAnimationFrame(function () { card.scrollIntoView({block:'start',behavior:reduced()?'instant':'smooth'}); });
      }
    });
    new MutationObserver(function () {
      var controls = root.closest('#projects').querySelector('.library-controls');
      if (controls) controls.querySelector('.library-filter-list').setAttribute('aria-label', isEn() ? 'Filter projects by task' : '按任务筛选作品');
    }).observe(document.documentElement, {attributes:true,attributeFilter:['lang']});

    var mo = new MutationObserver(function () { regroup(root); });
    mo.observe(root, { childList: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
