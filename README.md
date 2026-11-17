# 💜 papabvtify — Music Without Limits

Aplikasi pemutar musik desktop modern yang terinspirasi dari desain **macOS Apple Music / Liquid Violet Glass (Foto 1)** dan **3D Album Coverflow Carousel (Foto 2)** dengan pemutaran audio 100% bebas iklan dari YouTube Music dan lirik karaoke tersinkronisasi.

---

## 📸 Referensi Desain yang Diimplementasikan

1. **Antarmuka Utama (Sesuai Foto 1):**
   - **Sidebar Kiri:** Tombol traffic lights macOS (Merah, Kuning, Hijau), logo **papabvtify**, input pencarian, kategori **Menu (Home, Discover, Browse, Podcasts, Radio)**, kategori **Library (Albums, Song, Artists)**, pemilih tema langsung, dan profil pengguna (*Vitaliy Dorozhko*).
   - **Bagian Tengah:**
     - Navigasi `< >` dan header **What's hot / Trending**.
     - **Hero Card:** Tag *Artist*, *Monthly listener : 98.029*, judul besar *"Top all over the world"*, tombol merah `▶ Play`, dan tombol `Follow`.
     - **Tabel Playlist:** Kolom `#`, `TITLE`, `ARTIST`, `TIME`, `ALBUM` lengkap dengan animasi indikator equalizer gelombang suara pada lagu yang sedang aktif diputar.
     - **Bottom Floating Dock Player:** Slider durasi yang **100% bisa di-skip/seek** ke detik mana pun, tombol kontrol playback, like, shuffle, repeat, dan tombol expand Coverflow.
   - **Panel Kanan:**
     - **Tags:** Kategori genre pil (*Acoustic, Piano jazz, Jazz, Indie pop*).
     - **Played:** Daftar riwayat lagu yang baru saja diputar lengkap dengan waktu relatif (*4 min ago, 20 min ago, dst*).
     - **Now Playing Card:** Kartu album Taylor Swift *"Lover"* dengan tombol `+` dan akses langsung ke Coverflow.

2. **Mode Pemutaran 3D Coverflow (Sesuai Foto 2):**
   - **3D Coverflow Carousel:** 5 kartu album berjejer dalam perspektif 3D (*fanning depth*). Kartu tengah aktif membesar dengan bayangan cahaya hangat, judul lagu, dan nama artis.
   - **Floating Capsule Player di Bagian Bawah:** Pemutar berbentuk kapsul memanjang dengan kontrol *Prev, Play/Pause, Next*, kartu mikro lagu yang sedang berputar dengan *micro progress line*, tombol *DSP Sound Style*, tombol *Lyrics [ " ]*, dan tombol *Queue*.

3. **Lirik Karaoke Tersinkronisasi (Word-by-Word Synced):**
   - Mengambil lirik dari basis data **LRCLIB**.
   - Animasi sapuan kata-per-kata (*syllable swipe sync*) 60 FPS yang menyala mengikuti alunan musik.
   - Klik baris lirik mana pun untuk langsung melompat (*seek*) ke detik tersebut.
   - Tombol kalibrasi offset waktu (+/- 0.2s) untuk penyelarasan sempurna.

4. **Sistem Pergantian Tema Dinamis (5 Tema Berbeda):**
   - 💜 **Midnight Violet (Default - Sesuai Foto 1):** Warna ungu tua dan nila (*deep violet & indigo*) dengan aksen neon cyan.
   - 🌟 **Golden Amber (Sesuai Foto 2):** Nuansa perunggu hangat (*warm sunset bronze & amber glow*).
   - 💎 **Liquid Glass:** Kaca tembus pandang dengan efek *backdrop-filter blur 32px* dan pantulan cahaya halus.
   - 🖤 **Minimalist Dark:** Tampilan hitam arang *matte* yang bersih dan monokrom.
   - 📄 **Kertas (Paper Minimalist):** Tampilan cerah hangat bergaya editorial majalah bersih.

---

## 🛠️ Perbaikan Bug Inti (100% Berfungsi)

1. **Fitur Skip / Lompat Durasi (Range Seek):**
   - *Penyebab Bug Sebelumnya:* Server streaming lokal belum mendukung *HTTP 206 Partial Content* dan header `Range`, sehingga browser memperlakukannya sebagai *live non-seekable stream*.
   - *Perbaikan:* Ditambahkan dukungan penuh `Range` request dan header `Content-Range: bytes start-end/total`. Sekarang Anda dapat melompati (*seek/skip*) durasi lagu ke detik mana pun secara instan dan mulus!
2. **Pencarian Realtime Seketika:**
   - Ditambahkan *in-memory cache* dan optimalisasi parsing sehingga pencarian lagu lokal maupun internasional muncul sekejap tanpa delay.
3. **100% Bebas Iklan:**
   - Mengambil langsung bitstream audio murni (*audio/webm opus*) dari CDN Google Video tanpa pernah mengeksekusi skrip atau server iklan Google.

---

## 🚀 Cara Menjalankan

Cukup klik ganda file:
```bat
start-app.bat
```
Atau melalui terminal:
```bash
cd C:\Users\fabiangarfield\.gemini\antigravity\scratch\auralis-next
npm.cmd run dev
```
Buka browser di: `http://localhost:5173`
