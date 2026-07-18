const cooldown = new Map();

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
  const forwarded = req.headers['x-forwarded-for'];

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return req.socket?.remoteAddress || '-';
}

async function lookupGeo(ip) {
  const fallback = {
    country: '-',
    city: '-'
  };

  try {
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,city`
    );

    if (!res.ok) return fallback;

    const data = await res.json();

    if (data.status !== 'success') return fallback;

    return {
      country: data.country || '-',
      city: data.city || '-'
    };

  } catch {
    return fallback;
  }
}


export default async function handler(req, res) {

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');

    return res.status(405).json({
      error: 'Method not allowed'
    });
  }


  try {

    const body =
      typeof req.body === 'string'
        ? JSON.parse(req.body)
        : req.body || {};


    const name = (body.name || '').trim();
    const email = (body.email || '').trim();
    const message = (body.message || '').trim();

    // honeypot anti bot
    const website = (body.website || '').trim();

    if (website) {
      return res.status(403).json({
        error: 'Bot detected'
      });
    }


    if (!name || !email || !message) {
      return res.status(400).json({
        error: 'Field wajib diisi'
      });
    }


    if (
      name.length > 80 ||
      email.length > 120 ||
      message.length > 1000
    ) {
      return res.status(400).json({
        error: 'Input terlalu panjang'
      });
    }


    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Email tidak valid'
      });
    }


    const ip = getClientIp(req);


    // cooldown 30 detik
    const now = Date.now();
    const last = cooldown.get(ip);

    if (last && now - last < 30000) {
      return res.status(429).json({
        error: 'Tunggu 30 detik'
      });
    }

    cooldown.set(ip, now);



    const spamWords = [
      'viagra',
      'casino',
      'porn',
      'crypto',
      'http://',
      'https://'
    ];


    if (
      spamWords.some(word =>
        message.toLowerCase().includes(word)
      )
    ) {
      return res.status(400).json({
        error: 'Spam detected'
      });
    }



    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;


    if (!token || !chatId) {
      return res.status(500).json({
        error: 'Telegram belum diset'
      });
    }


    const ua =
      req.headers['user-agent'] || '';

    const {
      browser,
      os,
      device
    } = parseUserAgent(ua);



    const {
      country,
      city
    } = await lookupGeo(ip);



    const time = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      dateStyle: 'full',
      timeStyle: 'short'
    }).format(new Date());



    const text = [
      '✉️ <b>PESAN BARU WEBSITE</b>',
      '━━━━━━━━━━━━━━━━',

      `👤 <b>Nama:</b> ${escapeHtml(name)}`,
      `📧 <b>Email:</b> ${escapeHtml(email)}`,

      `🕒 <b>Waktu:</b> ${time}`,

      `🌍 <b>Negara:</b> ${country}`,
      `🏙️ <b>Kota:</b> ${city}`,

      `🌐 <b>Browser:</b> ${browser}`,
      `💻 <b>OS:</b> ${os}`,
      `📱 <b>Device:</b> ${device}`,

      `📍 <b>IP:</b> <code>${escapeHtml(ip)}</code>`,

      '',
      `💬 ${escapeHtml(message)}`,

      '━━━━━━━━━━━━━━━━',
      '<i>pajar.biz.id</i>'

    ].join('\n');



    const tg = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers:{
          'Content-Type':'application/json'
        },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode:'HTML',
          disable_web_page_preview:true
        })
      }
    );


    if (!tg.ok) {
      return res.status(502).json({
        error:'Telegram gagal'
      });
    }


    return res.status(200).json({
      ok:true
    });


  } catch(err) {

    console.error(err);

    return res.status(500).json({
      error:'Internal error'
    });

  }
}