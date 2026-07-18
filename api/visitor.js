/**
 * api/visitor.js
 * Vercel Serverless Function.
 *
 * Menerima event visitor dari script tracker di website, lalu kirim
 * notifikasi lengkap ke Telegram: halaman, waktu, browser, OS,
 * device, referer, IP, dan lokasi (negara/kota/ISP) hasil lookup IP.
 *
 * Env vars yang harus diset di Vercel:
 *   TELEGRAM_BOT_TOKEN
 *   TELEGRAM_CHAT_ID
 */

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

// Lookup negara/kota/ISP dari IP pakai ip-api.com (gratis, tanpa key).
// Gagal soft — kalau lookup error/limit, tetap lanjut kirim notif
// dengan field lokasi diisi '-', tidak pernah bikin request gagal total.
async function lookupGeo(ip) {
  const fallback = { country: '-', city: '-', isp: '-' };
  if (!ip || ip === '-' || ip.startsWith('127.') || ip.startsWith('::1')) {
    return fallback;
  }
  try {
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,city,isp`
    );
    if (!res.ok) return fallback;
    const data = await res.json();
    if (data.status !== 'success') return fallback;
    return {
      country: data.country || '-',
      city: data.city || '-',
      isp: data.isp || '-',
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
    const { page = '/', userAgent = '' } = body;

    const uaString = userAgent || req.headers['user-agent'] || '';
    const { browser, os, device } = parseUserAgent(uaString);

    const now = new Date();
    const time = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit',
    }).format(now);

    const referer = req.headers['referer'] || '-';
    const ip = getClientIp(req);
    const { country, city, isp } = await lookupGeo(ip);

    const text = [
      '👀 <b>VISITOR BARU</b>',
      '━━━━━━━━━━━━━━━━━━━━',
      `📄 <b>Halaman</b>   ${escapeHtml(page)}`,
      `🕒 <b>Waktu</b>       ${escapeHtml(time)} WIB`,
      `🌐 <b>Browser</b>   ${escapeHtml(browser)}`,
      `💻 <b>OS</b>            ${escapeHtml(os)}`,
      `📱 <b>Device</b>    ${escapeHtml(device)}`,
      `🌍 <b>Negara</b>    ${escapeHtml(country)}`,
      `🏙️ <b>Kota</b>          ${escapeHtml(city)}`,
      `📡 <b>ISP</b>           ${escapeHtml(isp)}`,
      `🔗 <b>Referer</b>   ${escapeHtml(referer)}`,
      `📍 <b>IP</b>            <code>${escapeHtml(ip)}</code>`,
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
    console.error('visitor.js error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
