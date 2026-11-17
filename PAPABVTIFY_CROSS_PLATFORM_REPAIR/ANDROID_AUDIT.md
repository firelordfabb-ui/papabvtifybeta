# PAPABVTIFY — Android APK Audit & Root Cause Analysis

**Audit Date:** November 2026  
**Auditor:** Senior Android & Full-Stack Systems Engineer  
**Target:** PAPABVTIFY Cross-Platform (Windows Desktop & Android APK)  
**Status:** Audit Completed & Systematically Remediated  

---

## 1. Executive Summary

Pengujian awal pada Android APK PAPABVTIFY versi awal menunjukkan perbedaan signifikan dibandingkan versi Windows Desktop. Meskipun aplikasi dapat diinstal dan menampilkan antarmuka visual, fungsionalitas inti mengalami kegagalan sistemik:
1. **Audio Playback Failure:** Lagu tidak bersuara sama sekali (seperti pemutar pajangan).
2. **Search API Failure:** Pencarian lagu tidak membuahkan hasil (kembali kosong).
3. **Listening Room Crash:** Masuk ke Listening Room langsung menghasilkan crash JSON parser: `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`.
4. **Responsive UI Breakdown:** Layout desktop bergeser ke mobile tanpa refactor adaptif, menyebabkan horizontal overflow, teks terpotong, card terpotong, modal player tumpang-tindih, dan kontrol tersembunyi di bawah layar.
5. **Feature Truncation:** Fitur penting seperti Teman, Audio Lab, Podcast, Room, Unduhan, Pengaturan, dan Profil tidak memiliki navigasi yang jelas di perangkat Android berlayar kecil.

---

## 2. Root Cause Analysis (Penyebab Utama)

### A. Arsitektur Jaringan & Origin Mismatch (Root Cause Utama Pemutar & Pencarian)
- **Windows Desktop (Electron):**  
  Pada Electron, backend Express internal (`server.cjs`) berjalan secara lokal pada `127.0.0.1:5188`. Front-end Electron dimuat langsung dari `http://127.0.0.1:5188` atau memproksi panggilan relatif `/api/*` secara transparan ke loopback port 5188.
- **Android APK (Capacitor WebView):**  
  Pada Capacitor Android, aplikasi web disajikan dari skema WebView internal `https://localhost` (aset web lokal yang dibundel di dalam APK).
  - Ketika antarmuka memanggil `fetch('/api/search?q=...')` atau `<audio src="/api/stream?id=...">`, WebView mencoba menyelesaikan URL relatif tersebut terhadap origin saat ini: `https://localhost/api/...`.
  - Server aset lokal Capacitor tidak memiliki endpoint backend Express. Berdasarkan konfigurasi SPA, semua URL yang tidak cocok dengan berkas statis akan otomatis me-route kembali ke berkas `dist/index.html` dengan kode HTTP 200 OK.
  - Akibatnya:
    1. Respon dari pemanggilan API adalah teks HTML (`<!DOCTYPE html>...`). Saat kode memanggil `response.json()`, runtime JavaScript melempar error:  
       `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`.
    2. Tag `<audio src="https://localhost/api/stream?id=...">` mencoba mem-parsing berkas HTML sebagai audio codec (AAC/MP3/Opus), yang seketika memicu status audio decode error atau playback stalled. Audio tidak pernah berbunyi.
  - Selain itu, `server.cjs` sebelumnya di-bind secara eksklusif ke host loopback `127.0.0.1`. Ini secara mutlak menolak koneksi dari perangkat eksternal (seperti ponsel Android pada jaringan Wi-Fi lokal).

### B. UI Responsiveness & Safe Area Viewport Failures
- `index.html` hanya menyetel `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`. Ini tidak mengaktifkan `viewport-fit=cover`, mengakibatkan safe area insets (notch kamera, status bar, gesture navigation bar) tumpang-tindih dengan elemen kontrol UI.
- Komponen seperti `TopHeader.tsx` memiliki elemen fixed lebar (`w-80`) dan shortcut desktop keyboard (`Ctrl + K`) yang memakan lebar layar HP (360px - 412px), memicu horizontal scrollbar dan teks keluar batas layar.
- `BottomPlayer.tsx` menempel di dasar layar (`bottom-0` atau `bottom-16`) sehingga menutupi atau bertabrakan dengan `BottomNav.tsx` dan gesture bar Android.
- `PlayerModal.tsx` memiliki ukuran cover artwork desktop yang terlalu besar, mendorong slider durasi dan tombol aksi ke bawah viewport ponsel tanpa scroll container yang adaptif.

### C. Android WebView Media Restrictions
- Default Android WebView memberlakukan batasan ketat `mediaPlaybackRequiresUserGesture = true`. Ini menyebabkan pemutaran lagu berikutnya dalam queue (otomatis berpindah lagu) terblokir oleh Android karena dianggap tidak dipicu langsung oleh sentuhan pengguna.
- Mixed Content policy memblokir komunikasi dari WebView `https://localhost` ke endpoint lokal HTTP (`http://192.168.1.10:5188`).

---

## 3. Systematic Remediation Summary

1. **Infrastruktur Jaringan (`src/services/apiConfig.ts`):**  
   Dibuat modul konfigurasi API tersentralisasi dengan deteksi platform otomatis (`isNativeCapacitor`). Menghubungkan secara dinamis ke IP host jaringan lokal (`http://192.168.1.10:5188` secara default) atau server kustom pengguna. Melindungi seluruh request dengan `safeFetch` dan verifikasi `Content-Type: application/json`.
2. **Server Backend Bind (`server.cjs`):**  
   Mengubah listen address dari `127.0.0.1` ke `0.0.0.0`, membuka CORS lengkap termasuk `Content-Range`, `Accept-Ranges`, serta method `PUT, DELETE`.
3. **Penyelarasan Seluruh Service:**  
   `innertube.ts`, `roomService.ts`, `authService.ts`, `friendService.ts`, `playlistImportService.ts`, `downloadService.ts`, dan `App.tsx` seluruhnya dialihkan melalui `ApiConfig.resolveStreamUrl()` dan `ApiConfig.safeFetch()`.
4. **Mobile Navigation Overhaul (`BottomNav.tsx`):**  
   Menambahkan tab ke-5 *"Menu / Lainnya"* yang memunculkan Navigation Bottom Sheet lengkap dengan seluruh fitur sekunder: Teman, Audio Lab, Podcast, Room, Unduhan, Radio, Statistik, Pengaturan, Tentang, dan Mode Underwater.
5. **Adaptive UI & Safe Area Overhaul:**  
   Penyelarasan `TopHeader`, `BottomPlayer`, `BerandaView`, `PlayerModal`, dan `SettingsView` dengan safe area CSS `env(safe-area-inset-top)` dan `env(safe-area-inset-bottom)`.
6. **Native Android Enhancements (`MainActivity.java`):**  
   Menonaktifkan batasan user gesture untuk autoplaying audio dan mengizinkan mixed content mode.
