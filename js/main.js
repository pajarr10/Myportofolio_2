
import { initLoader } from './loader.js';
import { initClock } from './clock.js';
import { initCurrentLine } from './currentLine.js';
import { initReveal } from './reveal.js';
import { initTilt } from './tilt.js';
import { initNav } from './nav.js';
import { initSmoothScroll } from './smoothScroll.js';
import { initCarousel } from './carousel.js';
import { initChat } from './chat.js';
import { initVisitorTracker } from './visitorTracker.js';
import { initContactForm } from './contactForm.js';

function init() {
  initLoader();
  initClock();
  initCurrentLine();
  initReveal();
  initTilt();
  initNav();
  initSmoothScroll();
  initCarousel();
  initChat();
  initVisitorTracker();
  initContactForm();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
