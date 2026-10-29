(() => {
  let theme = 'light';
  try {
    const saved = localStorage.getItem('sparks-theme');
    theme = saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  } catch {
    theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.dataset.theme = theme;
})();