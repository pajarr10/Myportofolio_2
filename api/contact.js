function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function parseUserAgent(uaString = '') {
  let browser = 'Unknown';
  if (/edg/i.test(uaString)) browser = 'Edge';
  else if (/opr|opera/i.test(uaString)) browser = 'Opera';
  else if (/chrome/i.test(uaString) && !/edg/i.test(uaString)) browser = 'Chrome';
  else if (/firefox/i.test(uaString)) browser = 'Firefox';
  else if (/safari/i.test(uaString) && !/chrome/i.test(uaString)) browser = 'Safari';

  let os = 'Unknown';
  if (/windows/i.test(uaString)) os = 'Windows';
  else if (/android/i.test(uaString)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(uaString)) os = 'iOS';
  else if (/mac os/i.test(uaString)) os = 'macOS';
  else if (/linux/i.test(uaString)) os = 'Linux';

  let device = 'Desktop';
  if (/android/i.test(uaString)) device = 'Android';
  else if (/iphone|ipad|ipod/i.test(uaString)) device = 'iOS';
  else if (/mobile/i.test(uaString)) device = 'Mobile';
  else if (/tablet/i.test(uaString)) device = 'Tablet';

  return { browser, os, device };
}

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return req.socket?.remoteAddress || '-';
}

// Lookup negara/kota dari IP pakai ip-api.com (gratis, tanpa key).
// Gagal soft — kalau lookup error/limit, field lokasi diisi '-' dan
// pesan tetap terkirim seperti biasa.
async function lookupGeo(ip) {
  const fallback = { country: '-', city: '-' };
  if (!ip || ip === '-' || ip.startsWith('127.') || ip.startsWith('::1')) {
    return fallback;
  }
  try {
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,city`
    );
    if (!res.ok) return fallback;
    const data = await res.json();
    if (data.status !== 'success') return fallback;
    return {
      country: data.country || '-',
      city: data.city || '-',
    };
  } catch {
    return fallback;
  }
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

    const uaString = req.headers['user-agent'] || '';
    const { browser, os, device } = parseUserAgent(uaString);

    const ip = getClientIp(req);
    const { country, city } = await lookupGeo(ip);

    const now = new Date();
    const time = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta', day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(now);

    const text = [
      '✉️ <b>PESAN BARU DARI WEBSITE</b>',
      '━━━━━━━━━━━━━━━━━━━━',
      `👤 <b>Nama</b>       ${escapeHtml(name)}`,
      `📧 <b>Email</b>       ${escapeHtml(email)}`,
      `🕒 <b>Waktu</b>       ${escapeHtml(time)} WIB`,
      `🌍 <b>Negara</b>     ${escapeHtml(country)}`,
      `🏙️ <b>Kota</b>           ${escapeHtml(city)}`,
      `🌐 <b>Browser</b>   ${escapeHtml(browser)}`,
      `💻 <b>OS</b>            ${escapeHtml(os)}`,
      `📱 <b>Device</b>    ${escapeHtml(device)}`,
      `📍 <b>IP</b>            <code>${escapeHtml(ip)}</code>`,
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
