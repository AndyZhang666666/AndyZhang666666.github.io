(() => {
  const root = document.documentElement;
  const query = new URLSearchParams(location.search), palettes = ['frost','copper','mist','indigo'];
  function stored(key) {try {return localStorage.getItem(key);} catch {return null;}}
  const palette = query.get('palette') || stored('palette');
  if (palettes.includes(palette)) root.dataset.palette = palette;
  root.lang = (query.get('lang') || stored('portfolio-language')) === 'en' ? 'en' : 'zh-CN';
  if (stored('portfolio-motion-preference') === 'reduce' || matchMedia('(prefers-reduced-motion: reduce)').matches) root.dataset.motion = 'reduce';
})();
