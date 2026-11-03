// A view of the existing four previews, not a second set of product state.
export const presentationCases = Object.freeze({
  trust: '/cases/trust/#mechanism',
  taste: '/cases/taste/#mechanism',
  bundles: '/cases/bundles/#mechanism',
  commute: '/cases/commute/#mechanism',
});

const icon = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 4h16v11H4zM2 4h20M12 15v5m-4 1 4-3 4 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const words = (zh,en) => `<span data-zh="${zh}" data-en="${en}">${zh}</span>`;

export function enhancePresentationHTML(html) {
  if (html.includes('id="presentationToggle"')) return html;
  const languageButton = '<button id="langToggle" class="lang-toggle" aria-label="切换语言">EN</button>';
  if (!html.includes(languageButton) || !html.includes('id="selected"')) throw new Error('Presentation requires the original navigation and selected-work section.');
  const launcher = `<div class="presentation-nav-actions"><button id="presentationToggle" class="presentation-toggle" type="button" aria-pressed="false" aria-controls="selected" hidden>${icon}${words('90秒投屏','90s presentation')}</button>${languageButton}</div>`;
  const toolbar = `<div class="presentation-bar" id="presentationBar" role="region" aria-label="投屏控制" hidden><h1 class="presentation-current">${words('90秒投屏','90s presentation')}<strong data-presentation-title>Eval Lab</strong></h1><div class="presentation-actions"><a class="presentation-highlight" data-presentation-highlight href="${presentationCases.trust}" target="_blank" rel="noopener">${words('设计高光','Design highlight')}<span aria-hidden="true">↗</span></a><button class="presentation-exit" data-presentation-exit type="button">${words('退出投屏','Exit presentation')}<span class="presentation-exit-short" data-zh="退出" data-en="Exit">退出</span><kbd aria-hidden="true">Esc</kbd></button></div></div><p class="showcase-sr" data-presentation-announcement role="status" aria-live="polite"></p>`;
  return html.replace(languageButton,launcher)
    .replace('<main>',`${toolbar}\n<main>`)
    .replace('</head>','<link rel="stylesheet" href="assets/presentation-mode.css?v=20261103a">\n</head>')
    .replace('</body>','<script type="module" src="assets/presentation-mode.mjs?v=20261103a"></script>\n</body>');
}

export function withoutPresentationQuery(href) {
  const url = new URL(href);
  url.searchParams.delete('present');
  return url.href;
}

export function withPresentationQuery(href) {
  const url = new URL(href);
  url.searchParams.set('present','1');
  return url.href;
}
