/**
 * loader.js
 * Shows a brief branded loading screen (~1s) on first paint, then
 * fades it out smoothly. Purely cosmetic — never blocks longer than
 * necessary, and never blocks at all if the loader markup is absent.
 */

const MIN_DISPLAY_MS = 500;

export function initLoader() {
  const loader = document.getElementById('loader');
  if (!loader) {
    document.body.classList.remove('is-loading');
    return;
  }

  const startedAt = performance.now();

  function hide() {
    const elapsed = performance.now() - startedAt;
    const wait = Math.max(MIN_DISPLAY_MS - elapsed, 0);

    setTimeout(() => {
      loader.classList.add('loader-hidden');
      document.body.classList.remove('is-loading');
      loader.addEventListener('transitionend', () => loader.remove(), { once: true });
    }, wait);
  }

  if (document.readyState === 'complete') {
    hide();
  } else {
    window.addEventListener('load', hide, { once: true });
  }
}
