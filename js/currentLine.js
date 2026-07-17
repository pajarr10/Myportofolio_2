/**
 * currentLine.js
 * Rotates the small "current activity" status line under the hero lede.
 */

const LINES = [
  'membaca dokumentasi...',
  'menulis catatan kecil...',
  'mencoba hal baru...',
  'merapikan kode lama...',
  'belajar pelan-pelan...',
  'membaca error, lagi...',
  'menyimpan progres...',
];

export function initCurrentLine() {
  const el = document.getElementById('current-line-text');
  if (!el) return;

  el.style.transition = 'opacity .25s ease';
  let index = 0;

  setInterval(() => {
    index = (index + 1) % LINES.length;
    el.style.opacity = '0';
    setTimeout(() => {
      el.textContent = LINES[index];
      el.style.opacity = '1';
    }, 250);
  }, 3200);
}
