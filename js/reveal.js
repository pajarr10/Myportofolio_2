/**
 * reveal.js
 * Triggers fade/scale/slide/blur entrance animations as elements enter
 * the viewport. Uses IntersectionObserver so it stays cheap even on
 * pages with many animated elements. Falls back to instant-visible
 * when IntersectionObserver isn't supported.
 */

export function initReveal() {
  const targets = document.querySelectorAll('.reveal, [data-animate]');
  if (!targets.length) return;

  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('in-view'));
    return;
  }

  // Optional stagger: siblings sharing a parent get an incremental delay.
  const staggerGroups = new Map();
  targets.forEach((el) => {
    const parent = el.parentElement;
    if (!staggerGroups.has(parent)) staggerGroups.set(parent, []);
    staggerGroups.get(parent).push(el);
  });
  staggerGroups.forEach((group) => {
    if (group.length < 2) return;
    group.forEach((el, i) => {
      if (!el.style.getPropertyValue('--d')) {
        el.style.setProperty('--d', `${Math.min(i * 60, 300)}ms`);
      }
    });
  });

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2, rootMargin: '0px 0px -40px 0px' }
  );

  targets.forEach((el) => observer.observe(el));
}
