/**
 * tilt.js
 * Subtle 3D tilt on the biography portrait card, following the
 * pointer. Skipped entirely on touch-only devices.
 */

export function initTilt() {
  const card = document.getElementById('bio-card');
  const inner = card ? card.querySelector('.bio-card-inner') : null;
  const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (!card || !inner || !supportsHover) return;

  const MAX_TILT = 10;
  let frame = null;

  function applyTilt(clientX, clientY) {
    const rect = card.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    const rotateY = (x - 0.5) * MAX_TILT * 2;
    const rotateX = (0.5 - y) * MAX_TILT * 2;
    inner.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }

  card.addEventListener('mousemove', (e) => {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => applyTilt(e.clientX, e.clientY));
  });

  card.addEventListener('mouseleave', () => {
    if (frame) cancelAnimationFrame(frame);
    inner.style.transform = 'rotateX(0deg) rotateY(0deg)';
  });
}
