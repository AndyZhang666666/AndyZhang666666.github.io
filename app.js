// Motion V2: runtime owners live in motion-governor.mjs.
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
    const res = await fetch('data.json?v=cv1');
    if (!res.ok) throw new Error('Profile data could not be loaded');
    data = await res.json();
    render();
    attachEventListeners();
    initScrollAnimations();
    initPalette();
    document.dispatchEvent(new Event('portfolio:ready'));
  } catch (err) {
    console.error('Failed to load data:', err);
  }
});

function render() {
  if (!data) return;
  renderProfileIntro();
  renderAbout();
  renderAiViews();
  renderMarquee();
  renderEducation();
  renderProjects();
  renderAwards();
  renderContact();
  updateLanguage();
}

function renderProfileIntro() {
  const qualifications = document.querySelectorAll('.hero-meta > span:not(.dot)');
  (data.education || []).forEach((edu, i) => {
    const node = qualifications[i];
    if (!node) return;
    const schoolZh = edu.schoolEn === 'University College London' ? 'UCL' : edu.school.replace(/\s*\(.*\)/, '');
    const schoolEn = edu.schoolEn === 'University College London' ? 'UCL' : edu.schoolEn;
    node.dataset.zh = `${schoolZh} ${edu.degree.replace(' · ', ' ')} · ${edu.grade}`;
    node.dataset.en = `${edu.degreeEn}, ${schoolEn} · ${edu.grade}`;
    node.textContent = node.dataset.zh;
  });
}

// ===== RAILROAD TIMELINE（每段可点开，展开该段做过的东西） =====

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
  // Static cards are also present without JavaScript. URLs are bound by project ID.
  if (typeof window.refreshProjectLibrary === 'function') window.refreshProjectLibrary(data.projects);
}

function renderAwards() { document.getElementById('awardList').innerHTML = window.personalPresentation.renderHonours(data.awards); }


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
  
  // Keep the static, evidence-linked principles and their material interactions.
  if (typeof window.refreshProductPrinciples === 'function') window.refreshProductPrinciples(a.principles || []);
}

// ===== USES =====

function renderContact() { document.getElementById('contactGrid').innerHTML = window.personalPresentation.renderContacts(data.contact); }

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
        el.querySelector('.copy-hint').textContent = lang === 'en' ? 'Copied' : '已复制';
        el.classList.add('copied');
        setTimeout(() => { el.classList.remove('copied'); el.querySelector('.copy-hint').textContent = ''; }, 1600);
      } catch (_) {
        el.querySelector('.copy-hint').textContent = lang === 'en' ? 'Select text to copy' : '请选中文字复制';
        el.classList.add('copied');
        setTimeout(() => { el.classList.remove('copied'); el.querySelector('.copy-hint').textContent = ''; }, 2400);
      }
    });
  });

  // Native hash anchors own navigation, URL changes and browser history.

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
// initCountUp: owned by assets/motion-governor.mjs.

// ===== NAV =====
// initNavState: owned by assets/motion-governor.mjs.


// ===== MARQUEE：双轨。上轨 = 公司 · 年份 · 角色；下轨 = 做过的事 / 能力关键词，反向滚 =====
function renderMarquee() {
  const a = document.getElementById('marqueeInner');
  const b = document.getElementById('marqueeInnerB');
  if (!a) return;

  // 上轨：公司 + 年份 + 角色，按时间倒序（和时间线一致）
  const year = (p) => (p.match(/\d{4}/) || [''])[0];
  const track1 = data.experience.map(e => ({
    zh: `${e.company}`, en: `${e.companyEn || e.company}`,
    metaZh: `${[year(e.period),e.role].filter(Boolean).join(' · ')}`,
    metaEn: `${[year(e.period),e.roleEn || e.role].filter(Boolean).join(' · ')}`,
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
// initScrollProgress: owned by assets/motion-governor.mjs.

// ===== 鼠标聚光灯（跟随光标的暖光） =====
// initSpotlight: owned by assets/motion-governor.mjs.

// ===== 项目卡 / Stat：3D 倾斜 + 光标追踪边缘高光 =====
// initCardTilt: owned by assets/motion-governor.mjs.


// ===== 首屏 mesh：随滚动淡出、上移，让首屏「沉」进正文 =====
// initHeroFade: owned by assets/motion-governor.mjs.

// ===== 配色切换：data-palette + localStorage =====
function initPalette() {
  const box = document.getElementById('paletteSwitch');
  if (!box) return;
  const root = document.documentElement;
  const btns = [...box.querySelectorAll('.ps-btn')];
  const current = () => root.getAttribute('data-palette') || 'frost';
  const mark = () => btns.forEach(b => { b.classList.toggle('active', b.dataset.palette === current()); b.setAttribute('aria-pressed', String(b.dataset.palette === current())); });
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
// initMagnetic: owned by assets/motion-governor.mjs.


// ===== 关于 AI：四条判断 =====
function renderAiViews() {
  // Keep the statically rendered opinions, own examples and reference links.
  if (typeof window.refreshAiViews === 'function') window.refreshAiViews(data.aiViews?.items || []);
}
