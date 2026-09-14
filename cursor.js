/* ============================================================
   cursor —— 自定义光标行为
   小点即时跟随，圆环用 lerp 滞后追随（0.14 系数）产生拖尾感。
   触屏 / reduced-motion 下直接不初始化，系统光标照常。
   ============================================================ */

(function () {
  'use strict';

  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!canHover || reduce) return;

  var INTERACTIVE = 'a, button, .project-card, .contact-item, .ps-btn, .rail-item, input, textarea, select, .embed-try-btn, .jd-sample';

  var dot = document.createElement('div');
  dot.className = 'cur-dot';
  dot.setAttribute('aria-hidden', 'true');

  var ring = document.createElement('div');
  ring.className = 'cur-ring';
  ring.setAttribute('aria-hidden', 'true');

  var tx = -100, ty = -100;      // 目标坐标（鼠标真实位置）
  var rx = -100, ry = -100;      // 圆环当前坐标（插值后）
  var started = false;

  function loop() {
    // 圆环滞后追随：系数越小拖尾越长
    rx += (tx - rx) * 0.14;
    ry += (ty - ry) * 0.14;

    dot.style.transform = 'translate3d(' + tx + 'px,' + ty + 'px,0)';
    ring.style.transform = 'translate3d(' + rx.toFixed(2) + 'px,' + ry.toFixed(2) + 'px,0)';

    requestAnimationFrame(loop);
  }

  function onMove(e) {
    tx = e.clientX;
    ty = e.clientY;
    if (!started) {
      started = true;
      rx = tx; ry = ty;              // 首次出现不要从屏幕外飞过来
      document.body.classList.add('has-cursor');
      document.body.classList.remove('cur-out');
    }
  }

  function init() {
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    document.addEventListener('mousemove', onMove, { passive: true });

    // 事件委托判断是否悬停在可交互元素上
    document.addEventListener('mouseover', function (e) {
      var el = e.target.closest && e.target.closest(INTERACTIVE);
      ring.classList.toggle('cur-big', !!el);
    }, { passive: true });

    document.addEventListener('mousedown', function () {
      ring.classList.add('cur-down');
    });
    document.addEventListener('mouseup', function () {
      ring.classList.remove('cur-down');
    });

    // 鼠标离开窗口：淡出，避免停在边缘
    document.addEventListener('mouseleave', function () {
      document.body.classList.add('cur-out');
    });

    requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
