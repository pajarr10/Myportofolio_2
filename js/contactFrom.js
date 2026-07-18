/**
 * contactForm.js
 * Handle submit form kontak (nama + pesan, tanpa email) di section
 * #contact Krim ke api/contact.js, tampilkan status sukses/error
 * langsung di halaman tanpa reload.
 */

const ENDPOINT = '/api/contact';

export function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const nameInput = document.getElementById('contact-name');
  const emailInput = document.getElementById('contact-email');
  const messageInput = document.getElementById('contact-message');
  const submitBtn = document.getElementById('contact-form-submit');
  const statusEl = document.getElementById('contact-form-status');

  function setStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.classList.remove('is-success', 'is-error');
    if (kind) statusEl.classList.add(`is-${kind}`);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const message = messageInput.value.trim();

    if (!name || !email || !message) {
      setStatus('Nama, email, dan pesan wajib diisi.', 'error');
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setStatus('Format email tidak valid.', 'error');
      return;
    }

    submitBtn.disabled = true;
    setStatus('Mengirim...', null);

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });

      if (!res.ok) throw new Error('Request failed');

      form.reset();
      setStatus('Pesan terkirim! Terima kasih sudah menghubungi. 🙌', 'success');
    } catch (err) {
      setStatus('Gagal mengirim. Coba lagi sebentar lagi.', 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });
}
