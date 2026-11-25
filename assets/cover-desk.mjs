import {readProof, renderProof, ticketHTML} from './cover-proof.mjs';
import {download, isEnglish} from '../studio/ui.mjs';

export function mountCoverDesk(desk) {
  const files = [...desk.querySelectorAll('.paper-file')];
  const proof = desk.querySelector('[data-cover-proof]');
  const actions = [];
  const samples = new Map();
  const close = file => {
    file.open = false;
    const summary = file.querySelector('summary');
    summary.focus({preventScroll: true});
    requestAnimationFrame(() => summary.scrollIntoView({block:'nearest', behavior:'instant'}));
  };
  files.forEach(file => file.addEventListener('toggle', () => {
    if (!file.open) return;
    const sample=file.querySelector('[data-sample]');
    if(sample && !samples.has(sample)){
      samples.set(sample,null);
      import('./desk-interactions.mjs').then(({mountSample})=>samples.set(sample,mountSample(sample))).catch(()=>samples.delete(sample));
    }
    files.filter(other => other !== file && other.open).forEach(other => {other.open = false;});
    const panel = file.querySelector('.paper-insert');
    if (panel.getBoundingClientRect().top > innerHeight - Math.min(310, innerHeight * .46)) {
      const reduce = document.documentElement.dataset.motion === 'reduce' || matchMedia('(prefers-reduced-motion: reduce)').matches;
      panel.scrollIntoView({block:'start', behavior:reduce ? 'instant' : 'smooth'});
    }
  }));
  desk.addEventListener('keydown', event => {
    const file = event.target.closest('.paper-file');
    if (event.key === 'Escape' && file?.open) {
      event.preventDefault();
      close(file);
    }
  });
  desk.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.classList.contains('paper-close')) return close(button.closest('.paper-file'));
    const action = button.dataset.proofAction;
    if (!action) return;
    const english = isEnglish();
    const current = readProof(actions, english);
    if (action === 'ticket') {
      const link = new URL('/studio/script/', 'https://andyzhang666666.github.io');
      if (english) link.searchParams.set('lang', 'en');
      download(english ? 'scene-revision-ticket.html' : '改一场戏-修订票根.html', ticketHTML(actions, english, link.href), 'text/html;charset=utf-8');
      return;
    }
    if (action === 'undo') actions.pop();
    else if (action === 'delay' && current.story.reveal === 3) actions.push(action);
    else if (current.marked.some(line => line.key === action && line.conflict)) actions.push(action);
    else return;
    render();
    proof.querySelector('.proof-status').focus({preventScroll: true});
  });
  function render() { proof.innerHTML = renderProof(actions, isEnglish()); }
  // App language changes also localize an open proof without losing its edits.
  new MutationObserver(()=>{render();for(const translate of samples.values())translate?.();}).observe(document.documentElement, {attributes:true, attributeFilter:['lang']});
  desk.dataset.ready = 'true';
  render();
}
