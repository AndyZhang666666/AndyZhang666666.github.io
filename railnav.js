/* railnav —— 右侧竖向章节导航
   - 自动从页面 <section> 生成，不用手维护列表
   - IntersectionObserver 追踪当前章节，不监听 scroll
   - 中英文标签走现有 data-zh / data-en 机制，切语言时由 app.js 的 updateLanguage() 一并处理 */

(function () {
  'use strict';

  var LABELS = {
    top:       ['首页', 'Top'],
    about:     ['关于', 'About'],
    ai:        ['观点', 'On AI'],
    work:      ['经历', 'Work'],
    education: ['教育', 'Education'],
    projects:  ['项目', 'Projects'],
    awards:    ['奖项', 'Awards'],
    now:       ['现在', 'Now'],
    uses:      ['工具', 'Uses'],
    skills:    ['能力', 'Skills'],
    jd:        ['匹配', 'Match'],
    contact:   ['联系', 'Contact']
  };

  function build() {
    var sections = Array.prototype.slice.call(document.querySelectorAll('section[id]'));
    if (!sections.length) return null;

    var nav = document.createElement('nav');
    nav.className = 'railnav at-top';
    nav.setAttribute('aria-label', '章节导航');

    var items = {};

    sections.forEach(function (sec) {
      var id = sec.id;
      var pair = LABELS[id];
      if (!pair) return;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rail-item';
      btn.dataset.target = id;
      btn.setAttribute('aria-label', pair[0]);

      var label = document.createElement('span');
      label.className = 'rail-label';
      label.setAttribute('data-zh', pair[0]);
      label.setAttribute('data-en', pair[1]);
      var isEn = document.documentElement.lang === 'en';
      label.textContent = isEn ? pair[1] : pair[0];

      var tick = document.createElement('span');
      tick.className = 'rail-tick';
      tick.setAttribute('aria-hidden', 'true');

      btn.appendChild(label);
      btn.appendChild(tick);

      btn.addEventListener('click', function () {
        var target = document.getElementById(id);
        if (!target) return;
        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        // 主动更新，不等 IO 回调，避免点击后指示器慢半拍
        setCurrent(id);
      });

      nav.appendChild(btn);
      items[id] = btn;
    });

    document.body.appendChild(nav);
    return { nav: nav, items: items, sections: sections };
  }

  var state = null;

  function setCurrent(id) {
    if (!state) return;
    Object.keys(state.items).forEach(function (k) {
      if (k === id) state.items[k].setAttribute('aria-current', 'true');
      else state.items[k].removeAttribute('aria-current');
    });
  }

  function observe() {
    if (!state) return;

    // 以视口中线为判据：哪个 section 跨过了中线，就算当前章节
    var ratios = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        ratios[e.target.id] = e.isIntersecting ? e.intersectionRatio : 0;
      });
      var best = null, bestRatio = 0;
      state.sections.forEach(function (s) {
        var r = ratios[s.id] || 0;
        if (r > bestRatio) { bestRatio = r; best = s.id; }
      });
      if (best) setCurrent(best);

      // 首屏（top）可见时整条导航隐藏
      var topRatio = ratios.top || 0;
      if (topRatio > 0.35) state.nav.classList.add('at-top');
      else state.nav.classList.remove('at-top');
    }, {
      rootMargin: '-45% 0px -45% 0px',
      threshold: [0, 0.05, 0.15, 0.3, 0.5, 0.75, 1]
    });

    state.sections.forEach(function (s) { io.observe(s); });
  }

  function init() {
    if (document.querySelector('.railnav')) return;
    state = build();
    if (!state) return;
    observe();
    // 下一帧再 ready，让淡入过渡有起点
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { state.nav.classList.add('ready'); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
