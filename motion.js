/* ============================================================
   motion —— 交互层
   - 段落文字分字/分词入场
   仅负责英文名字的短入场。主CTA、Hero、背景门控由
   assets/motion-governor.mjs 唯一接管；章节使用原生锚点。
   ============================================================ */

(function () {
  'use strict';

  function reduced() {
    return document.documentElement.dataset.motion === 'reduce' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ---------- 1. 文字分字入场 ----------
     只处理首屏名字和 section 标题这类短文本。
     长段落逐字拆分会让 DOM 爆炸，跳过。 */
  function splitText() {
    if (reduced()) return;

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

  /* ---------- 初始化 ---------- */
  function init() {
    splitText();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
