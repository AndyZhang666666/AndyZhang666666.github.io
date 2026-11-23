/* The education articles own the thesis text. These plates visualise two illustrative experiments. */
(function () {
  'use strict';
  function copy(zh, en) {
    return '<span data-zh="' + zh + '" data-en="' + en + '">' + (document.documentElement.lang === 'en' ? en : zh) + '</span>';
  }

  function wearable() {
    return `<defs>
      <linearGradient id="wear-body" x1="0" y1="0" x2=".95" y2=".42" gradientUnits="objectBoundingBox"><stop stop-color="#805d58"/><stop offset=".31" stop-color="#c39d88"/><stop offset=".62" stop-color="#ead6bd"/><stop offset="1" stop-color="#aa8175"/></linearGradient>
      <linearGradient id="wear-bone" x2="1" y2="1" gradientUnits="objectBoundingBox"><stop stop-color="#ebd5bd"/><stop offset=".42" stop-color="#c4a089"/><stop offset="1" stop-color="#775552"/></linearGradient>
      <radialGradient id="wear-glow"><stop stop-color="#faf1dc" stop-opacity=".95"/><stop offset="1" stop-color="#e9cbb6" stop-opacity="0"/></radialGradient>
      <radialGradient id="wear-shadow"><stop stop-color="#7a5250" stop-opacity=".25"/><stop offset="1" stop-color="#7a5250" stop-opacity="0"/></radialGradient>
      <pattern id="wear-weave" patternUnits="userSpaceOnUse" width="4" height="4"><path d="M0 1h4M1 0v4" stroke="#7e6763" stroke-width=".5" opacity=".65"/></pattern>
      <pattern id="wear-dots" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".72" fill="#8f6d5f" opacity=".36"/></pattern>
      <g id="wear-limb"><path d="M-6 -5 Q3 -10 9 -1 Q15 21 18 43 Q18 52 14 61 Q13 70 18 86 L24 116 Q29 124 27 131 Q22 136 18 128 L13 119 L4 85 Q0 66 2 52 L-5 19 Q-10 3 -6 -5Z" fill="url(#wear-bone)" stroke="#755750" stroke-width="1.3"/>
        <path d="M0 5 Q6 25 9 44 M10 67 L18 108" fill="none" stroke="#f4e4cd" stroke-width="1.8"/><path d="M3 6q8 3 8 14 M4 9q2 14 6 20 M19 108l4 13 m-6-10 3 12" fill="none" stroke="#86665b" stroke-width=".7"/><circle cx="10" cy="56" r="6.5" fill="#c8aa96" stroke="#795953"/>
        <path d="M1 24 L13 21 L17 35 L4 39Z" fill="#49363b"/><path d="M5 26l7-2 2 8-7 2Z" fill="#d9ad8d"/></g>
    </defs>
    <rect width="540" height="294" fill="#f1e4d3"/><rect width="540" height="294" fill="url(#wear-dots)"/>
    <ellipse cx="238" cy="130" rx="209" ry="175" fill="url(#wear-glow)"/>
    <g fill="none" stroke="#826a62" opacity=".31"><path d="M23 18v12m-6-6h12 M511 24h12m-6-6v12 M23 268v12m-6-6h12 M511 274h12m-6-6v12"/><path d="M55 265H484"/><path d="M217 24V273" stroke-dasharray="2 6"/></g>
    <ellipse cx="211" cy="267" rx="85" ry="12" fill="url(#wear-shadow)"/>
    <g transform="translate(217 98)" fill="none"><path d="M0 132 A132 132 0 0 0 132 0" stroke="#a0846c" stroke-width="1" stroke-dasharray="2 5"/>
      <path d="M0 118 A118 118 0 0 0 118 0" stroke="#a0846c" opacity=".43"/>
      <g stroke="#97796a">${Array.from({length: 10}, (_, i) => '<path transform="rotate(-' + i * 10 + ')" d="M0 129v' + (i % 3 ? 4 : 9) + '"/>').join('')}</g>
      <path data-angle-arc stroke="#a34032" stroke-width="2.4"/></g>
    <g class="rp-diagram-type" fill="#765a50"><text x="230" y="244">0°</text><text x="344" y="100">90°</text></g>
    <g stroke="#795f56" stroke-linejoin="round"><path d="M184 169 Q175 191 166 211 L156 250 Q150 255 147 260 Q159 266 172 255 L181 248 L193 219 L206 185Z" fill="#b39b89"/>
      <path d="M189 159 Q194 158 214 162 Q222 177 219 193 L214 222 L222 250 L231 259 Q229 265 218 264 L208 260 L201 243 L195 219 L191 193Z" fill="url(#wear-body)"/>
      <path data-body-trunk d="M195 72 Q183 81 180 101 Q175 126 180 142 L177 157 Q177 172 189 177 Q200 181 214 174 L218 163 Q208 148 207 139 L216 117 Q225 108 224 97 Q223 85 210 80 L208 70Z" fill="url(#wear-body)"/>
      <path d="M194 73 L196 60 L211 58 L210 78 Q202 85 194 78Z" fill="url(#wear-bone)"/>
      <path d="M190 42 Q189 28 203 26 Q220 23 224 36 L223 46 L229 52 L224 55 L224 59 Q220 67 209 67 L198 64 Q192 60 190 51Z" fill="url(#wear-body)"/>
      <path d="M193 45 Q197 38 204 38 L220 36 M184 110 Q191 113 207 106 M183 144 Q189 151 204 150 M194 182 L203 216" fill="none" opacity=".65"/>
      <path d="M184 89 Q196 82 215 85 L217 95 Q197 91 183 100Z" fill="#4e3e41"/>
      <path d="M181 89l7-2 2 15-8 1Z" fill="#a44739"/></g>
    <g transform="translate(217 98)"><g data-ghost-arm fill="none" stroke="#994536" stroke-dasharray="4 4" opacity=".7" visibility="hidden"><path d="M0 0Q5 27 10 56L24 128" stroke-width="3"/><circle cx="24" cy="128" r="5"/></g>
      <g data-study-arm><use href="#wear-limb"/><circle data-node="arm" cx="9" cy="29" r="8" class="rp-node"/></g>
      <circle r="9" fill="#d5b69d" stroke="#75564f"/><circle r="3.2" fill="#73514c"/></g>
    <circle data-node="back" cx="184" cy="94" r="4" class="rp-node"/>
    <g class="rp-sensor-wire" fill="none" stroke="#a34234"><path data-lead-arm d="M226 127 L327 58 H378"/><path data-lead-back d="M184 94 L139 76 H91"/></g>
    <g class="rp-diagram-type" fill="#785a50"><text x="57" y="72">IMU · B</text><text x="383" y="61">IMU · A</text></g>
    <g transform="translate(429 146)">
      <path d="M-38 -37h-6v7 M33 -37h6v7 M-44 42v7h7 M39 42v7h-7" fill="none" stroke="#ab8d7a"/>
      <g data-inset="arm"><path d="M-37 23q23-15 64-8l10 8q-35-4-65 12Z" fill="#967e71" stroke="#775f59"/><path d="M-36 24q23-15 61-8l9 6q-32-3-61 11Z" fill="url(#wear-weave)"/></g>
      <g data-inset="back" visibility="hidden"><path d="M-35 22l33-14 37 10-33 19Z" fill="#d1ab96" stroke="#795d58"/><path d="M-27 22l25-10 29 7-26 13Z" fill="url(#wear-weave)"/></g>
      <g fill="none" stroke="#92776d" stroke-dasharray="2 3"><path d="M-21 -8v26 M23 -11v27 M0 -22V8"/></g>
      <path d="M-23 7l24-13 24 9L0 16Z" fill="#735d57" stroke="#5d4d4a"/><path d="M-23 4l24-13 24 9L0 13Z" fill="#78837b" stroke="#50665d"/>
      <g fill="none" stroke="#ded3a2" stroke-width=".8"><path d="M-15 4l9-5 7 3 8-4 M-9 7l7-4 4 2 12-6 M-5 9l5-3"/><path d="M-15 1l3-1m25-1 3-2"/></g>
      <path d="M-10 -12l12-6 10 4-12 7Z" fill="#42393a" stroke="#5f4946"/><path d="M-10 -12v4l10 5v-4 M0 -7l12-7v4L0 -3" fill="#876e63" stroke="#66514e" stroke-width=".7"/>
      <path d="M-21 -18L1-30l22 8L1-10Z" fill="#d8b69e" fill-opacity=".64" stroke="#9d7869"/><path d="M-16 -18L0-26M5-23l7 2" fill="none" stroke="#fff1d7"/>
      <text x="0" y="66" text-anchor="middle" class="rp-diagram-type" fill="#70554b" data-inset-label>IMU · A</text>
    </g>`;
  }

  function orderFlow() {
    return `<defs>
      <pattern id="book-ask-engraving" width="7" height="7" patternUnits="userSpaceOnUse">
        <rect width="7" height="7" fill="var(--book-ask)" opacity=".07"/>
        <path d="M-1 1L1 -1 M0 7L7 0 M6 8L8 6" fill="none" stroke="var(--book-ask)" opacity=".34" stroke-width=".7"/>
      </pattern>
    </defs>
    <g fill="none" stroke="var(--line)" stroke-width=".75"><path d="M40 52h464M40 98h464M40 144h464M40 190h464"/></g>
    <path d="M40 236h464" stroke="var(--soft)" stroke-width=".8"/>
    <g data-fill-bid fill="var(--book-bid)" fill-opacity=".16"></g>
    <g data-fill-ask fill="url(#book-ask-engraving)"></g>
    <g fill="none" stroke-width="1.8" stroke-linejoin="round">
      <path data-path-bid stroke="var(--book-bid)"/><path data-path-ask stroke="var(--book-ask)"/>
    </g>
    <g fill="none" stroke-width="1.15" stroke-dasharray="3 3">
      <path data-base-bid stroke="var(--book-bid)"/><path data-base-ask stroke="var(--book-ask)"/>
    </g>
    <g data-inspect-guides fill="none" stroke="var(--soft)" stroke-width=".8" stroke-dasharray="1.5 4" opacity=".75"><path data-rule-bid/><path data-rule-ask/></g>
    <g fill="var(--pane)" stroke-width="1.8">
      <g data-dot-bid><circle r="4" stroke="var(--book-bid)"/></g>
      <g data-dot-ask><path d="M0 -4.8L4.8 0L0 4.8L-4.8 0Z" stroke="var(--book-ask)"/></g>
    </g>
    <g class="rp-diagram-type" fill="var(--soft)">
      <path d="M40 20h18" stroke="var(--book-bid)" stroke-width="1.6"/><circle cx="49" cy="20" r="2.7" fill="var(--book-bid)"/><text x="65" y="24" data-bid-label></text>
      <path d="M128 20h18" stroke="var(--book-ask)" stroke-width="1.6"/><path d="M137 16.5l3.5 3.5-3.5 3.5-3.5-3.5Z" fill="var(--book-ask)"/><text x="153" y="24" data-ask-label></text>
      <g data-before-key visibility="hidden"><path d="M220 20h18" stroke="var(--soft)" stroke-width="1.1" stroke-dasharray="3 3"/><text x="244" y="24" data-before-label></text></g>
      <text x="504" y="24" text-anchor="end" data-plot-unit></text>
      <g class="rp-book-axis" text-anchor="end"><text x="34" y="55" data-plot-max></text><text x="34" y="147" data-plot-mid></text><text x="34" y="239">0</text></g>
      <text x="40" y="258">4997.75</text><text x="247" y="258" text-anchor="end" fill="var(--book-bid)">5000.00</text>
      <text x="297" y="258" fill="var(--book-ask)">5000.25</text><text x="504" y="258" text-anchor="end">5002.50</text>
      <text x="272" y="282" text-anchor="middle" data-spread-label></text>
    </g>
    <path d="M247 265v4h50v-4" fill="none" stroke="var(--soft)" stroke-width=".8"/>`;
  }

  function figure(type) {
    const wear = type === 'bachelor';
    const title = wear ? copy('一次抬臂','An arm in motion') : copy('撤单之后','Anatomy of a cancellation');
    const note = wear ? copy('动作示意 · 9 帧','Illustrative motion · 9 frames') : copy('教学盘口 · 双边各 10 档','Illustrative book · 10 levels per side');
    const zh = wear ? '抬臂运动中的上臂和上背传感器，以及关节角度和定格位置' : '模拟盘口的买卖挂量、累计深度与最优报价间隔';
    const en = wear ? 'Shoulder movement, two sensor locations and a pinned pose' : 'Illustrative bid and ask depth, resting orders and the spread';
    return '<figure class="research-figure thesis-scene research-' + type + ' research-plate" id="thesis-' + (wear ? 'wearable' : 'order-flow') + '">' +
      '<figcaption class="rp-heading"><div><span class="rp-eyebrow">' + (wear ? 'BRISTOL / KINEMATICS' : 'UCL / MICROSTRUCTURE') + '</span><strong>' + title + '</strong></div><small>' + note + '</small></figcaption>'+
      '<div class="rp-bench"><div class="rp-illustration"><svg viewBox="0 0 540 294" role="img" aria-label="'+zh+'" data-art-label-zh="'+zh+'" data-art-label-en="'+en+'">'+(wear ? wearable() : orderFlow())+'</svg></div><div class="rp-readout"></div></div></figure>';
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
