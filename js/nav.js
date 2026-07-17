/**
 * nav.js
 * Three-dot navigation dropdown: toggle, outside-click / Escape to
 * close, and smooth-scroll to each target section.
 */

export function initNav() {
  const toggle = document.getElementById('nav-toggle');
  const dropdown = document.getElementById('nav-dropdown');
  if (!toggle || !dropdown) return;

  function close() {
    dropdown.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    setTimeout(() => { dropdown.hidden = true; }, 300);
  }

  function open() {
    dropdown.hidden = false;
    requestAnimationFrame(() => dropdown.classList.add('open'));
    toggle.setAttribute('aria-expanded', 'true');
  }

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    isOpen ? close() : open();
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.hidden && !dropdown.contains(e.target) && e.target !== toggle) {
      close();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  dropdown.querySelectorAll('[data-nav]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      close();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}
