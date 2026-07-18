/**
 * api/visitor.js
 * Vercel Serverless Function.
 *
 * Menerima event visitor dari script tracker di website, lalu kirim
 * notifikasi ke Telegram lewat Bot API. Token & chat ID diambil dari
 * environment variables di Vercel — TIDAK pernah ditaruh di kode.
 *
 * Env vars yang harus diset di Vercel (Project Settings → Environment
 * Variables):
 *   TELEGRAM_BOT_TOKEN   -> token dari @BotFather
 *   TELEGRAM_CHAT_ID     -> chat_id kamu (dari @userinfobot, dsb)
 */

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Deteksi browser & device secara kasar dari user-agent string.
// Tidak butuh library eksternal — cukup untuk keperluan notifikasi.
function parseUserAgent(ua = '') {
  let browser = 'Unknown';
  if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome/i.test(ua) && !/edg/i.test(ua)) browser = 'Chrome';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/opr|opera/i.test(ua)) browser = 'Opera';

  let device = 'Desktop';
  if (/android/i.test(ua)) device = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) device = 'iOS';
  else if (/mobile/i.test(ua)) device = 'Mobile';

  return { browser, device };
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

    const ua = userAgent || req.headers['user-agent'] || '';
    const { browser, device } = parseUserAgent(ua);

    const now = new Date();
    const time = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit',
    }).format(now);

    const referer = req.headers['referer'] || '-';
    const forwardedFor = req.headers['x-forwarded-for'];
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : (req.socket?.remoteAddress || '-');

    const text = [
      '👀 <b>VISITOR BARU</b>',
      '━━━━━━━━━━━━━━━━━━━━',
      `📄 <b>Halaman</b>  ${escapeHtml(page)}`,
      `🕒 <b>Waktu</b>       ${escapeHtml(time)} WIB`,
      `🌐 <b>Browser</b>   ${escapeHtml(browser)}`,
      `📱 <b>Device</b>    ${escapeHtml(device)}`,
      `🔗 <b>Referer</b>   ${escapeHtml(referer)}`,
      `📍 <b>IP</b>            <code>${escapeHtml(ip)}</code>`,
      '━━━━━━━━━━━━━━━━━━━━',
      `<i>pajar.biz.id</i>`,
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
