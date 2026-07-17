/**
 * main.js
 * Single entry point. Each feature lives in its own module under
 * /js — this file only wires them up, in the order that makes sense
 * (loader first so it can start its minimum-display timer as early
 * as possible).
 */

import { initLoader } from './loader.js';
import { initClock } from './clock.js';
import { initCurrentLine } from './currentLine.js';
import { initReveal } from './reveal.js';
import { initTilt } from './tilt.js';
import { initNav } from './nav.js';
import { initSmoothScroll } from './smoothScroll.js';
import { initCarousel } from './carousel.js';
import { initChat } from './chat.js';

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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
