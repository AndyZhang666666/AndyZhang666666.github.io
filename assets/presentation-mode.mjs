import {presentationCases,withPresentationQuery,withoutPresentationQuery} from '../content/presentation-mode.mjs';

const html = document.documentElement;
const root = document.getElementById('selected');
const launcher = document.getElementById('presentationToggle');
const bar = document.getElementById('presentationBar');
const exit = bar?.querySelector('[data-presentation-exit]');
const highlight = bar?.querySelector('[data-presentation-highlight]');
const announcement = document.querySelector('[data-presentation-announcement]');
const tabs = () => [...(root?.querySelectorAll('[data-selected-id]') || [])];
const activeTab = () => tabs().find(tab => tab.getAttribute('aria-selected') === 'true');
const isEnglish = () => html.lang.startsWith('en');
let previous = null;
let restoreFrame = 0;
let exiting = false;
let ownHistoryEntry = false;
let entryHash = '';
const ownedURLs = new Set();

function announce(zh,en) { announcement.textContent = isEnglish() ? en : zh; }
function syncHighlight() {
  const active = activeTab();
  if (!active) return;
  const name = active.querySelector('strong');
  bar.querySelector('[data-presentation-title]').textContent = name.dataset[isEnglish() ? 'en' : 'zh'] || name.textContent;
  highlight.href = presentationCases[active.dataset.selectedId] || active.href;
  highlight.setAttribute('aria-label',isEnglish() ? `Design highlight: ${name.dataset.en} (new tab)` : `${name.dataset.zh}：设计高光（新标签页）`);
  bar.setAttribute('aria-label',isEnglish() ? 'Presentation controls' : '投屏控制');
}

function enter({writeHistory = true} = {}) {
  if (previous) return;
  cancelAnimationFrame(restoreFrame);
  const focused = document.activeElement;
  previous = {
    x: window.scrollX,
    y: window.scrollY,
    selected: activeTab()?.dataset.selectedId,
    focus: focused instanceof HTMLElement && focused !== document.body ? focused : launcher,
    href: withoutPresentationQuery(location.href),
  };
  if (writeHistory) {
    // History only holds the view URL. Preserve other features' history state verbatim.
    const href = withPresentationQuery(location.href);
    history.pushState(history.state,'',href);
    ownedURLs.add(href);
  }
  ownHistoryEntry = ownedURLs.has(location.href);
  entryHash = location.hash;
  exiting = false;
  exit.disabled = false;
  bar.hidden = false;
  html.dataset.presentation = 'true';
  launcher.setAttribute('aria-pressed','true');
  syncHighlight();
  // Keep the real tab/panel nodes and all of their existing event handlers.
  window.scrollTo({top:0,left:0,behavior:'instant'});
  window.dispatchEvent(new Event('resize'));
  activeTab()?.focus({preventScroll:true});
  announce('已进入投屏模式。四项作品仍可操作；按 Escape 或退出投屏，回到原位置。','Presentation is on. All four previews remain interactive. Press Escape or Exit presentation to return.');
}

function finishLeave({restorePosition = true} = {}) {
  if (!previous) return;
  const saved = previous;
  previous = null;
  exiting = false;
  ownHistoryEntry = false;
  exit.disabled = false;
  delete html.dataset.presentation;
  bar.hidden = true;
  launcher.setAttribute('aria-pressed','false');
  const old = tabs().find(tab => tab.dataset.selectedId === saved.selected);
  if (old && old !== activeTab()) old.click();
  window.dispatchEvent(new Event('resize'));
  const destination = location.hash && document.getElementById(location.hash.slice(1));
  const target = restorePosition ? (saved.focus.isConnected ? saved.focus : launcher) : launcher;
  target.focus({preventScroll:true});
  const restore = () => {
    if (restorePosition) window.scrollTo({top:saved.y,left:saved.x,behavior:'instant'});
    else if (destination) destination.scrollIntoView({block:'start',behavior:'instant'});
  };
  restore();
  // Layout and the existing glass indicator settle together; repeated entry cancels this.
  restoreFrame = requestAnimationFrame(() => {
    if (!previous) {
      // Native history traversal can restore its own focus after popstate.
      (target.isConnected ? target : launcher).focus({preventScroll:true});
      restore();
    }
  });
  announce('已退出投屏，恢复进入前的位置与作品。','Presentation is off. Your previous position and selected work are restored.');
}

function leave() {
  if (!previous || exiting) return;
  if (ownHistoryEntry) {
    exiting = true;
    exit.disabled = true;
    history.back();
  } else {
    // A directly opened mode URL must not send the visitor to an unrelated previous page.
    history.replaceState(history.state,'',withoutPresentationQuery(location.href));
    finishLeave();
  }
}

if (root && launcher && bar && exit && highlight) {
  launcher.hidden = false;
  launcher.addEventListener('click',() => enter());
  exit.addEventListener('click',leave);
  document.addEventListener('keydown',event => {
    if (!previous || event.key !== 'Escape' || event.defaultPrevented || event.isComposing || document.querySelector('dialog[open]')) return;
    event.preventDefault();
    leave();
  });
  new MutationObserver(syncHighlight).observe(root.querySelector('.showcase-choices'),{subtree:true,attributes:true,attributeFilter:['aria-selected']});
  new MutationObserver(syncHighlight).observe(html,{attributes:true,attributeFilter:['lang']});
  window.addEventListener('popstate',() => {
    const requested = new URL(location.href).searchParams.get('present') === '1';
    if (requested && !previous) enter({writeHistory:false});
    else if (!requested && previous) finishLeave({restorePosition:withoutPresentationQuery(location.href) === previous.href});
  });
  window.addEventListener('hashchange',() => {
    if (!previous || location.hash === entryHash) return;
    history.replaceState(history.state,'',withoutPresentationQuery(location.href));
    finishLeave({restorePosition:false});
  });
  if (new URL(location.href).searchParams.get('present') === '1') enter({writeHistory:false});
}
