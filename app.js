// ===== STATE =====
let lang = 'zh';
let data = null;

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
  .replace(/</g, '&lt;').replace(/>/g, '&gt;');

// 把「93.1%」「+60%」「10 万+」这类数字片段包成 <strong>，让指标在正文里跳出来
const hl = (s) => esc(s).replace(
  /([↑↓+\-]?\d[\d,.]*\s*(?:%|万\+?|k\+?|K\+?|\/\d+)?\+?)/g,
  '<strong>$1</strong>'
);

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('data.json');
    data = await res.json();
    render();
    attachEventListeners();
    initScrollAnimations();
    initCountUp();
    initNavState();
    initScrollProgress();
    initSpotlight();
    initCardTilt();
    initHeroFade();
    initPalette();
    initMagnetic();
  } catch (err) {
    console.error('Failed to load data:', err);
  }
});

function render() {
  if (!data) return;
  renderAbout();
  renderAiViews();
  renderMarquee();
  renderTimeline();
  renderEducation();
  renderProjects();
  renderAwards();
  renderNow();
  renderUses();
  renderSkills();
  renderContact();
  renderColophon();
  updateLanguage();
}

// ===== RAILROAD TIMELINE（每段可点开，展开该段做过的东西） =====
function renderTimeline() {
  const el = document.getElementById('timeline');
  el.innerHTML = data.experience.map((exp, i) => {
    const works = exp.works || [];
    const hasWorks = works.length > 0;
    const worksHtml = hasWorks ? `
      <div class="timeline-works" id="works-${i}" role="region" aria-hidden="true">
        <div class="timeline-works-inner">
          <div class="works-label" data-zh="在这里做了什么" data-en="What I built here">在这里做了什么</div>
          <div class="works-grid">
            ${works.map((w, j) => `
              <div class="work-card" style="--i:${j}">
                <div class="work-tags">${(w.tags || []).map(t => `<span class="work-tag">${esc(t)}</span>`).join('')}</div>
                <div class="work-name" data-zh="${esc(w.name)}" data-en="${esc(w.nameEn || w.name)}">${esc(w.name)}</div>
                <p class="work-desc" data-html-zh="${esc(hl(w.desc))}" data-html-en="${esc(hl(w.descEn || w.desc))}">${hl(w.desc)}</p>
                ${w.url ? `<a class="work-link" href="${esc(w.url)}" target="_blank" rel="noopener"><span data-zh="打开看看" data-en="Open">打开看看</span> ↗</a>` : ''}
              </div>`).join('')}
          </div>
        </div>
      </div>` : '';

    return `
    <div class="timeline-item reveal${i === 0 ? ' current' : ''}${hasWorks ? ' expandable' : ''}" data-delay="${i * 70}" data-idx="${i}">
      <div class="timeline-period" data-zh="${esc(exp.period)}" data-en="${esc(exp.periodEn || exp.period)}">${esc(exp.period)}</div>
      <button type="button" class="timeline-head${hasWorks ? ' timeline-toggle' : ''}" ${hasWorks ? `aria-expanded="false" aria-controls="works-${i}"` : 'disabled'}>
        <span class="timeline-company" data-zh="${esc(exp.company)}" data-en="${esc(exp.companyEn)}">${esc(exp.company)}</span>
        <span class="timeline-role" data-zh="${esc(exp.role)}" data-en="${esc(exp.roleEn)}">${esc(exp.role)}</span>
        ${hasWorks ? `<span class="timeline-expand-hint"><span data-zh="${works.length} 个项目" data-en="${works.length} projects">${works.length} 个项目</span><svg viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>` : ''}
      </button>
      ${exp.location ? `<div class="timeline-loc" data-zh="${esc(exp.location)}" data-en="${esc(exp.locationEn || exp.location)}">${esc(exp.location)}</div>` : ''}
      <ul class="timeline-highlights">
        ${(exp.highlights || []).map((h, j) => `<li data-html-zh="${esc(hl(h))}" data-html-en="${esc(hl((exp.highlightsEn || [])[j] || h))}">${hl(h)}</li>`).join('')}
      </ul>
      ${worksHtml}
    </div>
  `;
  }).join('');

  // 点击标题行展开 / 收起；用 grid-template-rows 0fr→1fr 做高度动画
  el.querySelectorAll('.timeline-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.timeline-item');
      const open = !item.classList.contains('open');
      item.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
      const panel = item.querySelector('.timeline-works');
      if (panel) panel.setAttribute('aria-hidden', String(!open));
    });
  });
}

function renderEducation() {
  const el = document.getElementById('educationTimeline');
  el.innerHTML = data.education.map((edu, i) => {
    const schoolTag = edu.link ? 'a' : 'span';
    const schoolAttr = edu.link ? ` href="${esc(edu.link)}" target="_blank" rel="noopener" class="timeline-company clickable"` : ' class="timeline-company"';
    return `
    <div class="timeline-item reveal" data-delay="${i * 70}">
      <div class="timeline-period">${esc(edu.period)}</div>
      <div class="timeline-head">
        <${schoolTag}${schoolAttr} data-zh="${esc(edu.school)}" data-en="${esc(edu.schoolEn)}">${esc(edu.school)}</${schoolTag}>
        <span class="timeline-role" data-zh="${esc(edu.degree)}" data-en="${esc(edu.degreeEn)}">${esc(edu.degree)}</span>
      </div>
      <ul class="timeline-highlights">
        <li><strong>${esc(edu.grade)}</strong></li>
      </ul>
    </div>`;
  }).join('');
}

// ===== PROJECTS (case-study cards) =====
function renderProjects() {
  const grid = document.getElementById('projectGrid');

  grid.innerHTML = data.projects.map((p, i) => {
    const cls = ['project-card', 'reveal'];
    if (p.featured) cls.push('featured');
    if (p.placeholder) cls.push('placeholder');

    const tags = (p.tags || []).map(t => `<span class="project-tag">${esc(t)}</span>`).join('');

    const metrics = (p.metrics || []).length
      ? `<div class="project-metrics">${p.metrics.map((m, j) =>
          `<span class="project-metric" data-zh="${esc(m)}" data-en="${esc((p.metricsEn || [])[j] || m)}">${esc(m)}</span>`
        ).join('')}</div>`
      : '';

    // featured 卡片展开成完整 case study
    const story = (p.featured && p.approach) ? `
      <div class="case">
        <div class="case-block">
          <div class="case-label" data-zh="背景" data-en="Context">背景</div>
          <p class="case-text" data-zh="${esc(p.context)}" data-en="${esc(p.contextEn)}">${esc(p.context)}</p>
        </div>
        <div class="case-block">
          <div class="case-label" data-zh="怎么做的" data-en="Approach">怎么做的</div>
          <ul class="case-list">
            ${p.approach.map((a, j) => `<li data-html-zh="${esc(hl(a))}" data-html-en="${esc(hl((p.approachEn || [])[j] || a))}">${hl(a)}</li>`).join('')}
          </ul>
        </div>
        <div class="case-block">
          <div class="case-label" data-zh="结果" data-en="Result">结果</div>
          <p class="case-text" data-html-zh="${esc(hl(p.result))}" data-html-en="${esc(hl(p.resultEn))}">${hl(p.result)}</p>
        </div>
      </div>` : '';

    const links = p.placeholder
      ? `<div class="project-links"><span class="project-soon" data-zh="内容待补充" data-en="Content coming">内容待补充</span></div>`
      : `<div class="project-links">
          ${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener" class="project-link">
            <span data-zh="打开看看" data-en="Live demo">打开看看</span>
            <svg viewBox="0 0 16 16" fill="none"><path d="M14 8.5v3A1.5 1.5 0 0112.5 13h-9A1.5 1.5 0 012 11.5v-7A1.5 1.5 0 013.5 3h4M10 2h4v4m0-4L7 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </a>` : ''}
          ${p.github ? `<a href="${esc(p.github)}" target="_blank" rel="noopener" class="project-link muted">
            <svg viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" fill="currentColor"/></svg>
            <span>源码</span>
          </a>` : ''}
        </div>`;

    return `
      <article class="${cls.join(' ')}" data-delay="${i * 60}">
        <div class="project-card-inner">
          ${tags ? `<div class="project-tags">${tags}</div>` : ''}
          <h3 class="project-name" data-zh="${esc(p.name)}" data-en="${esc(p.nameEn)}">${esc(p.name)}</h3>
          ${p.subtitle ? `<div class="project-company" data-zh="${esc(p.subtitle)}" data-en="${esc(p.subtitleEn || p.subtitle)}">${esc(p.subtitle)}</div>` : ''}
          ${p.company ? `<div class="project-company" data-zh="${esc(p.company)}${p.period ? ' · ' + esc(p.period) : ''}" data-en="${esc(p.companyEn || p.company)}${p.period ? ' · ' + esc(p.period) : ''}">${esc(p.company)}${p.period ? ' · ' + esc(p.period) : ''}</div>` : ''}
          <p class="project-desc" data-zh="${esc(p.description)}" data-en="${esc(p.descriptionEn)}">${esc(p.description)}</p>
          ${story}
          ${metrics}
          ${links}
        </div>
      </article>`;
  }).join('');
}

function renderAwards() {
  const list = document.getElementById('awardList');
  const awards = data.awards && data.awards.length ? data.awards : [
    { icon: '🎓', name: 'First Class Honours', nameEn: 'First Class Honours', meta: 'UCL · 布里斯托大学', metaEn: 'UCL · Univ. of Bristol' },
    { icon: '＋', name: '奖项待补充', nameEn: 'More to come', meta: '框架已就位，随时填', metaEn: 'Slot ready' }
  ];
  list.innerHTML = awards.map((a, i) => `
    <div class="award-item reveal" data-delay="${i * 70}">
      <span class="award-icon">${esc(a.icon || '◆')}</span>
      <div>
        <div class="award-name" data-zh="${esc(a.name)}" data-en="${esc(a.nameEn || a.name)}">${esc(a.name)}</div>
        <div class="award-meta" data-zh="${esc(a.meta)}" data-en="${esc(a.metaEn || a.meta)}">${esc(a.meta)}</div>
      </div>
    </div>
  `).join('');
}

function renderSkills() {
  const grid = document.getElementById('skillGrid');
  const cats = [
    { zh: '数据与分析', en: 'Data & Analysis', k: 'data' },
    { zh: 'AI 工程', en: 'AI Engineering', k: 'ai' },
    { zh: '产品能力', en: 'Product', k: 'product' },
    { zh: '语言', en: 'Languages', k: 'language' }
  ];
  grid.innerHTML = cats.map((c, i) => `
    <div class="skill-category reveal" data-delay="${i * 70}">
      <div class="skill-cat-name" data-zh="${esc(c.zh)}" data-en="${esc(c.en)}">${esc(c.zh)}</div>
      <div class="skill-tags">
        ${(data.skills[c.k] || []).map((s, j) =>
          `<span class="skill-tag" data-zh="${esc(s)}" data-en="${esc((data.skills[c.k + 'En'] || [])[j] || s)}">${esc(s)}</span>`
        ).join('')}
      </div>
    </div>
  `).join('');
}

// ===== ABOUT =====
function renderAbout() {
  const a = data.about;
  if (!a) return;
  
  document.querySelector('.about-lead').setAttribute('data-zh', a.lead);
  document.querySelector('.about-lead').setAttribute('data-en', a.leadEn);
  document.querySelector('.about-lead').textContent = a.lead;
  
  const bodyPs = document.querySelectorAll('.about-body');
  if (bodyPs[0]) { bodyPs[0].setAttribute('data-zh', a.body); bodyPs[0].setAttribute('data-en', a.bodyEn); bodyPs[0].textContent = a.body; }
  if (bodyPs[1]) { bodyPs[1].setAttribute('data-zh', a.body2); bodyPs[1].setAttribute('data-en', a.body2En); bodyPs[1].textContent = a.body2; }
  if (bodyPs[2]) { bodyPs[2].setAttribute('data-zh', a.body3 || ''); bodyPs[2].setAttribute('data-en', a.body3En || ''); bodyPs[2].textContent = a.body3 || ''; if (!a.body3) bodyPs[2].remove(); }
  
  const facts = document.getElementById('aboutFacts');
  facts.innerHTML = (a.facts || []).map(f => `
    <div class="about-fact${f.empty ? ' empty' : ''}">
      <dt data-zh="${esc(f.k)}" data-en="${esc(f.kEn)}">${esc(f.k)}</dt>
      <dd data-zh="${esc(f.v)}" data-en="${esc(f.vEn)}">${esc(f.v)}</dd>
    </div>
  `).join('');
  
  const pg = document.getElementById('principleGrid');
  pg.innerHTML = (a.principles || []).map((p, i) => `
    <div class="principle-card reveal" data-delay="${i * 90}">
      <div class="principle-num">${esc(p.n)}</div>
      <h3 class="principle-title" data-zh="${esc(p.zh)}" data-en="${esc(p.en)}">${esc(p.zh)}</h3>
      <p class="principle-desc" data-zh="${esc(p.dz)}" data-en="${esc(p.de)}">${esc(p.dz)}</p>
    </div>
  `).join('');
}

// ===== NOW =====
function renderNow() {
  const n = data.now;
  if (!n) return;
  
  const upd = document.getElementById('nowUpdated');
  upd.setAttribute('data-zh', `更新于 ${n.updated}`);
  upd.setAttribute('data-en', `Updated ${n.updated}`);
  upd.textContent = `更新于 ${n.updated}`;
  
  const grid = document.getElementById('nowGrid');
  grid.innerHTML = (n.items || []).map((it, i) => `
    <div class="now-item reveal" data-delay="${i * 80}">
      <dt data-zh="${esc(it.k)}" data-en="${esc(it.kEn)}">${esc(it.k)}</dt>
      <dd data-zh="${esc(it.zh)}" data-en="${esc(it.en)}">${esc(it.zh)}</dd>
    </div>
  `).join('');
}

// ===== USES =====
function renderUses() {
  const u = data.uses;
  if (!u) return;
  
  const grid = document.getElementById('usesGrid');
  grid.innerHTML = (u.groups || []).map((g, i) => `
    <div class="uses-group reveal" data-delay="${i * 70}">
      <h3 class="uses-group-title" data-zh="${esc(g.zh)}" data-en="${esc(g.en)}">${esc(g.zh)}</h3>
      <ul>
        ${(g.items || []).map(it => `<li>${esc(it)}</li>`).join('')}
      </ul>
    </div>
  `).join('');
}

// ===== COLOPHON =====
function renderColophon() {
  return; // 站点说明板块已按要求移除（2026-09-14）

  const c = data.colophon;
  if (!c) return;
  
  // footer 后追加 colophon section（如果不存在）
  let sec = document.getElementById('colophon');
  if (!sec) {
    sec = document.createElement('section');
    sec.id = 'colophon';
    sec.className = 'section colophon';
    sec.innerHTML = `
      <div class="reveal">
        <h2 class="colophon-title" data-zh="站点说明" data-en="Colophon">站点说明</h2>
        <p class="colophon-p" data-zh="" data-en=""></p>
        <p class="colophon-p colophon-p2" data-zh="" data-en=""></p>
      </div>
    `;
    document.querySelector('footer').insertAdjacentElement('beforebegin', sec);
  }
  
  const ps = sec.querySelectorAll('.colophon-p');
  if (ps[0]) { ps[0].setAttribute('data-zh', c.zh); ps[0].setAttribute('data-en', c.en); ps[0].textContent = c.zh; }
  if (ps[1]) { ps[1].setAttribute('data-zh', c.zh2); ps[1].setAttribute('data-en', c.en2); ps[1].textContent = c.zh2; }
}

function renderContact() {
  const grid = document.getElementById('contactGrid');
  const c = data.contact;
  const items = [
    { icon: '☎', label: '手机', labelEn: 'Phone', value: c.phone, copy: true },
    { icon: '✉', label: '邮箱', labelEn: 'Email', value: c.email, href: 'mailto:' + c.email },
    { icon: '◈', label: '微信', labelEn: 'WeChat', value: c.wechat, copy: true },
    { icon: '⌘', label: 'GitHub', labelEn: 'GitHub', value: '@AndyZhang666666', href: c.github }
  ];
  grid.innerHTML = items.map((it, i) => {
    const tag = it.href ? 'a' : 'div';
    const attrs = it.href ? ` href="${esc(it.href)}" target="_blank" rel="noopener"` : '';
    return `
      <${tag}${attrs} class="contact-item reveal"${it.copy ? ` data-copy="${esc(it.value)}"` : ''} data-delay="${i * 70}">
        <span class="contact-icon">${it.icon}</span>
        <span class="contact-text">
          <span class="contact-label" data-zh="${esc(it.label)}" data-en="${esc(it.labelEn)}">${esc(it.label)}</span>
          <span class="contact-value">${esc(it.value)}</span>
        </span>
        ${it.copy ? '<span class="copy-hint">已复制</span>' : ''}
      </${tag}>`;
  }).join('');
}

// ===== EVENTS =====
function attachEventListeners() {
  document.getElementById('langToggle').addEventListener('click', () => {
    lang = lang === 'zh' ? 'en' : 'zh';
    updateLanguage();
  });

  // 点手机/微信直接复制
  document.querySelectorAll('[data-copy]').forEach(el => {
    el.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(el.dataset.copy);
        el.classList.add('copied');
        setTimeout(() => el.classList.remove('copied'), 1600);
      } catch (_) {}
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href === '#top') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (href !== '#') {
        const t = document.querySelector(href);
        if (t) {
          e.preventDefault();
          const nav = document.getElementById('nav').offsetHeight;
          window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - nav - 28, behavior: 'smooth' });
        }
      }
    });
  });
}

// ===== LANGUAGE =====
function updateLanguage() {
  const k = lang;
  document.getElementById('langToggle').textContent = lang === 'zh' ? 'EN' : '中';
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';

  // 纯文本节点
  document.querySelectorAll('[data-zh]').forEach(el => {
    const v = el.getAttribute('data-' + k);
    if (v != null) el.textContent = v;
  });
  // 含 <strong> 高亮的节点走 innerHTML
  document.querySelectorAll('[data-html-zh]').forEach(el => {
    const v = el.getAttribute('data-html-' + k);
    if (v != null) el.innerHTML = v;
  });
}

// ===== SCROLL REVEAL =====
function initScrollAnimations() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        setTimeout(() => en.target.classList.add('visible'), +(en.target.dataset.delay || 0));
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => {
    // 首屏元素不靠 IO：加载后直接进场，避免被人像/布局撑高后判定失败
    if (el.closest('.hero')) {
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('visible')));
    } else {
      io.observe(el);
    }
  });
}

// ===== COUNT UP =====
function initCountUp() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const end = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.decimal || 0, 10);
      const pre = el.dataset.prefix || '';
      const suf = el.dataset.suffix || '';
      const t0 = performance.now(), dur = 1400;
      const tick = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        let v = end * eased;
        const fmt = end >= 1000000 ? (p < 1 ? (v / 1000000).toFixed(2) : Math.round(v / 1000000)) + 'M'
                  : end >= 10000   ? Math.round(v / 1000) + 'k'
                  : v.toFixed(dec);
        el.textContent = pre + fmt + suf;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.stat-num').forEach(el => io.observe(el));
}

// ===== NAV =====
function initNavState() {
  const nav = document.getElementById('nav');
  const links = [...document.querySelectorAll('.nav-links a')];
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
    const y = window.scrollY + nav.offsetHeight + 80;
    let cur = null;
    links.forEach(a => {
      const s = document.querySelector(a.getAttribute('href'));
      if (s && s.offsetTop <= y) cur = a;
    });
    links.forEach(a => a.classList.toggle('active', a === cur));
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}


// ===== MARQUEE：双轨。上轨 = 公司 · 年份 · 角色；下轨 = 做过的事 / 能力关键词，反向滚 =====
function renderMarquee() {
  const a = document.getElementById('marqueeInner');
  const b = document.getElementById('marqueeInnerB');
  if (!a) return;

  // 上轨：公司 + 年份 + 角色，按时间倒序（和时间线一致）
  const year = (p) => (p.match(/\d{4}/) || [''])[0];
  const track1 = data.experience.map(e => ({
    zh: `${e.company}`, en: `${e.companyEn || e.company}`,
    metaZh: `${year(e.period)} · ${e.role}`,
    metaEn: `${year(e.period)} · ${e.roleEn || e.role}`,
  }));
  a.innerHTML = [...track1, ...track1].map(n => `
    <span class="marquee-item">
      <span class="marquee-main" data-zh="${esc(n.zh)}" data-en="${esc(n.en)}">${esc(n.zh)}</span>
      <span class="marquee-meta" data-zh="${esc(n.metaZh)}" data-en="${esc(n.metaEn)}">${esc(n.metaZh)}</span>
    </span>`).join('');

  // 下轨：从各段 works + skills 里收关键词，去重后反向滚动
  if (!b) return;
  const seen = new Set();
  const kws = [];
  const push = (zh, en) => { if (zh && !seen.has(zh)) { seen.add(zh); kws.push({ zh, en: en || zh }); } };
  data.experience.forEach(e => (e.works || []).forEach(w => push(w.name, w.nameEn)));
  const sk = data.skills || {};
  ['ai', 'product', 'data'].forEach(k => (sk[k] || []).forEach((s, i) => push(s, (sk[k + 'En'] || [])[i])));
  b.innerHTML = [...kws, ...kws].map(n =>
    `<span class="marquee-item marquee-item-sm" data-zh="${esc(n.zh)}" data-en="${esc(n.en)}">${esc(n.zh)}</span>`
  ).join('');
}

// ===== 顶部阅读进度 =====
function initScrollProgress() {
  const bar = document.querySelector('.scroll-progress');
  if (!bar) return;
  const update = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    bar.style.setProperty('--progress', max > 0 ? (h.scrollTop / max).toFixed(4) : 0);
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

// ===== 鼠标聚光灯（跟随光标的暖光） =====
function initSpotlight() {
  const sp = document.querySelector('.spotlight');
  if (!sp || !window.matchMedia('(hover: hover)').matches) return;
  let raf = null, x = innerWidth / 2, y = innerHeight * 0.3;
  window.addEventListener('mousemove', (e) => {
    x = e.clientX; y = e.clientY;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      sp.style.setProperty('--mx', x + 'px');
      sp.style.setProperty('--my', y + 'px');
      raf = null;
    });
  }, { passive: true });
}

// ===== 项目卡 / Stat：3D 倾斜 + 光标追踪边缘高光 =====
function initCardTilt() {
  if (!window.matchMedia('(hover: hover)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const track = (el, tilt) => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--cx', (px * 100).toFixed(1) + '%');
      el.style.setProperty('--cy', (py * 100).toFixed(1) + '%');
      if (tilt) {
        const rx = ((0.5 - py) * 6).toFixed(2);
        const ry = ((px - 0.5) * 6).toFixed(2);
        el.style.transform = `translateY(-5px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      }
    });
    el.addEventListener('mouseleave', () => {
      if (tilt) {
        el.style.transition = 'transform 0.5s var(--ease), border-color 0.34s var(--ease), box-shadow 0.34s var(--ease)';
        el.style.transform = '';
        setTimeout(() => { el.style.transition = ''; }, 500);
      }
    });
  };
  document.querySelectorAll('.project-card:not(.placeholder)').forEach(c => track(c, true));
  document.querySelectorAll('.stat').forEach(s => track(s, false));
}


// ===== 首屏 mesh：随滚动淡出、上移，让首屏「沉」进正文 =====
function initHeroFade() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  let raf = null;
  const update = () => {
    const h = hero.offsetHeight || innerHeight;
    const f = Math.min(Math.max(scrollY / (h * 0.7), 0), 1);
    hero.style.setProperty('--hero-fade', f.toFixed(3));
    raf = null;
  };
  window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  update();
}

// ===== 配色切换：data-palette + localStorage =====
function initPalette() {
  const box = document.getElementById('paletteSwitch');
  if (!box) return;
  const root = document.documentElement;
  const btns = [...box.querySelectorAll('.ps-btn')];
  const current = () => root.getAttribute('data-palette') || 'frost';
  const mark = () => btns.forEach(b => b.classList.toggle('active', b.dataset.palette === current()));
  const apply = (name) => {
    root.classList.add('theme-switching');
    // 默认主题是 frost，直接写属性，不再用「移除属性」表示默认
    root.setAttribute('data-palette', name);
    try { localStorage.setItem('palette', name); } catch (_) {}
    mark();
    setTimeout(() => root.classList.remove('theme-switching'), 600);
  };
  btns.forEach(b => b.addEventListener('click', () => apply(b.dataset.palette)));
  // 支持 ?palette=indigo 直接预览
  const q = new URLSearchParams(location.search).get('palette');
  if (q && btns.some(b => b.dataset.palette === q)) apply(q); else mark();
}

// ===== 磁吸按钮（Dennis Snellenberg 式）：鼠标靠近时向鼠标偏移，离开弹回 =====
function initMagnetic() {
  if (window.matchMedia('(hover: none)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const targets = document.querySelectorAll('.hero-cta .btn, #contactGrid .contact-item');
  targets.forEach(el => {
    el.setAttribute('data-magnetic', '');
    const strength = el.classList.contains('btn') ? 0.35 : 0.22;
    let raf = 0;
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * strength;
      const y = (e.clientY - r.top - r.height / 2) * strength;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`; });
    });
    el.addEventListener('mouseleave', () => {
      cancelAnimationFrame(raf);
      el.style.transform = '';
    });
  });
}


// ===== 关于 AI：四条判断 =====
function renderAiViews() {
  const grid = document.getElementById('aiViewsGrid');
  const v = data.aiViews;
  if (!grid || !v || !v.items) return;
  grid.innerHTML = v.items.map((it, i) => `
    <article class="ai-view reveal" data-delay="${i * 90}">
      <div class="ai-view-num">${esc(it.n)}</div>
      <h3 class="ai-view-title" data-zh="${esc(it.zh)}" data-en="${esc(it.en)}">${esc(it.zh)}</h3>
      <p class="ai-view-desc" data-zh="${esc(it.dz)}" data-en="${esc(it.de)}">${esc(it.dz)}</p>
    </article>
  `).join('');
}
