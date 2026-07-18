/**
 * visitorTracker.js
 * Mengirim satu event kecil ke backend (/api/visitor) setiap kali
 * halaman dibuka, supaya kamu dapat notifikasi Telegram real-time.
 * Tidak menyimpan cookie, tidak melacak lintas sesi — hanya "ping"
 * sekali per page load.
 */

const ENDPOINT = '/api/visitor';

export function initVisitorTracker() {
  // Hindari kirim ganda kalau initVisitorTracker terpanggil lebih dari sekali
  // dalam sesi yang sama (misal karena hot-reload saat development).
  if (window.__visitorPinged) return;
  window.__visitorPinged = true;

  const payload = {
    page: window.location.pathname || '/',
    userAgent: navigator.userAgent,
  };

  // Pakai fetch dengan keepalive supaya request tetap terkirim walau
  // user langsung pindah halaman / menutup tab.
  fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Diam-diam gagal — tracker tidak boleh mengganggu pengalaman user.
  });
}
