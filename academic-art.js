/* Research illustrations: conceptual diagrams, not measured research output. */
(function () {
  'use strict';
  function label(x, y, zh, en, cls) {
    return '<text x="' + x + '" y="' + y + '" class="' + (cls || 'art-label') + '" data-zh="' + zh + '" data-en="' + en + '">' + zh + '</text>';
  }
  function defs(id) {
    return '<defs>' +
      '<linearGradient id="' + id + '-wash" x1="0" y1="0" x2="1" y2="1"><stop class="art-stop-paper"/><stop offset="1" class="art-stop-tint"/></linearGradient>' +
      '<linearGradient id="' + id + '-signal" x1="0" y1="0" x2="1" y2="0"><stop class="art-stop-accent" stop-opacity=".15"/><stop offset=".55" class="art-stop-accent"/><stop offset="1" class="art-stop-second"/></linearGradient>' +
      '<radialGradient id="' + id + '-light"><stop class="art-stop-accent" stop-opacity=".2"/><stop offset="1" class="art-stop-accent" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + id + '-body" x1="0" y1="0" x2="1" y2="1"><stop class="art-stop-paper"/><stop offset=".5" class="art-stop-tint"/><stop offset="1" class="art-stop-paper"/></linearGradient>' +
      '<filter id="' + id + '-shadow" x="-40%" y="-30%" width="180%" height="180%"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="currentColor" flood-opacity=".09"/></filter>' +
      '<pattern id="' + id + '-grid" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M25 0H0V25" class="art-grid"/></pattern></defs>';
  }
  function wearable() {
    var id = 'wearable-study';
    return defs(id) +
      '<rect width="600" height="350" fill="url(#' + id + '-wash)"/>' +
      '<rect x="18" y="18" width="564" height="314" rx="2" fill="url(#' + id + '-grid)"/>' +
      '<ellipse class="art-light" cx="196" cy="170" rx="180" ry="150" fill="url(#' + id + '-light)"/>' +
      label(28, 36, '身体 · 信号 · 反馈', 'BODY · SIGNAL · FEEDBACK', 'art-eyebrow') +
      '<text x="570" y="36" text-anchor="end" class="art-eyebrow">BRISTOL</text>' +
      '<g class="art-guide"><ellipse cx="175" cy="289" rx="93" ry="17"/><path d="M175 58V307M73 185H285"/><circle cx="175" cy="169" r="92"/><path d="M84 159a92 92 0 0 1 95-82M214 250a92 92 0 0 1-89 3" class="art-orbit"/></g>' +
      '<g class="pose-reference"><path d="M170 115L167 185L147 260M167 185L198 259M139 129L112 181M198 130L229 177"/></g>' +
      '<g class="art-pose" filter="url(#' + id + '-shadow)">' +
      '<ellipse cx="178" cy="93" rx="16" ry="21" class="art-body" fill="url(#' + id + '-body)"/>' +
      '<path d="M168 113L166 119C154 119 140 125 138 135L129 165L107 190Q104 196 109 200Q113 203 118 198L141 175L153 147L152 178Q149 186 153 197L140 232L127 271Q126 278 133 280Q141 281 144 272L161 238L174 214L186 239L211 272Q216 280 222 276Q228 272 223 264L202 228L191 195Q198 183 196 169L193 144L213 161L239 172Q246 175 249 169Q251 163 244 160L220 147L204 127Q198 119 187 119L186 113" class="art-body" fill="url(#' + id + '-body)"/>' +
      '<path d="M178 122L174 183L173 205M149 135L137 169L111 195M192 134L216 153L244 166M173 205L151 240L135 274M173 205L196 232L219 270" class="art-skeleton"/>' +
      '<g class="art-sensors"><circle cx="178" cy="130" r="5"/><circle cx="174" cy="181" r="5"/><circle cx="151" cy="239" r="5"/><circle class="art-node-halo" cx="178" cy="130" r="12"/><circle class="art-node-halo" cx="174" cy="181" r="13"/></g></g>' +
      '<path d="M191 130C238 115 275 120 302 153S331 179 374 169M183 183C237 214 262 224 300 215S337 207 374 212" class="art-flow-guide"/>' +
      '<path d="M191 130C238 115 275 120 302 153S331 179 374 169M183 183C237 214 262 224 300 215S337 207 374 212" class="art-packet" stroke="url(#' + id + '-signal)"/>' +
      '<g class="art-signal-panel"><rect x="257" y="118" width="93" height="96" rx="8" class="art-glass"/>' +
      label(270, 137, '传感信号', 'SIGNALS', 'art-tiny') +
      '<path d="M269 174H279L284 164L292 188L300 155L309 178L316 171H338" class="art-wave-base"/><path d="M269 174H279L284 164L292 188L300 155L309 178L316 171H338" class="art-wave-trace"/><path d="M269 196H338" class="art-grid"/></g>' +
      '<g class="art-phone" filter="url(#' + id + '-shadow)"><rect x="390" y="76" width="135" height="227" rx="22" class="art-phone-shell"/><rect x="398" y="84" width="119" height="211" rx="16" class="art-phone-screen"/><rect x="435" y="88" width="46" height="6" rx="3" class="art-phone-detail"/>' +
      label(411, 119, '姿态反馈', 'POSTURE', 'art-label') +
      '<g class="art-mobile-pose"><circle cx="456" cy="150" r="9"/><path d="M456 162V198M456 171L431 184M456 171L477 181M456 197L442 223M456 197L473 221"/></g>' +
      '<path d="M426 203A37 37 0 0 1 428 161" class="art-angle"/><path d="M489 166L489 216" class="art-phone-guide"/>' +
      '<rect x="414" y="244" width="88" height="27" rx="5" class="art-feedback-bg"/><path d="M425 258l4 4 7-8" class="art-feedback-mark"/>' +
      label(442, 262, '动作反馈', 'FEEDBACK', 'art-tiny') + '</g>' +
      label(102, 318, '运动姿态', 'MOVEMENT', 'art-tiny') + label(272, 238, '机器学习', 'ML ANALYSIS', 'art-tiny') +
      '<path d="M29 328h18M29 328v-18M571 328h-18M571 328v-18" class="art-frame"/>';
  }
  function orderFlow() {
    // Relative depths illustrate the research mechanism; these are not market observations.
    var depth = [38, 68, 94, 71, 122, 156, 184, 140, 110, 62];
    var levels = depth.map(function (bid, i) {
      var y = 81 + i * 17;
      var ask = depth[(i + 3) % depth.length];
      return '<g class="plate-level" style="--level:' + i + '">' +
        '<path class="plate-bid" d="M262 ' + y + 'h-' + bid + '"/>' +
        '<path class="plate-ask" d="M280 ' + y + 'h' + ask + '"/></g>';
    }).join('');
    var signals = ['M415 91C475 91 466 168 547 168', 'M421 226C478 226 476 168 547 168'];
    return '<defs><pattern id="depth-dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".75" fill="currentColor"/></pattern></defs>' +
      '<rect class="plate-paper" width="600" height="350"/><rect width="600" height="350" fill="url(#depth-dots)" opacity=".14"/>' +
      '<g class="plate-type"><text x="32" y="39">BID</text><text x="280" y="39">ASK</text><text x="32" y="322">S&amp;P 500</text><text x="280" y="322">ORDER FLOW</text></g>' +
      '<g class="plate-register">' + depth.map(function (_, i) {
        var y = 81 + i * 17;
        return '<path d="M35 ' + y + 'h5M266 ' + y + 'h3M273 ' + y + 'h3"/>';
      }).join('') + '</g>' +
      levels + '<path d="M271 54V265M32 284H565M262 272v5h18v-5" fill="none" stroke="currentColor" opacity=".55"/>' +
      label(280, 273, '价差', 'SPREAD', 'art-tiny') +
      '<circle class="plate-field" cx="551" cy="168" r="34"/>' +
      signals.map(function (path) {
        return '<path class="plate-guide" d="' + path + '"/><path class="plate-pulse" pathLength="100" d="' + path + '"/>';
      }).join('') +
      '<g class="plate-receiver"><circle cx="551" cy="168" r="13" class="plate-echo"/><circle cx="551" cy="168" r="6"/></g>' +
      label(484, 208, '信号汇合', 'SIGNAL', 'art-tiny');
  }

  function figure(type) {
    var isWearable = type === 'bachelor';
    var zh = isWearable ? '运动姿态、传感信号与手机反馈的研究示意' : '订单簿的买卖深度、价差与信号汇合示意';
    var en = isWearable ? 'Conceptual diagram of wearable sensors and mobile feedback' : 'Conceptual diagram of bid and ask depth, spread and signal transmission';
    var caption = isWearable ? '姿态感知与交互' : '市场微观结构';
    var captionEn = isWearable ? 'Sensing &amp; interaction' : 'Market microstructure';
    return '<figure class="research-figure thesis-scene research-' + type + '" id="thesis-' + (isWearable ? 'wearable' : 'order-flow') + '">' +
      '<svg viewBox="0 0 600 350" role="img" aria-label="' + zh + '" data-art-label-zh="' + zh + '" data-art-label-en="' + en + '">' +
      (isWearable ? wearable() : orderFlow()) + '</svg>' +
      '<figcaption><span class="thesis-figure-kind" data-zh="' + caption + '" data-en="' + captionEn + '">' + caption + '</span></figcaption></figure>';
  }
  var paused = false;
  var root;
  function refreshMotion() {
    if (!root) return;
    root.querySelectorAll('.research-figure').forEach(function (el) {
      el.classList.toggle('art-running', el.classList.contains('art-in-view') && !paused && !document.hidden && document.documentElement.dataset.motion !== 'reduce' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    });
  }
  function mount(wrap) {
    root = wrap;
    var button = wrap.querySelector('.research-motion-toggle');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    function syncButton() {
      button.hidden = reduce.matches || document.documentElement.dataset.motion === 'reduce';
      button.setAttribute('aria-pressed', String(paused));
      var text = button.querySelector('span');
      var zh = paused ? '播放动效' : '暂停动效';
      var en = paused ? 'Play motion' : 'Pause motion';
      text.setAttribute('data-zh', zh); text.setAttribute('data-en', en);
      text.textContent = document.documentElement.lang === 'en' ? en : zh;
      refreshMotion();
    }
    button.addEventListener('click', function () { paused = !paused; syncButton(); });
    syncButton();
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { entry.target.classList.toggle('art-in-view', entry.isIntersecting); });
        refreshMotion();
      }, { threshold: .1 });
      wrap.querySelectorAll('.research-figure').forEach(function (el) { observer.observe(el); });
    } else {
      wrap.querySelectorAll('.research-figure').forEach(function (el) { el.classList.add('art-in-view'); });
      refreshMotion();
    }
    document.addEventListener('visibilitychange', refreshMotion);
    reduce.addEventListener('change', syncButton);
    document.addEventListener('portfolio:motionchange', syncButton);
    var languageObserver = new MutationObserver(function () {
      wrap.querySelectorAll('[data-art-label-en]').forEach(function (svg) {
        svg.setAttribute('aria-label', svg.getAttribute('data-art-label-' + (document.documentElement.lang === 'en' ? 'en' : 'zh')));
      });
    });
    languageObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }
  window.AcademicArt = { figure: figure, mount: mount };
})();
