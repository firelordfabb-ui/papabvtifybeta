# PAPABVTIFY — Audio Playback Pipeline & Background Service Report

**Auditor:** Senior Audio Systems & Media Streaming Engineer  
**Scope:** Web Audio API, DSP Node Graph, MediaSession API, HTTP 206 Streaming, Background Execution, Audio Focus  

---

## 1. Problem Statement & Audio Failure Analysis

Pada APK Android awal, pengguna menekan tombol Play pada lagu apa pun, namun:
1. Tidak ada suara sama sekali.
2. Indikator scrubber waktu berhenti di 0:00 atau melompat tak terduga.
3. Saat layar HP dimatikan atau aplikasi diminimalkan, pemutar langsung berhenti.
4. Mode DSP (Slowed + Reverb, Underwater) tidak merespons.

**Penyebab Inti:**
1. **URL Target Resolusi HTML:** Audio tag `<audio src="/api/stream?id=...">` dimuat dari `https://localhost/api/stream...`. Karena Capacitor tidak memiliki endpoint backend Express lokal di port internal, WebView me-return berkas `index.html`. Tag HTML5 Audio tidak dapat mendekode HTML sebagai audio stream, sehingga langsung melempar event `MediaError` (code 4: `MEDIA_ERR_SRC_NOT_SUPPORTED`).
2. **Android WebView Gesture Lock:** Android memblokir pemutaran otomatis (`autoplay`) tanpa interaksi sentuhan langsung pengguna pada setiap track baru.
3. **Ketiadaan Konfigurasi MediaSession Penuh:** Sistem operasi Android tidak mengenali sesi pemutaran media latar belakang tanpa metadata MediaSession dan deklarasi service foreground yang tepat.

---

## 2. Engineering Architecture & Solutions

### A. Centralized Stream Resolver (`ApiConfig.resolveStreamUrl`)
Setiap stream URL kini diverifikasi dan diselesaikan melalui `src/services/apiConfig.ts`:
```typescript
export function resolveStreamUrl(streamUrlOrId: string): string {
  if (!streamUrlOrId) return '';
  if (streamUrlOrId.startsWith('blob:') || streamUrlOrId.startsWith('data:') || streamUrlOrId.startsWith('http://') || streamUrlOrId.startsWith('https://')) {
    return streamUrlOrId;
  }
  const cleanId = streamUrlOrId.replace(/^\/api\/stream\?id=/, '');
  const baseUrl = getServerBaseUrl();
  return `${baseUrl}/api/stream?id=${encodeURIComponent(cleanId)}`;
}
```
Hasil: Pada Android APK, URL diselesaikan menjadi `http://192.168.1.10:5188/api/stream?id=...` yang terhubung langsung ke backend server Node.js.

### B. HTTP 206 Byte-Range Streaming (`server.cjs`)
Server Express dikonfigurasi dengan:
- `Accept-Ranges: bytes`
- `Content-Range: bytes START-END/TOTAL`
- `Access-Control-Expose-Headers: Content-Range, Content-Length, Accept-Ranges`
Hal ini memungkinkan pemutar audio Android melakukan *scrubbing* (seek ke detik berapa pun di tengah lagu) tanpa perlu mengunduh keseluruhan berkas audio terlebih dahulu.

### C. Web Audio API Graph & DSP Underwater Effect
Graph audio PAPABVTIFY dikonfigurasi sebagai rantai pemrosesan modular:
```
[HTMLAudioElement]
        ↓
[MediaElementAudioSourceNode]
        ↓
[Underwater Lowpass BiquadFilter (450Hz, Q=3.5)]
        ↓
[3-Band Parametric Equalizer (Bass / Mid / Treble)]
        ↓
[ConvolverNode (Impulse Reverb) + Slowed Resampling (0.85x)]
        ↓
[Spatial 8D Stereo Panner Node]
        ↓
[Master Gain Node]
        ↓
[AudioDestinationNode (Hardware Output / Speaker / Headphone)]
```
- **Underwater / Muffled Effect:** Menggunakan filter lowpass orde tinggi pada frekuensi potong 450Hz dengan resonansi Q 3.5 dipadukan dengan wet reverb. Menghasilkan efek suara teredam realistis layaknya mendengar musik dari bawah air, dan dapat dikombinasikan dengan Slowed + Reverb secara harmonis.

### D. Background Playback & Notification Controls (`navigator.mediaSession`)
Diimplementasikan pada `src/App.tsx`:
- Mengirimkan metadata lengkap ke sistem operasi Android (`title`, `artist`, `album`, `artwork`).
- Mendaftarkan action handler:
  - `play` / `pause`
  - `previoustrack` / `nexttrack`
  - `seekto` (menyetel posisi scrubber langsung dari lockscreen)
- Memperbarui `navigator.mediaSession.setPositionState()` setiap kali event `timeupdate` terpicu.
- Pada `AndroidManifest.xml`, dideklarasikan permission:
  - `FOREGROUND_SERVICE`
  - `FOREGROUND_SERVICE_MEDIA_PLAYBACK`
  - `WAKE_LOCK`
- Pada `MainActivity.java`, disetel `settings.setMediaPlaybackRequiresUserGesture(false)` sehingga pergantian lagu berikutnya dalam playlist berjalan otomatis di latar belakang tanpa terhenti.

---

## 3. Hasil Validasi Pemutaran Audio

| Kasus Uji | Tindakan | Hasil yang Diharapkan | Status |
| :--- | :--- | :--- | :---: |
| Play Lagu Online | Tekan Play lagu dari Search / Beranda | Suara jernih keluar dari speaker/headphone | ✅ Lulus |
| Scrubber Seek | Geser posisi ke menit 02:15 | Audio melompat seketika via HTTP 206 stream | ✅ Lulus |
| Auto-Next Track | Tunggu lagu selesai hingga akhir | Lagu berikutnya dalam queue langsung terputar | ✅ Lulus |
| Background Playback | Kunci layar HP / Pindah ke aplikasi lain | Musik tetap berjalan tanpa terhenti | ✅ Lulus |
| Lockscreen Controls | Tekan Pause / Next di lockscreen Android | Pemutar merespons sesuai perintah | ✅ Lulus |
| Efek Underwater | Aktifkan Underwater DSP | Suara teredam realistis (lowpass 450Hz aktif) | ✅ Lulus |
| Mode Offline | Putar lagu dari tab Unduhan tanpa internet | Audio terputar langsung dari IndexedDB blob | ✅ Lulus |
