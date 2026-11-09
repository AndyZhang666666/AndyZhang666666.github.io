// app.js is regenerated from the historical content base. Keep motion ownership
// changes here, after patchPersonalApp, so a content rebuild cannot revive them.
export function patchMotionV2(app) {
  if (app.includes('// Motion V2: runtime owners live in motion-governor.mjs.')) return app;
  const owners = ['initCountUp', 'initNavState', 'initScrollProgress', 'initSpotlight', 'initCardTilt', 'initHeroFade', 'initMagnetic'];
  for (const owner of owners) {
    const declaration = new RegExp(`function ${owner}\\(\\) \\{[\\s\\S]*?\\n\\}`, 'm');
    if (!declaration.test(app)) throw new Error(`Motion V2: missing ${owner} in generated app`);
    app = app.replace(declaration, `// ${owner}: owned by assets/motion-governor.mjs.`);
    app = app.replace(new RegExp(`^    ${owner}\\(\\);\\n`, 'm'), '');
  }
  const anchorStart = app.indexOf(`  document.querySelectorAll('a[href^="#"]').forEach(a => {`);
  const anchorEnd = app.indexOf('\n}\n\n// ===== LANGUAGE', anchorStart);
  if (anchorStart < 0 || anchorEnd < 0) throw new Error('Motion V2: missing legacy anchor block');
  app = app.slice(0, anchorStart) + '  // Native hash anchors own navigation, URL changes and browser history.\n' + app.slice(anchorEnd);
  return '// Motion V2: runtime owners live in motion-governor.mjs.\n' + app;
}
