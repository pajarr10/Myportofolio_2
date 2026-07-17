# P4J∆R — Portofolio Muhammad Fajar

Website portofolio statis, dark mode, bergaya editorial/arsip/terminal.
HTML, CSS, dan JavaScript murni — tanpa framework, tanpa build step.
CSS dan JS dipisah per fitur/tanggung-jawab agar mudah dipelihara.

## Struktur file

```
/
├── index.html
├── css/
│   ├── base.css          reset, CSS variables, tipografi dasar, noise/grid overlay
│   ├── loader.css        loading screen awal
│   ├── header.css        navbar + dropdown menu titik tiga
│   ├── hero.css          hero title, CTA, meta panel
│   ├── marquee.css       teks berjalan (dua baris, arah berlawanan)
│   ├── sections.css      heading section generik
│   ├── projects.css      carousel project
│   ├── bio.css           biography + tilt card
│   ├── timeline.css      timeline "A LINE, DRAWN"
│   ├── stack.css         skill bar "THE STACK"
│   ├── lab.css           AI Lab chat
│   ├── contact.css       daftar kontak
│   ├── footer.css        footer + system clock
│   ├── animations.css    reveal-on-scroll (fade/scale/slide/blur)
│   └── responsive.css    breakpoint mobile/tablet
├── js/
│   ├── main.js           entry point, memanggil semua modul init*()
│   ├── loader.js         loading screen (~1 detik, fade out)
│   ├── clock.js          jam & tanggal real-time (WIB)
│   ├── currentLine.js    status line hero yang berganti-ganti
│   ├── reveal.js         IntersectionObserver untuk animasi masuk viewport
│   ├── tilt.js           tilt 3D kartu biography
│   ├── nav.js            dropdown menu navigasi + smooth scroll
│   ├── smoothScroll.js   smooth scroll untuk link anchor lain (CTA, footer)
│   ├── carousel.js       carousel project: drag, swipe, autoplay, infinite loop
│   ├── chatStore.js      penyimpanan riwayat percakapan AI Lab (in-memory)
│   └── chat.js           logika & UI AI Lab chat (pakai chatStore untuk konteks)
├── prompt.txt            catatan internal fitur lab chat
├── README.md             dokumen ini
├── vercel.json           konfigurasi deploy statis
├── robots.txt / sitemap.xml
├── manifest.json / site.webmanifest
├── favicon.svg / favicon.ico
├── LICENSE
└── .gitignore
```

## Menjalankan secara lokal

`js/main.js` memakai ES modules (`type="module"`), jadi harus dibuka lewat
server, bukan langsung dobel-klik file (`file://` diblokir CORS oleh browser
untuk modules):

```bash
npx serve .
# atau
python3 -m http.server 8080
```

## Deploy ke Vercel

1. Push folder ini ke repository GitHub.
2. Import repo di [vercel.com/new](https://vercel.com/new).
3. Framework preset: **Other** — semua file statis di root, tidak ada build
   command.
4. Deploy. `vercel.json` menangani clean URL dan header dasar.

## AI Lab — memori percakapan

`js/chatStore.js` menyimpan seluruh riwayat pesan (`system` / `user` /
`assistant`) di memori selama tab masih terbuka. Setiap pesan baru dikirim
ke endpoint bersama ringkasan riwayat sebelumnya (`chat.js#buildPrompt`),
jadi AI tidak menganggap tiap pertanyaan sebagai percakapan baru. Riwayat
hilang saat halaman di-refresh — ini disengaja, dan arsitekturnya sudah
dipisah (`chatStore.js`) supaya nanti gampang diupgrade ke `localStorage`
atau database tanpa mengubah logika di `chat.js`.

Endpoint yang dipanggil:

```
GET https://api.cmnty.web.id/ai/claude?text=<riwayat+pesan+terbaru>
```

## Fitur lain

- **Loading screen** — tampil ±1 detik saat pertama dibuka, lalu fade out
  halus ke halaman utama (`js/loader.js` + `css/loader.css`).
- **Smooth scroll** — `scroll-behavior: smooth` di `css/base.css`, ditambah
  `js/smoothScroll.js` untuk offset header sticky dan `js/nav.js` untuk menu
  dropdown.
- **Reveal animation** — `js/reveal.js` + `css/animations.css`, memakai
  `IntersectionObserver`, varian fade-up/fade/slide/scale/blur lewat atribut
  `data-animate`, durasi 500–800ms.
- **Double marquee** — baris teknologi sekarang dua baris berlawanan arah,
  seamless loop, pakai `transform` supaya tetap mulus di 60fps.
- **Project carousel** — drag mouse & swipe di HP, autoplay 3 detik, infinite
  loop (kartu di-clone sekali), pause saat drag lalu lanjut lagi. Desain
  kartu proyek tidak diubah sama sekali.

## Lisensi

MIT — lihat `LICENSE`.
