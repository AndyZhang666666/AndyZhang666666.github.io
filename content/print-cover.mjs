import {objects, studioURL} from './studio-objects.mjs';
import {escapeHtml as esc} from '../assets/project-cards.mjs';
import {renderProof} from '../assets/cover-proof.mjs';
import {menuSheet,billSheet} from '../assets/desk-samples.mjs';

const label = (zh, en) => '<span data-zh="' + esc(zh) + '" data-en="' + esc(en) + '">' + esc(zh) + '</span>';
const actions = {
  script: ['改一场戏', 'Edit a scene'],
  menu: ['试一个菜名', 'Find a dish'],
  credits: ['核一笔账', 'Check a bill']
};

export function renderWorkdesk() {
  return '<div class="workdesk" aria-label="作品桌 / Work desk">' + objects.map(object => {
    const id = 'cover-paper-' + object.folder;
    const body = object.folder === 'script'
      ? '<div class="cover-proof" data-cover-proof>' + renderProof() + '</div>'
      : '<div class="desk-sample" data-sample="' + object.folder + '">' + (object.folder==='menu'?menuSheet():billSheet()) + '</div>';
    return '<details class="paper-file paper-' + object.folder + '" name="workdesk-paper"><summary aria-controls="' + id + '">' +
      '<span class="paper-heading">' + label(...object.paper) + '</span><strong>' + label(...actions[object.folder]) + '</strong><i class="paper-print" aria-hidden="true"></i>' +
      '<span class="paper-open" aria-hidden="true">↗</span></summary><div class="paper-insert" id="' + id + '">' +
      '<header class="paper-head"><h2>' + label(...object.question) + '</h2><button type="button" class="paper-close" aria-label="收起 / Close">×</button></header>' +
      body +
      '<div class="paper-links"><a href="' + studioURL(object) + '">' + label('打开完整工具','Open full tool') + ' ↗</a><a href="#evidence-' + object.evidence + '">' + label('看工作案例','See work evidence') +
      ' →</a><a href="/assets/cv/' + object.cv + '.pdf" target="_blank" rel="noopener">' + label(...object.cvName) + ' PDF ↗</a></div></div></details>';
  }).join('') + '</div>';
}

export function printCover(html) {
  return html.replace(/(<section id="top" class="hero hero-v2)(?: print-cover)?(")/, '$1 print-cover$2')
    .replace(/<span class="hero-name-zh">[\s\S]*?<\/span>(?=\s*<span class="hero-name-en")/,
      '<span class="hero-name-zh" aria-label="张千羽"><b>张</b><b>千</b><b>羽</b></span>')
    .replace('<span class="hero-name-en">Andy Zhang</span>', '<span class="hero-name-en"><i>Andy Zhang</i></span>')
    .replace(/<img class="portrait-img portrait-img-dark"[^>]+>\s*/, '')
    .replace(/<img class="portrait-img portrait-img-light"[^>]+>/,
      '<img class="portrait-img portrait-img-light" src="assets/gen/portrait-light.png" alt="" width="394" height="687" loading="eager" fetchpriority="high" decoding="async">')
    .replace(/(href="assets\/hero-paper\.css)\?v=[^"]+/, '$1?v=print1');
}
