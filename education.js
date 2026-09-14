/* ========================================
   education.js — #education 板块扩展
   在 app.js 的 renderEducation() 渲染完时间线之后，
   在 #educationTimeline 之后插入三块：
     1. 学校徽记（logo / 文字 monogram）
     2. 研究与毕业设计（占位，等用户提供）
     3. 荣誉奖项（占位，等用户提供）
   不改动 app.js / data.json / style.css。
   ======================================== */
(function () {
  'use strict';

  // ---------- 数据接口 ----------
  // TODO: 等用户提供毕设内容后替换此处（不要编造）
  var THESIS = {
    master:   { title: '待补充', summary: '待补充', tags: [], result: '' },
    bachelor: { title: '待补充', summary: '待补充', tags: [], result: '' }
  };

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
  function thesisItem(t, kickerZh, kickerEn, schoolAbbr, delay) {
    var title = isPlaceholder(t.title) ? ph() : esc(t.title);
    var summary = isPlaceholder(t.summary) ? ph() : esc(t.summary);
    var tags = (t.tags && t.tags.length)
      ? t.tags.map(function (x) { return '<span class="thesis-tag">' + esc(x) + '</span>'; }).join('')
      : '<span class="thesis-tag is-placeholder" data-zh="关键词待补充" data-en="Keywords TBA">关键词待补充</span>';
    var result = t.result ? '<div class="thesis-result">' + esc(t.result) + '</div>' : '';
    return '' +
      '<article class="thesis-item reveal" data-delay="' + delay + '">' +
        '<div class="thesis-kicker"><span data-zh="' + kickerZh + '" data-en="' + kickerEn + '">' + kickerZh + '</span><span class="sep">/</span>' + esc(schoolAbbr) + '</div>' +
        '<h3 class="thesis-title">' + title + '</h3>' +
        '<p class="thesis-summary">' + summary + '</p>' +
        '<div class="thesis-tags">' + tags + '</div>' +
        result +
      '</article>';
  }

  function renderThesis(education) {
    var master = education[0] || {};
    var bachelor = education[1] || {};
    return '' +
      '<div class="edu-block">' +
        '<div class="edu-block-head reveal" data-delay="0">' +
          '<div class="edu-block-title" data-zh="研究与毕业设计" data-en="Research &amp; Thesis">研究与毕业设计</div>' +
          '<div class="edu-block-hint" data-zh="内容整理中" data-en="Content in progress">内容整理中</div>' +
        '</div>' +
        '<div class="thesis-grid">' +
          thesisItem(THESIS.master, '硕士毕业设计', 'MSc Thesis', monogram(master), 70) +
          thesisItem(THESIS.bachelor, '本科毕业设计', 'BEng Final Project', monogram(bachelor), 140) +
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
    wrap.innerHTML = renderLogos(education) + renderThesis(education) + renderAwards();
    tl.insertAdjacentElement('afterend', wrap);

    syncLang(wrap);
    observeReveal(wrap);
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
