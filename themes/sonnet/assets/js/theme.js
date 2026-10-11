(() => {
  const root = document.documentElement;
  const button = document.getElementById('theme-toggle');
  const system = matchMedia('(prefers-color-scheme: dark)');
  let explicit = false;
  try { explicit = ['light', 'dark'].includes(localStorage.getItem('sonnet-theme')); } catch (_) {}
  function apply(theme) {
    root.dataset.theme = theme;
    const label = theme === 'dark' ? '切换浅色模式' : '切换深色模式';
    button.setAttribute('aria-label', label);
    button.title = label;
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#262624' : '#faf9f5';
  }
  apply(root.dataset.theme);
  button.hidden = false;
  button.addEventListener('click', () => {
    const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    explicit = true;
    try { localStorage.setItem('sonnet-theme', theme); } catch (_) {}
    apply(theme);
  });
  system.addEventListener('change', event => {
    if (!explicit) apply(event.matches ? 'dark' : 'light');
  });
})();
