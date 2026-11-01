/* ========================================
   education.js — #education 板块扩展
   在 app.js 的 renderEducation() 渲染完时间线之后，
   在 #educationTimeline 之后插入三块：
     1. 研究与毕业设计（读取 data.education[].thesis）
     2. 荣誉奖项（占位，等用户提供）
   学校与学位由主时间线展示，不重复插入学校信息。
   ======================================== */
(function () {
  'use strict';

  // ---------- 数据接口 ----------
  var THESIS = { master: {}, bachelor: {} };

  // TODO: 等用户提供奖项后替换此处（不要编造）
  var AWARDS = [
    { year: '—', title: '待补充', note: '' },
    { year: '—', title: '待补充', note: '' },
    { year: '—', title: '待补充', note: '' }
  ];

  var PLACEHOLDER_ZH = '待补充';
  var PLACEHOLDER_EN = 'To be added';

  // ---------- 工具 ----------
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function isPlaceholder(v) {
    return !v || v === PLACEHOLDER_ZH || v === PLACEHOLDER_EN || v === '—';
  }
  // 占位文案：带 data-zh/data-en，跟随站内语言切换
  function ph() {
    return '<span class="edu-placeholder" data-zh="' + PLACEHOLDER_ZH + '" data-en="' + PLACEHOLDER_EN + '">' + PLACEHOLDER_ZH + '</span>';
  }

  // 从 schoolEn 推缩写："University College London" → "UCL"，"University of Bristol" → "Bristol"
  function monogram(edu) {
    if (edu.monogram) return edu.monogram;
    var en = edu.schoolEn || edu.school || '';
    var m = en.match(/University of ([A-Za-z]+)/);
    if (m) return m[1];
    var words = en.split(/\s+/).filter(function (w) { return /^[A-Z]/.test(w); });
    if (words.length >= 2) return words.map(function (w) { return w[0]; }).join('');
    return en.slice(0, 3);
  }

  // 校名去掉括号里的英文，避免徽记旁两行都太长
  function shortSchool(s) {
    return String(s || '').replace(/\s*[（(].*?[）)]\s*/g, '').trim();
  }

  // Subject-specific geometry. These are conceptual diagrams, never measured results.
  function sceneText(x, y, zh, en, cls, extra) {
    return '<text x="' + x + '" y="' + y + '" class="' + (cls || 'thesis-scene-label') + '" data-zh="' + esc(zh) + '" data-en="' + esc(en) + '" ' + (extra || '') + '>' + esc(zh) + '</text>';
  }

  function wearableScene() {
    var bones = 'M232 145L188 170L158 236L126 290M232 145L272 177L305 216L355 205M232 145L230 242L224 304L178 368L154 427M224 304L271 367L306 417';
    var joints = [[232,145],[188,170],[158,236],[272,177],[305,216],[230,242],[224,304],[178,368],[271,367],[154,427],[306,417]];
    var waves = [
      'M424 218C439 218 439 200 454 200S469 236 484 236S499 205 514 205S529 226 544 226S559 203 574 203S589 218 611 218',
      'M424 270C444 270 444 254 461 254S485 286 501 286S520 260 537 260S553 279 571 279S594 270 611 270',
      'M424 322C442 322 445 312 460 312S477 332 493 332S515 306 532 306S554 325 573 325S597 322 611 322'
    ];
    return '<ellipse class="thesis-field thesis-field-sensing" cx="236" cy="281" rx="177" ry="183"/>' +
      '<path class="thesis-ground" d="M95 446H365"/>' +
      '<g class="thesis-reference"><circle cx="231" cy="117" r="20"/><path d="M231 144V298M231 163L181 260M231 163L281 260M231 298L202 425M231 298L261 425"/></g>' +
      '<g class="thesis-kinematics"><circle class="thesis-head" cx="232" cy="117" r="20"/><path class="thesis-bone-body" d="' + bones + '"/><path class="thesis-bone-line" d="' + bones + '"/>' +
      joints.map(function (point) { return '<circle class="thesis-joint" cx="' + point[0] + '" cy="' + point[1] + '" r="4"/>'; }).join('') +
      '<path class="thesis-angle" d="M214 320A32 32 0 0 1 251 324"/>' +
      [[231,203],[225,293],[178,368]].map(function (point, i) { return '<g class="thesis-sensor" style="--sensor:' + i + '"><circle class="thesis-sensor-wave" cx="' + point[0] + '" cy="' + point[1] + '" r="16"/><rect x="' + (point[0]-6) + '" y="' + (point[1]-6) + '" width="12" height="12" rx="3"/></g>'; }).join('') + '</g>' +
      '<path class="thesis-connection" d="M249 203C325 182 343 218 403 218M244 293C324 315 344 270 403 270M195 368C301 409 341 322 403 322"/>' +
      '<g class="thesis-signals">' + waves.map(function (path, i) { return '<path class="thesis-signal-baseline thesis-channel-' + i + '" d="' + path + '"/><path class="thesis-signal-live thesis-channel-' + i + '" style="--channel:' + i + '" d="' + path + '"/>'; }).join('') + '</g>' +
      '<path class="thesis-transmit" d="M624 270H679"/>' +
      '<g class="thesis-phone"><rect class="thesis-phone-shell" x="693" y="115" width="151" height="309" rx="24"/><rect class="thesis-phone-screen" x="702" y="124" width="133" height="291" rx="17"/><path class="thesis-phone-speaker" d="M752 133H785"/>' +
      sceneText(719,166,'姿态反馈','POSTURE','thesis-phone-label') +
      '<g class="thesis-phone-pose"><circle cx="769" cy="204" r="10"/><path d="M769 218V286M769 235L743 260M769 235L798 254M769 286L744 326M769 286L797 324"/></g>' +
      '<path class="thesis-phone-angle" d="M742 295A31 31 0 0 1 748 268"/><rect class="thesis-feedback-surface" x="716" y="350" width="106" height="39" rx="6"/>' + sceneText(769,374,'动作反馈','FEEDBACK','thesis-phone-feedback','text-anchor="middle"') + '</g>' +
      sceneText(231,488,'运动姿态','MOVEMENT','thesis-scene-label','text-anchor="middle"') + sceneText(519,154,'多路传感信号','SENSOR SIGNALS','thesis-scene-label','text-anchor="middle"') + sceneText(519,377,'机器学习分析','ML ANALYSIS','thesis-scene-note','text-anchor="middle"') + sceneText(769,488,'手机端交互','MOBILE INTERACTION','thesis-scene-label','text-anchor="middle"');
  }

  function orderFlowScene() {
    var bids = [38,64,101,128,157,181,146,120,92,58];
    var asks = [176,154,120,142,106,78,88,57,38,25];
    var rows = bids.map(function (width, i) {
      var y=134+i*23;
      return '<g class="thesis-book-row" style="--book-row:' + i + '"><rect class="thesis-book-bid" x="' + (288-width) + '" y="' + y + '" width="' + width + '" height="13" rx="2"/><rect class="thesis-book-ask" x="310" y="' + y + '" width="' + asks[i] + '" height="13" rx="2"/></g>';
    }).join('');
    var price = 'M599 277L617 260L635 272L653 231L671 249L689 220L707 243L725 206L743 225L761 194L779 215L797 188L815 208L836 198';
    var volumes = [23,36,19,47,30,60,34,45,27,66,48,35,51,29];
    return '<ellipse class="thesis-field thesis-field-market" cx="302" cy="261" rx="215" ry="173"/>' +
      sceneText(172,97,'买方挂单','BID DEPTH','thesis-book-label thesis-bid-ink','text-anchor="middle"') + sceneText(399,97,'卖方挂单','ASK DEPTH','thesis-book-label thesis-ask-ink','text-anchor="middle"') +
      '<path class="thesis-book-mid" d="M299 124V372"/>' + rows +
      '<path class="thesis-book-spread" d="M287 396H310M287 390V402M310 390V402"/>' + sceneText(299,426,'买卖价差','SPREAD','thesis-scene-note','text-anchor="middle"') +
      '<path class="thesis-connection" d="M489 226C528 226 531 251 573 251M489 296C530 296 532 272 573 272"/>' +
      '<g class="thesis-print-packets"><circle cx="513" cy="235" r="4"/><circle cx="530" cy="251" r="3"/><circle cx="516" cy="291" r="4"/></g>' +
      '<path class="thesis-market-axis" d="M596 158V333H847"/><path class="thesis-market-base" d="' + price + '"/><path class="thesis-market-live" d="' + price + '"/>' +
      volumes.map(function (height,i) { return '<rect class="thesis-volume ' + (i%3===0?'thesis-volume-sell':'') + '" x="' + (599+i*17) + '" y="' + (410-height) + '" width="10" height="' + height + '" rx="1"/>'; }).join('') +
      sceneText(723,120,'S&P 500 · 日内信号','S&P 500 · INTRADAY','thesis-scene-label','text-anchor="middle"') + sceneText(849,334,'时间','TIME','thesis-scene-note','text-anchor="end" dy="20"') +
      sceneText(723,450,'成交量与订单变化','VOLUME & ORDER CHANGES','thesis-scene-note','text-anchor="middle"');
  }

  function thesisFigure(type) {
    var wearable=type==='bachelor';
    var zh=wearable?'可穿戴姿态监测：运动关节、传感信号与手机反馈的主题示意':'订单流研究：买卖深度、价差与非单向日内价格路径的主题示意';
    var en=wearable?'Conceptual diagram of movement joints, wearable sensors and mobile feedback':'Conceptual diagram of order-book depth, spread and a non-directional intraday price path';
    return '<figure class="research-figure thesis-scene research-' + type + '"><svg viewBox="0 0 900 520" role="img" aria-label="' + zh + '" data-art-label-zh="' + zh + '" data-art-label-en="' + en + '"><title>' + zh + '</title>' + (wearable?wearableScene():orderFlowScene()) + '</svg><figcaption><span data-zh="研究主题示意" data-en="Conceptual study">研究主题示意</span><span class="thesis-figure-kind" data-zh="' + (wearable?'姿态感知与交互':'市场微观结构') + '" data-en="' + (wearable?'Sensing & interaction':'Market microstructure') + '">' + (wearable?'姿态感知与交互':'市场微观结构') + '</span></figcaption></figure>';
  }

  // ---------- 1. 学校徽记 ----------
  function renderLogos(education) {
    var items = education.map(function (edu, i) {
      var logo;
      if (edu.logo) {
        logo = '<div class="edu-logo has-img"><img src="' + esc(edu.logo) + '" alt="' + esc(edu.schoolEn || edu.school) + '" loading="lazy"></div>';
      } else {
        var mg = monogram(edu);
        logo = '<div class="edu-logo' + (mg.length > 4 ? ' is-long' : '') + '" aria-hidden="true">' + esc(mg) + '</div>';
      }
      var school = shortSchool(edu.school);
      var schoolHtml = edu.link
        ? '<a href="' + esc(edu.link) + '" target="_blank" rel="noopener" data-zh="' + esc(school) + '" data-en="' + esc(edu.schoolEn) + '">' + esc(school) + '</a>'
        : '<span data-zh="' + esc(school) + '" data-en="' + esc(edu.schoolEn) + '">' + esc(school) + '</span>';
      return '' +
        '<div class="edu-logo-item reveal" data-delay="' + (i * 70) + '">' +
          logo +
          '<div class="edu-logo-meta">' +
            '<div class="edu-logo-school">' + schoolHtml + '</div>' +
            '<div class="edu-logo-degree" data-zh="' + esc(edu.degree) + '" data-en="' + esc(edu.degreeEn) + '">' + esc(edu.degree) + '</div>' +
            '<div class="edu-logo-period">' + esc(edu.period) + '</div>' +
          '</div>' +
        '</div>';
    }).join('');
    return '<div class="edu-logos">' + items + '</div>';
  }

  // ---------- 2. 研究与毕业设计 ----------
  function thesisItem(t, kickerZh, kickerEn, schoolAbbr, delay, type) {
    var title = isPlaceholder(t.title) ? ph() :
      '<span data-zh="' + esc(t.title) + '" data-en="' + esc(t.titleEn || t.title) + '">' + esc(t.title) + '</span>';
    var summary = isPlaceholder(t.summary) ? ph() :
      '<span data-zh="' + esc(t.summary) + '" data-en="' + esc(t.summaryEn || t.summary) + '">' + esc(t.summary) + '</span>';
    var tags = (t.tags && t.tags.length)
      ? t.tags.map(function (x, i) {
          return '<span class="thesis-tag" data-zh="' + esc(x) + '" data-en="' + esc((t.tagsEn || [])[i] || x) + '">' + esc(x) + '</span>';
        }).join('')
      : '<span class="thesis-tag is-placeholder" data-zh="关键词待补充" data-en="Keywords TBA">关键词待补充</span>';
    var result = t.result ? '<div class="thesis-result">' + esc(t.result) + '</div>' : '';
    return '' +
      '<article class="thesis-item reveal" data-study="' + type + '" data-delay="' + delay + '">' +
        '<div class="thesis-kicker"><span data-zh="' + kickerZh + '" data-en="' + kickerEn + '">' + kickerZh + '</span><span class="sep">/</span>' + esc(schoolAbbr) + '</div>' +
        thesisFigure(type) +
        '<h3 class="thesis-title">' + title + '</h3>' +
        '<p class="thesis-summary">' + summary + '</p>' +
        '<div class="thesis-tags">' + tags + '</div>' +
        result +
      '</article>';
  }

  function renderThesis(education) {
    var master = education[0] || {};
    var bachelor = education[1] || {};
    THESIS.master = master.thesis || {};
    THESIS.bachelor = bachelor.thesis || {};
    return '' +
      '<div class="edu-block">' +
        '<div class="edu-block-head reveal" data-delay="0">' +
          '<div class="edu-block-title" data-zh="研究与毕业设计" data-en="Research &amp; Thesis">研究与毕业设计</div>' +
          '<button class="research-motion-toggle" type="button" aria-pressed="false"><i class="motion-symbol" aria-hidden="true"></i><span data-zh="暂停动效" data-en="Pause motion">暂停动效</span></button>' +
        '</div>' +
        '<div class="thesis-grid">' +
          thesisItem(THESIS.master, '硕士毕业设计', 'MSc Thesis', monogram(master), 70, 'master') +
          thesisItem(THESIS.bachelor, '本科毕业设计', 'BEng Final Project', monogram(bachelor), 140, 'bachelor') +
        '</div>' +
      '</div>';
  }

  // ---------- 3. 荣誉奖项 ----------
  function renderAwards() {
    var rows = AWARDS.map(function (a, i) {
      var title = isPlaceholder(a.title) ? ph() : esc(a.title);
      var note = a.note ? '<div class="edu-award-note">' + esc(a.note) + '</div>' : '';
      return '' +
        '<li class="edu-award-item reveal" data-delay="' + (70 + i * 70) + '">' +
          '<div class="edu-award-year">' + esc(a.year || '—') + '</div>' +
          '<div class="edu-award-body">' +
            '<div class="edu-award-title">' + title + '</div>' +
            note +
          '</div>' +
        '</li>';
    }).join('');
    return '' +
      '<div class="edu-block">' +
        '<div class="edu-block-head reveal" data-delay="0">' +
          '<div class="edu-block-title" data-zh="荣誉奖项" data-en="Honors &amp; Awards">荣誉奖项</div>' +
          '<div class="edu-block-hint" data-zh="内容整理中" data-en="Content in progress">内容整理中</div>' +
        '</div>' +
        '<ul class="edu-award-list">' + rows + '</ul>' +
      '</div>';
  }

  // ---------- 入场：app.js 的 IO 在我们插入前已跑完，自己补一个 ----------
  function observeReveal(root) {
    var els = root.querySelectorAll('.reveal');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var d = +(en.target.getAttribute('data-delay') || 0);
        setTimeout(function () { en.target.classList.add('visible'); }, d);
        io.unobserve(en.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  // ---------- 语言：复用 app.js 当前语言（顶层 let lang，classic script 可直接读） ----------
  function syncLang(root) {
    var k = 'zh';
    try { if (typeof lang === 'string') k = lang; } catch (e) {}
    if (k === 'zh') return;
    root.querySelectorAll('[data-' + k + ']').forEach(function (el) {
      var v = el.getAttribute('data-' + k);
      if (v != null) el.textContent = v;
    });
  }

  // ---------- 挂载 ----------
  function mount() {
    var tl = document.getElementById('educationTimeline');
    var section = document.getElementById('education');
    if (!tl || !section || document.querySelector('.edu-extra')) return true;

    var education = null;
    try { if (typeof data !== 'undefined' && data && Array.isArray(data.education)) education = data.education; } catch (e) {}
    if (!education || !education.length) return false;

    var wrap = document.createElement('div');
    wrap.className = 'edu-extra';
    // Honors now use the confirmed resume entries in the main awards section.
    wrap.innerHTML = renderThesis(education);
    tl.insertAdjacentElement('afterend', wrap);

    syncLang(wrap);
    observeReveal(wrap);
    if (window.AcademicArt) window.AcademicArt.mount(wrap);
    return true;
  }

  // app.js 在 DOMContentLoaded 里 await fetch 后才渲染，这里等 #educationTimeline 有子节点再挂
  function boot() {
    var tl = document.getElementById('educationTimeline');
    if (!tl) return;
    if (tl.children.length && mount()) return;

    var done = false;
    var mo = new MutationObserver(function () {
      if (done) return;
      if (tl.children.length && mount()) { done = true; mo.disconnect(); }
    });
    mo.observe(tl, { childList: true });

    // 兜底：data 已就绪但 MO 没触发（极少见），轮询几次
    var tries = 0;
    var timer = setInterval(function () {
      if (done || ++tries > 40) { clearInterval(timer); return; }
      if (tl.children.length && mount()) { done = true; mo.disconnect(); clearInterval(timer); }
    }, 150);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // 暴露给控制台/其他脚本以便日后替换数据后重绘
  window.__eduExtra = { THESIS: THESIS, AWARDS: AWARDS, remount: function () {
    var old = document.querySelector('.edu-extra');
    if (old) old.remove();
    mount();
  } };
})();
