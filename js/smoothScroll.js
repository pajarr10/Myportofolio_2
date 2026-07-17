/**
 * smoothScroll.js
 * Intercepts in-page anchor clicks (hero CTAs, footer links, etc. —
 * anything not already handled by nav.js) and scrolls with an offset
 * so content doesn't hide under the sticky header. Native CSS
 * `scroll-behavior: smooth` (see css/base.css) provides the fallback
 * easing baseline; this adds the header-offset correction.
 */

export function initSmoothScroll() {
  const header = document.querySelector('.site-header');
  const offset = header ? header.getBoundingClientRect().height + 12 : 0;

  document.querySelectorAll('a[href^="#"]:not([data-nav])').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;

      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}
