export const config = {
  matcher: '/:path*',
};

const KNOWN_PATHS = new Set([
  '/', '/index.html', '/favicon.ico', '/favicon.svg',
  '/robots.txt', '/sitemap.xml', '/manifest.json', '/site.webmanifest',
  '/404.html', '/404',
]);
const KNOWN_PREFIXES = ['/css/', '/js/', '/api/', '/_vercel/', '/.well-known/'];

const SUSPICIOUS_PATTERNS = [
  /\.env(\.|$)/i, /\.git/i, /wp-admin/i, /wp-login/i, /phpmyadmin/i,
  /\.sql$/i, /\.bak$/i, /config\.php$/i, /\.aws/i, /\.ssh/i,
  /docker-compose/i, /\.htaccess$/i, /xmlrpc\.php$/i, /\.well-known.*ssh/i,
];

function escapeHtml(str = '') {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const { pathname } = url;

  if (KNOWN_PATHS.has(pathname) || KNOWN_PREFIXES.some((p) => pathname.startsWith(p))) {
    return;
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const isSuspicious = SUSPICIOUS_PATTERNS.some((re) => re.test(pathname));

  const ip = request.headers.get('x-real-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || '-';
  const country = request.headers.get('x-vercel-ip-country') || '-';
  const cityRaw = request.headers.get('x-vercel-ip-city') || '-';
  const city = cityRaw !== '-' ? decodeURIComponent(cityRaw) : '-';
  const ua = request.headers.get('user-agent') || '-';

  const label = isSuspicious
    ? '🚨 <b>PERCOBAAN AKSES MENCURIGAKAN</b>'
    : '❓ <b>PATH TIDAK DITEMUKAN</b>';

  const text = [
    label,
    '━━━━━━━━━━━━━━━━━━━━',
    `📄 <b>Path</b>        ${escapeHtml(pathname)}`,
    `🔧 <b>Method</b>   ${escapeHtml(request.method)}`,
    `📍 <b>IP</b>            <code>${escapeHtml(ip)}</code>`,
    `🌍 <b>Negara</b>    ${escapeHtml(country)}`,
    `🏙️ <b>Kota</b>          ${escapeHtml(city)}`,
    `🌐 <b>UA</b>            ${escapeHtml(ua.slice(0, 140))}`,
    '━━━━━━━━━━━━━━━━━━━━',
    '<i>pajar.biz.id</i>',
  ].join('\n');

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
  } catch {}
}
