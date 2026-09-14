/* ============================================
   德扑展示模块 · 项目区扑克项目组（独立模块）
   - 扇形牌阵：滚动到位后从一叠展开，点一下重新发牌
   - 给扑克组卡片打 .pk-card / .pk-facedown，加角标花色
   依赖：#projects / #projectGrid 已存在；
        项目分组模块若生成 .pgroup-poker，则牌阵移入其头部
   ============================================ */

(function () {
  'use strict';

  var RED = { '♥': true, '♦': true };

  /* 几手好牌轮换：红黑花色尽量交错，看起来有变化 */
  var HANDS = [
    ['A♠', 'K♥', 'Q♣', 'J♦', '10♠'],   // Broadway
    ['A♠', 'A♥', 'A♣', 'K♦', 'K♠'],    // Full house
    ['10♥', 'J♥', 'Q♥', 'K♥', 'A♥'],   // Royal flush
    ['A♣', '2♦', '3♠', '4♥', '5♣'],    // Wheel
    ['9♠', '10♦', 'J♠', 'Q♣', 'K♦']    // K-high straight
  ];

  /* 一句牌桌话，配合当前语言 */
  var LINES = [
    { zh: '会打牌的人，先算赔率，再听直觉。', en: 'Good players run the odds first, then trust the gut.' },
    { zh: '位置比手牌重要——产品里也一样。', en: 'Position beats the cards. Same in product.' },
    { zh: '别为已经投进底池的筹码继续打牌。', en: "Don't keep playing for chips already in the pot." },
    { zh: '小样本看运气，大样本看实力。', en: 'Small samples show luck. Large samples show skill.' },
    { zh: '弃牌也是决策，而且常常是对的那个。', en: 'Folding is a decision too. Often the right one.' }
  ];

  var handIdx = 0;
  var lineIdx = 0;
  var wrap = null;      // .pk-fan-wrap
  var placed = null;    // 当前插到了哪个容器（.pgroup-poker 或 #projects fallback）
  var opened = false;
  var busy = false;

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function lang() {
    return (document.documentElement.lang || '').indexOf('en') === 0 ? 'en' : 'zh';
  }
  function splitCard(s) {
    var suit = s.slice(-1);
    return { rank: s.slice(0, -1), suit: suit, red: !!RED[suit] };
  }

  /* ---- 1. 构建牌阵 ---- */
  function fillCard(el, str) {
    var c = splitCard(str);
    el.classList.toggle('red', c.red);
    el.innerHTML =
      '<span class="pk-rank">' + c.rank + '<small>' + c.suit + '</small></span>' +
      '<span class="pk-pip">' + c.suit + '</span>' +
      '<span class="pk-rank flip">' + c.rank + '<small>' + c.suit + '</small></span>';
  }

  function buildFan() {
    var w = document.createElement('div');
    w.className = 'pk-fan-wrap';
    w.setAttribute('data-pk', 'fan');

    var fan = document.createElement('div');
    fan.className = 'pk-fan';
    fan.setAttribute('role', 'button');
    fan.setAttribute('tabindex', '0');
    fan.setAttribute('aria-label', '重新发一手牌');

    HANDS[0].forEach(function (s, i) {
      var card = document.createElement('div');
      card.className = 'pk-card-face';
      card.style.setProperty('--i', String(i));
      card.setAttribute('aria-hidden', 'true');
      fillCard(card, s);
      fan.appendChild(card);
    });

    var cap = document.createElement('div');
    cap.className = 'pk-fan-cap';

    var suits = document.createElement('div');
    suits.className = 'pk-fan-suits';
    suits.setAttribute('aria-hidden', 'true');
    suits.innerHTML = '♠ <b>♥</b> ♣ <b>♦</b>';

    var line = document.createElement('p');
    line.className = 'pk-fan-line';
    setLine(line, LINES[0]);

    var hint = document.createElement('span');
    hint.className = 'pk-fan-hint';
    hint.setAttribute('data-zh', '点一下牌，换一手');
    hint.setAttribute('data-en', 'Tap the cards to redeal');
    hint.textContent = lang() === 'en' ? 'Tap the cards to redeal' : '点一下牌，换一手';

    cap.appendChild(suits);
    cap.appendChild(line);
    cap.appendChild(hint);
    w.appendChild(fan);
    w.appendChild(cap);

    fan.addEventListener('click', redeal);
    fan.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); redeal(); }
    });

    return w;
  }

  function setLine(el, item) {
    // 挂 data-zh/en，app.js 的语言切换会一起处理
    el.setAttribute('data-zh', item.zh);
    el.setAttribute('data-en', item.en);
    el.textContent = item[lang()];
  }

  /* ---- 2. 重新发牌（彩蛋，点到即止） ---- */
  function redeal() {
    if (!wrap || busy) return;
    busy = true;
    handIdx = (handIdx + 1) % HANDS.length;
    lineIdx = (lineIdx + 1) % LINES.length;

    var cards = wrap.querySelectorAll('.pk-card-face');
    var line = wrap.querySelector('.pk-fan-line');
    var noMotion = reduced();

    var swap = function () {
      cards.forEach(function (c, i) { fillCard(c, HANDS[handIdx][i]); });
      setLine(line, LINES[lineIdx]);
    };

    if (noMotion) {
      swap();
      busy = false;
      return;
    }

    wrap.classList.add('is-shuffling');
    line.classList.add('is-swapping');
    setTimeout(function () {
      swap();
      line.classList.remove('is-swapping');
      wrap.classList.remove('is-shuffling');
      // 收拢完成后重新按 stagger 展开
      setTimeout(function () { busy = false; }, 500);
    }, 380);
  }

  /* ---- 3. 滚动到位才展开 ---- */
  function watchOpen() {
    if (opened || !wrap) return;
    if (reduced() || !('IntersectionObserver' in window)) {
      wrap.classList.add('is-open');
      opened = true;
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          setTimeout(function () { wrap.classList.add('is-open'); }, 120);
          opened = true;
          io.disconnect();
        }
      });
    }, { threshold: 0.35, rootMargin: '0px 0px -40px 0px' });
    io.observe(wrap);
  }

  /* ---- 4. 决定牌阵放哪 ---- */
  function place() {
    var group = document.querySelector('#projectGrid .pgroup-poker, #projects .pgroup-poker');
    var target = group || document.getElementById('projects');
    if (!target) return;

    if (!wrap) wrap = buildFan();

    // 已在正确容器里且仍是它的第一个子节点，什么都不做
    if (placed === target && wrap.parentNode === target) return;

    if (group) {
      // 分组容器：作为第一个子节点（组标题上方 / 卡片之前）
      group.insertBefore(wrap, group.firstChild);
    } else {
      // 没有分组：放在 #projects 内、#projectGrid 之前
      var grid = document.getElementById('projectGrid');
      target.insertBefore(wrap, grid || null);
    }
    placed = target;
    watchOpen();
  }

  /* ---- 5. 给扑克组的卡片打标 ---- */
  var SUITS = ['♠', '♥', '♣', '♦'];
  function tagCards() {
    var group = document.querySelector('.pgroup-poker');
    var cards;
    if (group) {
      cards = Array.prototype.slice.call(group.querySelectorAll('.project-card'));
    } else {
      // 兜底：按标题匹配
      cards = Array.prototype.filter.call(document.querySelectorAll('#projectGrid .project-card'), function (c) {
        var n = c.querySelector('.project-name');
        var t = n ? (n.getAttribute('data-zh') || '') + (n.getAttribute('data-en') || '') + n.textContent : '';
        return /扑克|poker/i.test(t);
      });
    }
    cards.forEach(function (c, i) {
      if (c.classList.contains('pk-card')) return;
      c.classList.add('pk-card');
      if (c.classList.contains('placeholder')) c.classList.add('pk-facedown');
      var corner = document.createElement('span');
      corner.className = 'pk-corner' + (RED[SUITS[i % 4]] ? ' red' : '');
      corner.setAttribute('aria-hidden', 'true');
      corner.textContent = SUITS[i % 4];
      c.appendChild(corner);
    });
  }

  /* ---- 6. 初始化：等 app.js 渲染 + 分组模块改结构 ---- */
  function sync() {
    var grid = document.getElementById('projectGrid');
    if (!grid || !grid.children.length) return;
    place();
    tagCards();
  }

  function init() {
    var section = document.getElementById('projects');
    var grid = document.getElementById('projectGrid');
    if (!section || !grid) return;

    sync();

    // 项目卡由 app.js 异步渲染，分组模块可能再包一层，都监听
    var pending = null;
    var mo = new MutationObserver(function () {
      if (pending) return;
      pending = setTimeout(function () { pending = null; sync(); }, 60);
    });
    mo.observe(grid, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
