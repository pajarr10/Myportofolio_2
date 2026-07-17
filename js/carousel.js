/**
 * carousel.js
 * Horizontal, infinitely-looping project carousel. Supports mouse
 * drag, touch swipe, and a 3-second autoplay that pauses while the
 * user is interacting. Card markup/styling is untouched — this only
 * changes how the cards are laid out and moved.
 */

const AUTO_INTERVAL_MS = 3000;

export function initCarousel() {
  const carousel = document.getElementById('project-carousel');
  const track = document.getElementById('project-grid');
  if (!carousel || !track) return;

  // Clone the card set once so the loop can wrap seamlessly.
  const originalCards = Array.from(track.children);
  originalCards.forEach((card) => track.appendChild(card.cloneNode(true)));

  let pos = 0;
  let cardWidth = 0;
  let halfWidth = 0;
  let autoTimer = null;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartPos = 0;
  let rafId = null;

  function measure() {
    const first = track.children[0];
    if (!first) return;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    cardWidth = first.getBoundingClientRect().width + gap;
    halfWidth = cardWidth * originalCards.length;
  }

  function setPos(x, animate) {
    track.style.transition = animate ? 'transform .5s ease' : 'none';
    track.style.transform = `translateX(${x}px)`;
  }

  function normalize() {
    if (halfWidth === 0) return;
    if (pos <= -halfWidth) pos += halfWidth;
    if (pos > 0) pos -= halfWidth;
  }

  function step() {
    pos -= cardWidth;
    normalize();
    setPos(pos, true);
  }

  function startAuto() {
    stopAuto();
    autoTimer = setInterval(step, AUTO_INTERVAL_MS);
  }

  function stopAuto() {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = null;
  }

  function onDragStart(clientX) {
    isDragging = true;
    dragStartX = clientX;
    dragStartPos = pos;
    stopAuto();
    carousel.classList.add('dragging');
    track.style.transition = 'none';
  }

  function onDragMove(clientX) {
    if (!isDragging) return;
    const delta = clientX - dragStartX;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      pos = dragStartPos + delta;
      setPos(pos, false);
    });
  }

  function onDragEnd() {
    if (!isDragging) return;
    isDragging = false;
    carousel.classList.remove('dragging');
    pos = Math.round(pos / cardWidth) * cardWidth;
    normalize();
    setPos(pos, true);
    startAuto();
  }

  measure();
  window.addEventListener('resize', measure);
  startAuto();

  carousel.addEventListener('mousedown', (e) => {
    onDragStart(e.clientX);
    e.preventDefault();
  });
  window.addEventListener('mousemove', (e) => onDragMove(e.clientX));
  window.addEventListener('mouseup', onDragEnd);
  carousel.addEventListener('mouseleave', () => { if (isDragging) onDragEnd(); });

  carousel.addEventListener('touchstart', (e) => onDragStart(e.touches[0].clientX), { passive: true });
  carousel.addEventListener('touchmove', (e) => onDragMove(e.touches[0].clientX), { passive: true });
  carousel.addEventListener('touchend', onDragEnd);
}
