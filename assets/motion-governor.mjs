// One owner per effect. Native anchors own scrolling/history; this module owns
// motion preference, bounded pointer feedback, Hero fading and visibility gates.
const root = document.documentElement;
const preferenceKey = 'portfolio-motion-preference';
const system = matchMedia('(prefers-reduced-motion: reduce)');
const fine = matchMedia('(hover: hover) and (pointer: fine)');
let preference = 'system';
try { if (localStorage.getItem(preferenceKey) === 'reduce') preference = 'reduce'; } catch (_) {}

export function getMotionPreference() { return preference; }
export function isMotionReduced() { return preference === 'reduce' || system.matches; }
export function setMotionPreference(value) {
  preference = value === 'reduce' ? 'reduce' : 'system';
  try { localStorage.setItem(preferenceKey, preference); } catch (_) {}
  syncPreference();
}

const decorations = new Map();
const magnets = new Map();
const tilts = new Map();
const counters = new Map();
const resets = new Set();
let mounted = false, pendingSync = false, scrollFrame = 0, layoutFrame = 0;
let sections = [], links = [], titleMarks = [], nav, navHeight = 88, pageHeight = 1;
let hero, heroVisible = false, heroTop = 0, heroHeight = 1;
let paperFrame = 0, paperX = 0, paperY = 0, paperTargetX = 0, paperTargetY = 0, heroRect;
let spotFrame = 0, spotX = 0, spotY = 0;
const canMove = () => !document.hidden && !isMotionReduced();
const clamp = (v, max = 1) => Math.max(-max, Math.min(max, v));
const decorationSelector = '.hero-mesh, .hero-grid, .hero-v2, .sec-bg, .project-atmosphere, .marquee-track, .hero-name-zh, .sa-atmosphere, .research-figure';

function syncPreference() {
  root.dataset.motion = isMotionReduced() ? 'reduce' : 'full';
  root.dataset.pageVisible = String(!document.hidden);
  for (const [element, state] of decorations) {
    const active = state.visible && canMove();
    element.dataset.motionActive = String(active);
    if (element.matches('.project-atmosphere')) element.classList.toggle('in-view', active);
  }
  if (!canMove()) {
    if (document.hidden) {
      cancelAnimationFrame(scrollFrame); scrollFrame = 0;
      cancelAnimationFrame(layoutFrame); layoutFrame = 0;
    }
    resets.forEach(reset => reset());
    counters.forEach(state => state.finish());
    if (isMotionReduced()) {
      document.querySelectorAll('.reveal').forEach(element => element.classList.add('visible'));
      // WAAPI feedback is finite, but reduce takes effect immediately mid-press.
      document.getAnimations?.().forEach(animation => animation.cancel());
    }
  } else {
    scheduleLayout();
  }
  document.dispatchEvent(new CustomEvent('portfolio:motionchange', {
    detail: {preference, reduced: isMotionReduced(), visible: !document.hidden}
  }));
}

const decorativeObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  for (const entry of entries) {
    const state = decorations.get(entry.target);
    if (!state) continue;
    state.visible = entry.isIntersecting;
    const active = state.visible && canMove();
    entry.target.dataset.motionActive = String(active);
    if (entry.target.matches('.project-atmosphere')) entry.target.classList.toggle('in-view', active);
  }
}, {threshold: 0}) : null;

function syncDecorations() {
  for (const [element] of decorations) {
    if (element.isConnected) continue;
    decorativeObserver?.unobserve(element);
    decorations.delete(element);
  }
  document.querySelectorAll(decorationSelector).forEach(element => {
    if (decorations.has(element)) return;
    decorations.set(element, {visible: !decorativeObserver});
    element.dataset.motionRegion = '';
    element.dataset.motionActive = String(!decorativeObserver && canMove());
    decorativeObserver?.observe(element);
  });
}

// This is the only magnetic/press owner for the main CTAs and contact actions.
function syncMagnets() {
  document.querySelectorAll('.hero-cta .btn, .btn-primary, #contactGrid .contact-item').forEach(element => {
    if (magnets.has(element)) return;
    element.dataset.motionMagnetic = '';
    let frame = 0, bounds, x = 0, y = 0;
    const paint = () => {
      frame = 0;
      if (!canMove() || !fine.matches || !element.isConnected) return;
      element.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    };
    const reset = () => {
      cancelAnimationFrame(frame); frame = 0; bounds = null;
      element.classList.remove('is-motion-tracking', 'is-motion-pressed');
      element.style.removeProperty('transform');
    };
    magnets.set(element, {reset, invalidate: () => { bounds = null; }});
    resets.add(reset);
    element.addEventListener('pointerenter', () => { if (canMove() && fine.matches) bounds = element.getBoundingClientRect(); }, {passive:true});
    element.addEventListener('pointermove', event => {
      if (!canMove() || !fine.matches || event.pointerType !== 'mouse') return;
      bounds ||= element.getBoundingClientRect();
      const strength = element.classList.contains('btn') ? .28 : .16;
      const max = element.classList.contains('btn') ? 7 : 5;
      x = clamp((event.clientX - bounds.left - bounds.width / 2) * strength, max);
      y = clamp((event.clientY - bounds.top - bounds.height / 2) * strength, max);
      element.classList.add('is-motion-tracking');
      if (!frame) frame = requestAnimationFrame(paint);
    }, {passive:true});
    element.addEventListener('pointerleave', reset, {passive:true});
    element.addEventListener('pointercancel', reset, {passive:true});
    element.addEventListener('blur', reset);
    element.addEventListener('pointerdown', event => {
      if (canMove() && event.button === 0) element.classList.add('is-motion-pressed');
    }, {passive:true});
    element.addEventListener('keydown', event => {
      if (canMove() && !event.repeat && ['Enter', ' '].includes(event.key)) element.classList.add('is-motion-pressed');
    });
    element.addEventListener('keyup', () => element.classList.remove('is-motion-pressed'));
  });
  for (const [element, state] of magnets) if (!element.isConnected) {
    state.reset(); resets.delete(state.reset); magnets.delete(element);
  }
}
window.addEventListener('pointerup', () => magnets.forEach((_, element) => element.classList.remove('is-motion-pressed')), {passive:true});

function syncTilts() {
  document.querySelectorAll('.project-card:not(.placeholder), .stat').forEach(element => {
    if (tilts.has(element)) return;
    const tilt = element.matches('.project-card');
    let bounds, frame = 0, px = .5, py = .5;
    const reset = () => {
      cancelAnimationFrame(frame); frame = 0; bounds = null;
      element.style.removeProperty('transform');
      element.style.removeProperty('--cx'); element.style.removeProperty('--cy');
    };
    tilts.set(element, {reset, invalidate: () => { bounds = null; }}); resets.add(reset);
    element.addEventListener('pointerenter', () => { if (canMove() && fine.matches) bounds = element.getBoundingClientRect(); }, {passive:true});
    element.addEventListener('pointermove', event => {
      if (!canMove() || !fine.matches || event.pointerType !== 'mouse') return;
      bounds ||= element.getBoundingClientRect();
      px = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
      py = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0; if (!canMove() || !fine.matches) return;
        element.style.setProperty('--cx', `${(px * 100).toFixed(1)}%`);
        element.style.setProperty('--cy', `${(py * 100).toFixed(1)}%`);
        if (tilt) element.style.transform = `translateY(-5px) rotateX(${((.5 - py) * 6).toFixed(2)}deg) rotateY(${((px - .5) * 6).toFixed(2)}deg)`;
      });
    }, {passive:true});
    element.addEventListener('pointerleave', reset, {passive:true});
    element.addEventListener('pointercancel', reset, {passive:true});
  });
  for (const [element, state] of tilts) if (!element.isConnected) {
    state.reset(); resets.delete(state.reset); tilts.delete(element);
  }
}

function resetHero() {
  cancelAnimationFrame(paperFrame); paperFrame = 0;
  paperX = paperY = paperTargetX = paperTargetY = 0; heroRect = null;
  hero?.querySelectorAll('[data-hero-paper]').forEach(element => element.style.removeProperty('transform'));
  hero?.classList.remove('has-hero-pointer');
  if (isMotionReduced()) hero?.style.setProperty('--hero-fade', '0');
}
resets.add(resetHero);
function paintPaper() {
  paperFrame = 0;
  if (!heroVisible || !canMove() || !fine.matches) return;
  paperX += (paperTargetX - paperX) * .17;
  paperY += (paperTargetY - paperY) * .17;
  const settling = Math.abs(paperTargetX - paperX) + Math.abs(paperTargetY - paperY) > .003;
  if (!settling) { paperX = paperTargetX; paperY = paperTargetY; }
  hero.classList.add('has-hero-pointer');
  hero.querySelectorAll('[data-hero-paper]').forEach(element => {
    const depth = element.dataset.heroPaper === 'front' ? 4 : 8;
    element.style.transform = `translate3d(${(paperX * depth).toFixed(2)}px, ${(paperY * depth).toFixed(2)}px, 0) rotate(${(paperX * .6).toFixed(3)}deg)`;
  });
  if (settling) paperFrame = requestAnimationFrame(paintPaper);
  else if (!paperX && !paperY) hero.classList.remove('has-hero-pointer');
}
function schedulePaper() { if (!paperFrame && heroVisible && canMove() && fine.matches) paperFrame = requestAnimationFrame(paintPaper); }
function initHero() {
  hero = document.querySelector('.hero');
  if (!hero) return;
  const visibility = new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    if (heroVisible) scheduleLayout(); else resetHero();
  }, {threshold:0});
  visibility.observe(hero);
  const portrait = hero.querySelector('.hero-portrait');
  portrait?.addEventListener('pointerenter', () => { if (canMove() && fine.matches) heroRect = portrait.getBoundingClientRect(); }, {passive:true});
  portrait?.addEventListener('pointermove', event => {
    if (!heroVisible || !canMove() || !fine.matches || event.pointerType !== 'mouse') return;
    heroRect ||= portrait.getBoundingClientRect();
    paperTargetX = clamp((event.clientX - heroRect.left) / heroRect.width * 2 - 1);
    paperTargetY = clamp((event.clientY - heroRect.top) / heroRect.height * 2 - 1);
    schedulePaper();
  }, {passive:true});
  portrait?.addEventListener('pointerleave', () => { heroRect = null; paperTargetX = paperTargetY = 0; schedulePaper(); }, {passive:true});
}

function initSpotlight() {
  const spotlight = document.querySelector('.spotlight');
  if (!spotlight) return;
  const reset = () => {
    cancelAnimationFrame(spotFrame); spotFrame = 0;
    spotlight.style.removeProperty('--mx'); spotlight.style.removeProperty('--my');
  };
  resets.add(reset);
  window.addEventListener('pointermove', event => {
    if (!canMove() || !fine.matches || event.pointerType !== 'mouse') return;
    spotX = event.clientX; spotY = event.clientY;
    if (!spotFrame) spotFrame = requestAnimationFrame(() => {
      spotFrame = 0; if (!canMove() || !fine.matches) return;
      spotlight.style.setProperty('--mx', `${spotX}px`); spotlight.style.setProperty('--my', `${spotY}px`);
    });
  }, {passive:true});
}

let activeSection;
function updateScroll() {
  scrollFrame = 0;
  if (document.hidden) return;
  const y = window.scrollY;
  nav?.classList.toggle('scrolled', y > 40);
  let current = sections[0]?.id;
  for (const section of sections) if (section.top <= y + navHeight + 80) current = section.id;
  links.forEach(link => {
    const selected = link.hash === `#${current}`;
    link.classList.toggle('active', selected);
    if (selected) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
  });
  if (current !== activeSection) {
    activeSection = current;
    document.dispatchEvent(new CustomEvent('portfolio:sectionchange', {detail:{id:current}}));
  }
  if (canMove()) for (const mark of titleMarks) {
    const top = mark.top - y;
    if (top + mark.height < -100 || top > innerHeight + 100) continue;
    mark.number.style.transform = `translateY(${(((top + mark.height / 2 - innerHeight / 2) / innerHeight) * -10).toFixed(1)}px)`;
  }
  const progress = document.querySelector('.scroll-progress');
  progress?.style.setProperty('--progress', Math.max(0, Math.min(1, y / pageHeight)).toFixed(4));
  // Hero geometry is cached only on resize/layout changes, never per scroll.
  if (heroVisible && canMove()) hero.style.setProperty('--hero-fade', Math.max(0, Math.min(1, (y - heroTop) / (heroHeight * .7))).toFixed(3));
}
function scheduleScroll() { if (!scrollFrame && !document.hidden) scrollFrame = requestAnimationFrame(updateScroll); }
function measureLayout() {
  layoutFrame = 0;
  if (document.hidden) return;
  // All geometry reads are grouped before any style/class writes.
  const y = window.scrollY;
  const nextNavHeight = nav?.getBoundingClientRect().height || 88;
  const nextSections = [...document.querySelectorAll('main section[id]')].map(section => ({id:section.id, top:section.getBoundingClientRect().top + y}));
  const nextPageHeight = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const nextMarks = [...document.querySelectorAll('.section-head')].map(element => {
    const number = element.querySelector('.section-num');
    if (!number) return null;
    const bounds = element.getBoundingClientRect();
    return {number, top:bounds.top + y, height:bounds.height};
  }).filter(Boolean);
  const heroBounds = heroVisible && canMove() ? hero?.getBoundingClientRect() : null;
  navHeight = nextNavHeight; sections = nextSections; pageHeight = nextPageHeight; titleMarks = nextMarks;
  if (heroBounds) { heroTop = heroBounds.top + y; heroHeight = heroBounds.height || 1; }
  root.style.setProperty('--portfolio-nav-height', `${navHeight}px`);
  links = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  magnets.forEach(state => state.invalidate()); tilts.forEach(state => state.invalidate()); heroRect = null;
  scheduleScroll();
}
function scheduleLayout() { if (!layoutFrame && !document.hidden) layoutFrame = requestAnimationFrame(measureLayout); }
resets.add(() => titleMarks.forEach(mark => mark.number.style.removeProperty('transform')));

function syncCounters() {
  document.querySelectorAll('.stat-num[data-count]').forEach(element => {
    if (counters.has(element)) return;
    const end = Number(element.dataset.count), dec = Number(element.dataset.decimal || 0);
    const prefix = element.dataset.prefix || '', suffix = element.dataset.suffix || '';
    if (!Number.isFinite(end)) return;
    let frame = 0, done = false, observer;
    const format = (v, final = false) => prefix + (end >= 1000000 ? (final ? Math.round(v / 1000000) : (v / 1000000).toFixed(2)) + 'M' : end >= 10000 ? Math.round(v / 1000) + 'k' : v.toFixed(dec)) + suffix;
    const finish = () => { cancelAnimationFrame(frame); frame = 0; done = true; observer?.disconnect(); element.textContent = format(end, true); };
    counters.set(element, {finish});
    observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || done) return;
      observer.disconnect();
      if (!canMove()) { finish(); return; }
      const start = performance.now();
      const tick = now => {
        frame = 0;
        if (!canMove()) { finish(); return; }
        const p = Math.min(1, (now - start) / 1400);
        element.textContent = format(end * (1 - Math.pow(1 - p, 3)), p === 1);
        if (p < 1) frame = requestAnimationFrame(tick); else done = true;
      };
      frame = requestAnimationFrame(tick);
    }, {threshold:.5});
    observer.observe(element);
    if (isMotionReduced()) { observer.disconnect(); finish(); }
  });
  for (const [element, state] of counters) if (!element.isConnected) { state.finish(); counters.delete(element); }
}

function sync() {
  pendingSync = false;
  syncDecorations(); syncMagnets(); syncTilts(); syncCounters(); scheduleLayout();
}
function scheduleSync() { if (!pendingSync) { pendingSync = true; queueMicrotask(sync); } }
function mount() {
  if (mounted) return; mounted = true;
  nav = document.getElementById('nav');
  initHero(); initSpotlight(); sync();
  const resize = new ResizeObserver(scheduleLayout);
  resize.observe(document.body); if (nav) resize.observe(nav);
  const mutations = new MutationObserver(records => {
    if (records.some(record => [...record.addedNodes].some(node => node.nodeType === 1) || [...record.removedNodes].some(node => node.nodeType === 1))) scheduleSync();
  });
  mutations.observe(document.body, {childList:true, subtree:true});
  window.addEventListener('scroll', () => {
    magnets.forEach(state => state.invalidate()); tilts.forEach(state => state.invalidate()); heroRect = null;
    scheduleScroll();
  }, {passive:true});
  window.addEventListener('resize', scheduleLayout, {passive:true});
  document.addEventListener('portfolio:ready', scheduleSync);
  document.addEventListener('toggle', scheduleLayout, true);
  document.fonts?.ready.then(scheduleLayout);
  syncPreference();
}
system.addEventListener('change', syncPreference);
fine.addEventListener('change', () => { resets.forEach(reset => reset()); });
document.addEventListener('visibilitychange', syncPreference);
window.addEventListener('pageshow', () => { syncPreference(); scheduleLayout(); });
root.dataset.motion = isMotionReduced() ? 'reduce' : 'full';
root.dataset.pageVisible = String(!document.hidden);
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once:true}); else mount();
