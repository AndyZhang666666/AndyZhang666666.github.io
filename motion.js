/* ============================================================
   motion —— 交互层
   - 段落文字分字/分词入场
   - 磁吸按钮（hero CTA + 联系卡）
   - 锚点平滑滚动接管（自定义缓动，比 CSS scroll-behavior 可控）
   - 滚动驱动的进度感（section 标题轻微视差）
   全部原生，无依赖。所有效果在 prefers-reduced-motion 下静默跳过。
   ============================================================ */

(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover)').matches;

  /* ---------- 1. 文字分字入场 ----------
     只处理首屏名字和 section 标题这类短文本。
     长段落逐字拆分会让 DOM 爆炸，跳过。 */
  function splitText() {
    if (reduce) return;

    // 只拆英文名。中文名用 background-clip:text 做渐变字，拆成 span 后子元素没有背景，
    // 会渲染成一坨叠在一起的方块（2026-09-14 线上 bug），所以中文名走整体卷帘入场。
    var targets = document.querySelectorAll('.hero-name-en');
    targets.forEach(function (el) {
      if (el.dataset.split === '1') return;
      if (el.children.length) return;          // 里面已有标签，不拆
      var text = el.textContent.trim();
      if (!text || text.length > 24) return;   // 太长不拆，避免 DOM 膨胀

      el.setAttribute('aria-label', text);
      el.dataset.split = '1';

      var frag = document.createDocumentFragment();
      Array.prototype.forEach.call(text, function (ch, i) {
        var span = document.createElement('span');
        span.className = 'char';
        span.style.setProperty('--ci', i);
        span.setAttribute('aria-hidden', 'true');
        span.textContent = ch === ' ' ? '\u00A0' : ch;
        frag.appendChild(span);
      });
      el.textContent = '';
      el.appendChild(frag);
    });
  }

  /* ---------- 2. 磁吸按钮 ---------- */
  function magnetic() {
    if (reduce || !canHover) return;

    var els = document.querySelectorAll('.btn-primary, .contact-item');
    els.forEach(function (el) {
      var raf = 0;
      var strength = el.classList.contains('btn-primary') ? 0.28 : 0.16;
      var max = el.classList.contains('btn-primary') ? 7 : 5;

      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - r.left - r.width / 2) * strength;
        var dy = (e.clientY - r.top - r.height / 2) * strength;
        dx = Math.max(-max, Math.min(max, dx));
        dy = Math.max(-max, Math.min(max, dy));
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          el.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
        });
      });

      el.addEventListener('mouseleave', function () {
        cancelAnimationFrame(raf);
        el.style.transform = '';
      });
    });
  }

  /* ---------- 3. 锚点滚动接管 ---------- */
  function smoothAnchors() {
    if (reduce) return;

    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || href === '#' || href === '#top') {
        if (href === '#top') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
        return;
      }
      var target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();

      var top = target.getBoundingClientRect().top + window.scrollY - 24;
      var start = window.scrollY;
      var dist = top - start;
      var dur = Math.min(1100, Math.max(420, Math.abs(dist) * 0.42));
      var t0 = performance.now();

      (function step(now) {
        var p = Math.min(1, (now - t0) / dur);
        // easeInOutQuint：起步和收尾都平缓，中段快，比 CSS smooth 更有控制感
        var eased = p < 0.5
          ? 16 * p * p * p * p * p
          : 1 - Math.pow(-2 * p + 2, 5) / 2;
        window.scrollTo(0, start + dist * eased);
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    }, { passive: false });
  }

  /* ---------- 4. 标题轻微视差 ----------
     滚动时 section 编号比标题移动稍快一点，制造纵深。幅度很小（≤14px）。 */
  function titleParallax() {
    if (reduce) return;
    var marks = document.querySelectorAll('.section-head');
    if (!marks.length) return;

    var ticking = false;
    function update() {
      ticking = false;
      var vh = window.innerHeight;
      marks.forEach(function (m) {
        var r = m.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        // 以元素中心相对视口中心的位置做偏移
        var center = r.top + r.height / 2;
        var offset = (center - vh / 2) / vh;      // -1 ~ 1 附近
        var num = m.querySelector('.section-num');
        if (num) num.style.transform = 'translateY(' + (offset * -10).toFixed(1) + 'px)';
      });
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ---------- 初始化 ---------- */
  function init() {
    splitText();
    magnetic();
    smoothAnchors();
    titleParallax();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
