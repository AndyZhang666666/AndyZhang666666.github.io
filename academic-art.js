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
      '<text x="570" y="36" text-anchor="end" class="art-eyebrow">BRISTOL / 01</text>' +
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
    var id = 'orderflow-study';
    var widths = [47, 66, 81, 54, 91, 72, 43];
    var rows = widths.map(function (w, i) {
      var y = 104 + i * 20;
      return '<rect x="' + (153 - w) + '" y="' + y + '" width="' + w + '" height="11" rx="2" class="art-depth art-bid" style="--row:' + i + ';--cx:153px"/><rect x="167" y="' + y + '" width="' + widths[(i + 3) % widths.length] + '" height="11" rx="2" class="art-depth art-ask" style="--row:' + (i + 2) + ';--cx:167px"/>';
    }).join('');
    return defs(id) +
      '<rect width="600" height="350" fill="url(#' + id + '-wash)"/><rect x="18" y="18" width="564" height="314" fill="url(#' + id + '-grid)"/>' +
      '<ellipse class="art-light" cx="370" cy="180" rx="190" ry="150" fill="url(#' + id + '-light)"/>' +
      label(28, 36, '订单流 · 模型 · 决策', 'ORDER FLOW · MODEL · DECISION', 'art-eyebrow') +
      '<text x="570" y="36" text-anchor="end" class="art-eyebrow">UCL / 02</text>' +
      '<g class="art-depth-panel"><rect x="41" y="66" width="232" height="202" rx="9" class="art-glass"/>' +
      label(59, 87, '买方', 'BID', 'art-label art-bid-label') + label(222, 87, '卖方', 'ASK', 'art-label art-ask-label') +
      '<path d="M160 101V247M56 247H258" class="art-axis"/>' + rows +
      '<path d="M147 253H173" class="art-spread"/></g>' +
      '<path d="M278 126C308 126 312 147 334 158M278 208C305 208 311 187 334 178" class="art-flow-guide"/><path d="M278 126C308 126 312 147 334 158M278 208C305 208 311 187 334 178" class="art-packet" stroke="url(#' + id + '-signal)"/>' +
      '<g class="art-model"><circle cx="352" cy="168" r="36" class="art-model-halo"/><circle cx="352" cy="168" r="26" class="art-model-core"/><path d="M340 157L352 151L363 158L364 178L351 184L340 177Z M340 157L352 165L363 158M352 165V184" class="art-model-symbol"/>' +
      '<circle cx="352" cy="132" r="3" class="art-model-node"/><circle cx="383" cy="186" r="3" class="art-model-node"/><circle cx="321" cy="186" r="3" class="art-model-node"/></g>' +
      '<path d="M389 168H420" class="art-flow-guide"/><path d="M389 168H420" class="art-packet" stroke="url(#' + id + '-signal)"/>' +
      '<g class="art-market-panel"><rect x="412" y="82" width="150" height="186" rx="9" class="art-glass"/>' +
      label(427, 106, '日内信号', 'INTRADAY', 'art-label') +
      '<path d="M430 130H545M430 156H545M430 182H545M430 208H545M430 233H545" class="art-grid"/>' +
      '<path d="M429 220L439 199L449 211L458 180L468 185L478 158L488 171L498 143L508 155L518 136L528 145L541 121V233H429Z" class="art-market-area"/>' +
      '<path d="M429 220L439 199L449 211L458 180L468 185L478 158L488 171L498 143L508 155L518 136L528 145L541 121" class="art-market-baseline"/><path d="M429 220L439 199L449 211L458 180L468 185L478 158L488 171L498 143L508 155L518 136L528 145L541 121" class="art-market-trace"/>' +
      '<circle cx="541" cy="121" r="4" class="art-market-dot"/><path d="M429 242H449M487 242H507M525 242H545" class="art-axis"/></g>' +
      label(83, 293, '买卖深度', 'MARKET DEPTH', 'art-tiny') + label(325, 230, '量化模型', 'MODEL', 'art-tiny') + label(434, 293, '短周期决策', 'DECISION', 'art-tiny') +
      '<path d="M64 309H542" class="art-axis"/><path d="M64 309H542" class="art-flow-baseline"/>' +
      '<path d="M29 328h18M29 328v-18M571 328h-18M571 328v-18" class="art-frame"/>';
  }
  function figure(type) {
    var labelZh = type === 'bachelor' ? '运动姿态、传感信号与手机反馈的研究示意' : '买卖深度、订单流信号与日内量化模型的研究示意';
    var labelEn = type === 'bachelor' ? 'Conceptual illustration of movement, sensor signals and mobile feedback' : 'Conceptual illustration of market depth, order flow and an intraday model';
    return '<figure class="research-figure research-' + type + '"><svg viewBox="0 0 600 350" role="img" aria-label="' + labelZh + '" data-art-label-zh="' + labelZh + '" data-art-label-en="' + labelEn + '">' + (type === 'bachelor' ? wearable() : orderFlow()) + '</svg><figcaption><span data-zh="研究主题示意" data-en="CONCEPTUAL STUDY">研究主题示意</span><span class="art-caption-rule" aria-hidden="true"></span><span data-zh="' + (type === 'bachelor' ? '姿态感知与交互' : '市场微观结构') + '" data-en="' + (type === 'bachelor' ? 'SENSING & INTERACTION' : 'MARKET MICROSTRUCTURE') + '">' + (type === 'bachelor' ? '姿态感知与交互' : '市场微观结构') + '</span></figcaption></figure>';
  }
  var paused = false;
  var root;
  function refreshMotion() {
    if (!root) return;
    root.querySelectorAll('.research-figure').forEach(function (el) {
      el.classList.toggle('art-running', el.classList.contains('art-in-view') && !paused && !document.hidden);
    });
  }
  function mount(wrap) {
    root = wrap;
    var button = wrap.querySelector('.research-motion-toggle');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    function syncButton() {
      button.hidden = reduce.matches;
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
    var languageObserver = new MutationObserver(function () {
      wrap.querySelectorAll('[data-art-label-en]').forEach(function (svg) {
        svg.setAttribute('aria-label', svg.getAttribute('data-art-label-' + (document.documentElement.lang === 'en' ? 'en' : 'zh')));
      });
    });
    languageObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }
  window.AcademicArt = { figure: figure, mount: mount };
})();
