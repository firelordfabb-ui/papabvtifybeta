# PAPABVTIFY — Audit Arsitektur Jaringan & API (API Network Audit)

## 1. Ikhtisar Arsitektur
Aplikasi PAPABVTIFY beroperasi dalam dua mode arsitektur:
1. **Desktop Windows (Electron):** Berjalan dengan backend `server.cjs` lokal terintegrasi di port 5188.
2. **Android APK (Capacitor):** Berjalan sebagai aplikasi mobile mandiri (standalone) tanpa mewajibkan server PC aktif, menggunakan native networking, Piped REST API, dan InnerTube.

---

## 2. Audit Endpoint & Status Eliminasi Ketergantungan LAN

| Endpoint / Layanan | Status Sebelumnya (Bermasalah) | Status Sekarang (Telah Diperbaiki) | Mekanisme Standalone |
| :--- | :--- | :--- | :--- |
| **`GET /api/search`** | Hardcoded ke `192.168.1.10:5188` (Hang 60s) | Mandiri Multi-Source | Menggunakan Piped API (`/search`) & InnerTube direct via `CapacitorHttp` |
| **`GET /api/stream`** | Hardcoded ke `192.168.1.10:5188` (Gagal putar) | Mandiri Direct Stream | Menggunakan `StreamResolver` (Piped `/streams/{id}` & InnerTube Player) |
| **Download Audio** | Mengambil dari `/api/stream` di LAN lokal | Mengunduh langsung dari CDN | Stream biner diunduh & disimpan ke IndexedDB `papabvtify_offline_db` |
| **Autentikasi & Akun** | Terkunci jika server mati | Session & Profile Persistence | Menggunakan offline session cache di `localStorage` & IndexedDB |
| **Listening Room** | Memerlukan SSE di port 5188 | Cloud Relay Ready | Otomatis mendeteksi keberadaan server publik sebelum mencoba koneksi SSE |
| **Lirik Lagu** | Bergantung pada ketersediaan API | LrcLib & LRCLib Direct Fallback | Mengakses LRCLib open API langsung via client |

---

## 3. Strategi Timeout & Error Handling Ramah Pengguna
Sebelumnya, timeout request fetch default browser bisa mencapai 60 detik tanpa feedback yang jelas kepada pengguna, atau menampilkan error teknis seperti:
> *"Aliran audio terputus. Pastikan server backend di PC (192.168.1.10:5188) aktif."*

Setelah audit dan perbaikan:
1. **Strict Safety Timeout (1.800 ms):** Jika backend LAN/kustom tidak merespons dalam 1.8 detik, sistem langsung beralih ke mode standalone tanpa mengunci UI.
2. **Pesan Error Ramah (User-Centric):** Pesan teknis diganti dengan notifikasi informatif:
   > *"Aliran audio terputus. Memeriksa koneksi atau beralih ke stream alternatif..."*
   > *"Lagu offline diputar langsung dari memori perangkat."*
3. **Penanganan Offline Penuh:** Ketika koneksi internet terputus, aplikasi tidak crash dan pengguna tetap dapat menikmati seluruh koleksi lagu yang telah diunduh di tab "Musik Unduhan".
