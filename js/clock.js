/**
 * clock.js
 * Real-time header date + footer clock, formatted for Asia/Jakarta (WIB).
 */

function pad(n) {
  return String(n).padStart(2, '0');
}

export function initClock() {
  const headerDate = document.getElementById('header-date');
  const footerClock = document.getElementById('footer-clock');
  if (!headerDate && !footerClock) return;

  const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta', day: '2-digit', month: '2-digit', year: 'numeric',
  });
  const timeFormatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });

  function tick() {
    const now = new Date();
    try {
      if (headerDate) headerDate.textContent = dateFormatter.format(now);
      if (footerClock) footerClock.textContent = `${timeFormatter.format(now)} WIB`;
    } catch {
      if (headerDate) headerDate.textContent = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
      if (footerClock) footerClock.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    }
  }

  tick();
  setInterval(tick, 1000);
}
