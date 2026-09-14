/* ============================================
   德扑元素 · 联系区（独立模块）
   - 背景筹码漂浮层
   - 底部牌桌弧线 + 弧线上滚动的筹码
   - 联系卡花色标记
   - 标题旁发牌动画
   依赖：#contact / #contactGrid / .contact-title 已存在
   ============================================ */

(function () {
  'use strict';

  var SUITS = ['♠', '♥', '♣', '♦'];

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ---- 1. 背景筹码 ---- */
  function buildChips(host) {
    var field = document.createElement('div');
    field.className = 'poker-field';
    field.setAttribute('aria-hidden', 'true');

    var n = window.innerWidth < 640 ? 6 : 11;
    var frag = document.createDocumentFragment();

    for (var i = 0; i < n; i++) {
      var chip = document.createElement('span');
      chip.className = 'chip';
      var size = 26 + Math.round(Math.random() * 40);
      chip.style.setProperty('--size', size + 'px');
      chip.style.left = (4 + Math.random() * 90).toFixed(2) + '%';
      chip.style.top = (18 + Math.random() * 78).toFixed(2) + '%';
      chip.style.setProperty('--dur', (14 + Math.random() * 16).toFixed(1) + 's');
      chip.style.setProperty('--delay', (-Math.random() * 20).toFixed(1) + 's');
      chip.style.setProperty('--dx', (Math.random() * 80 - 40).toFixed(0) + 'px');
      chip.style.setProperty('--rot', (120 + Math.random() * 260).toFixed(0) + 'deg');
      chip.style.setProperty('--peak', (0.14 + Math.random() * 0.2).toFixed(2));
      chip.style.setProperty('--chip-c', i % 3 === 0 ? 'var(--second)' : 'var(--accent)');
      frag.appendChild(chip);
    }

    field.appendChild(frag);
    host.appendChild(field);
  }

  /* ---- 2. 底部牌桌弧线 ---- */
  function buildFelt(host) {
    var PATH = 'M 0 78 C 160 6, 600 6, 760 78';

    var wrap = document.createElement('div');
    wrap.className = 'felt-line';
    wrap.setAttribute('aria-hidden', 'true');

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 760 90');
    svg.setAttribute('preserveAspectRatio', 'none');

    var arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arc.setAttribute('d', PATH);
    arc.setAttribute('class', 'felt-arc');
    svg.appendChild(arc);

    // 三枚沿弧线滚动的筹码
    for (var i = 0; i < 3; i++) {
      var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('r', String(3.5 + i * 0.8));
      c.setAttribute('class', 'felt-runner');
      c.style.setProperty('--arc-path', 'path("' + PATH + '")');
      c.style.setProperty('--rdur', (11 + i * 4) + 's');
      c.style.setProperty('--rdelay', (i * 3.2) + 's');
      if (i === 1) c.style.fill = 'var(--accent)';
      svg.appendChild(c);
    }

    wrap.appendChild(svg);
    host.appendChild(wrap);
  }

  /* ---- 3. 联系卡花色 ---- */
  function tagSuits() {
    var items = document.querySelectorAll('#contactGrid .contact-item');
    items.forEach(function (el, i) {
      el.setAttribute('data-suit', SUITS[i % SUITS.length]);
    });
  }

  /* ---- 4. 标题旁一手牌（AK 同花 —— 起手牌里最好看的之一） ---- */
  function dealHand() {
    var title = document.querySelector('.contact-title');
    if (!title || title.parentNode.querySelector('.hand')) return;

    var cards = [
      { t: 'A♠', red: false },
      { t: 'K♠', red: false }
    ];

    var hand = document.createElement('span');
    hand.className = 'hand';
    hand.setAttribute('aria-hidden', 'true');

    cards.forEach(function (c, i) {
      var el = document.createElement('span');
      el.className = 'hand-card' + (c.red ? ' red' : '');
      el.style.setProperty('--n', String(i + 1));
      el.textContent = c.t;
      hand.appendChild(el);
    });

    title.insertAdjacentElement('afterend', hand);
  }

  /* ---- 初始化：等 renderContact() 把卡片插进 DOM ---- */
  function init() {
    var contact = document.getElementById('contact');
    if (!contact) return;

    if (!reduced()) {
      buildChips(contact);
      buildFelt(contact);
    }
    dealHand();

    // contactGrid 由 app.js 异步 fetch 后渲染，等它出现再打花色
    var grid = document.getElementById('contactGrid');
    if (grid && grid.children.length) {
      tagSuits();
    } else if (grid) {
      var obs = new MutationObserver(function () {
        if (grid.children.length) {
          tagSuits();
          obs.disconnect();
        }
      });
      obs.observe(grid, { childList: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
