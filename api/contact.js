/**
 * api/contact.js
 * Vercel Serverless Function.
 *
 * Menerima submit form kontak (nama + pesan, tanpa email) dari
 * website, lalu kirim sebagai notifikasi ke Telegram lewat Bot API.
 * Pakai env var yang sama dengan api/visitor.js — TELEGRAM_BOT_TOKEN
 * dan TELEGRAM_CHAT_ID, sudah diset di Vercel.
 */

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error('TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID belum diset di env Vercel.');
    return res.status(500).json({ error: 'Server not configured' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const name = (body.name || '').trim();
    const email = (body.email || '').trim();
    const message = (body.message || '').trim();

    // Validasi dasar di server — jangan percaya input dari client.
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Nama, email, dan pesan wajib diisi' });
    }
    if (name.length > 80 || email.length > 120 || message.length > 1000) {
      return res.status(400).json({ error: 'Input terlalu panjang' });
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return res.status(400).json({ error: 'Format email tidak valid' });
    }

    const now = new Date();
    const time = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta', day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(now);

    const text = [
      '✉️ <b>PESAN BARU DARI WEBSITE</b>',
      '━━━━━━━━━━━━━━━━━━━━',
      `👤 <b>Nama</b>    ${escapeHtml(name)}`,
      `📧 <b>Email</b>    ${escapeHtml(email)}`,
      `🕒 <b>Waktu</b>    ${escapeHtml(time)} WIB`,
      '',
      `💬 ${escapeHtml(message)}`,
      '━━━━━━━━━━━━━━━━━━━━',
      '<i>pajar.biz.id</i>',
    ].join('\n');

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!tgRes.ok) {
      const errBody = await tgRes.text();
      console.error('Telegram API error:', errBody);
      return res.status(502).json({ error: 'Failed to notify Telegram' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('contact.js error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
      }
  
