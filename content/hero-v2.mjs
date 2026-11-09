// Final, repeatable enhancement of the generated Hero. Text and destinations
// continue to come from the existing content pipeline.
const paperStylesheet = '<link rel="stylesheet" href="assets/hero-paper.css?v=20261109-v2">';

export function enhanceHeroV2(html) {
  if (!/<section\b[^>]*\bid="top"/.test(html)) {
    throw new Error('Hero V2 requires the existing top section.');
  }

  html = html.replace(/<section\b([^>]*\bid="top"[^>]*)>([\s\S]*?)<\/section>/, (section, attributes, body) => {
    const classes = attributes.match(/\bclass="([^"]*)"/);
    if (!classes) throw new Error('Hero V2 requires the existing Hero class.');
    const classNames = new Set(classes[1].split(/\s+/).filter(Boolean));
    classNames.add('hero-v2');
    attributes = attributes.replace(/\bclass="[^"]*"/, `class="${[...classNames].join(' ')}"`);

    // Only wrap the original layers once. Their inner transforms remain free
    // for slow ambient movement; pointer motion belongs to the outer tracks.
    if (!body.includes('data-hero-paper="back"')) {
      body = body.replace('<span class="portrait-ring"></span>', '<span class="portrait-paper-track portrait-paper-track-back" data-hero-paper="back"><span class="portrait-ring"></span></span>');
    }
    if (!body.includes('data-hero-paper="front"')) {
      body = body.replace('<span class="portrait-blob"></span>', '<span class="portrait-paper-track portrait-paper-track-front" data-hero-paper="front"><span class="portrait-blob"></span></span>');
    }
    if (!body.includes('class="portrait-local-light"')) {
      body = body.replace(/(<div class="hero-portrait[^>]*>)/, '$1\n      <span class="portrait-local-light"></span>');
    }
    return `<section${attributes}>${body}</section>`;
  });

  if (!html.includes('href="assets/hero-paper.css?')) {
    html = html.replace('</head>', `${paperStylesheet}\n</head>`);
  }
  return html;
}
