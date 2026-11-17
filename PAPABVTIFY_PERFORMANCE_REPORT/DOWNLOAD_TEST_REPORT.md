# PAPABVTIFY — DOWNLOAD & OFFLINE PLAYBACK TEST REPORT

## 1. Arsitektur Alur Unduhan
Fitur unduhan musik offline pada PAPABVTIFY dibangun dengan alur yang transparan, jujur, dan patuh terhadap ketentuan perizinan sumber musik.

```
[Tombol Download di UI]
        │
        ▼
[Validasi Status & Hak Akses]
        │
  ┌─────┴─────────────────────────────────┐
  ▼                                       ▼
[Tersedia & Legal]               [Dilindungi Hak Cipta / DRM]
  │                                       │
  ▼                                       ▼
[ReadableStream Chunks via Fetch]    [Notifikasi Transparan]
  │                                   "Sumber streaming dilindungi"
  ▼                                   (Tidak membuat download palsu)
[Real Progress (Bytes / Total)]
  │
  ▼
[Penyimpanan Audio Blob ke IndexedDB]
  │
  ▼
[Registrasi ke StorageService (MB & Timestamp)]
  │
  ▼
[Offline Playback via URL.createObjectURL(blob)]
```

---

## 2. Pengujian Skenario & Hasil Verifikasi

### Skenario 1: Verifikasi Tombol & Status Visual (UI Feedback)
* **Kondisi:** Menekan tombol unduh pada `BottomPlayer` dan `PlayerModal`.
* **Hasil:**
  - Tombol tidak lagi pasif / "pajangan".
  - Saat proses unduh aktif: ikon berubah menjadi spinner `Loader2` yang berputar dan tombol di-disable sementara untuk mencegah request duplikat.
  - Saat unduhan selesai: ikon berubah menjadi centang hijau `CheckCircle2` ("Tersimpan Offline").
  - Toast notifikasi realtime muncul di sudut kanan bawah menginformasikan status unduhan.

### Skenario 2: Perhitungan Progress Nyata (Real Byte Chunking)
* **Kondisi:** Mengunduh berkas audio streaming melalui endpoint backend.
* **Hasil:**
  - Progress dihitung langsung berdasarkan rasio `loadedBytes / totalBytes` dari `ReadableStream.getReader()`.
  - `UnduhanView` menampilkan persentase progress dan progress bar gradien yang bergerak sesuai data nyata.
  - Tidak ada manipulasi progress atau "status selesai" prematur sebelum Blob tersimpan utuh di IndexedDB.

### Skenario 3: Penanganan Batal & Coba Lagi (Cancel & Retry)
* **Kondisi:** Menekan tombol batalkan (`XCircle`) di tab antrean unduhan.
* **Hasil:**
  - `AbortController.abort()` segera memutus koneksi streaming jaringan.
  - Chunk parsial dibersihkan dari memori dan antrean unduhan di-update menjadi batal tanpa meninggalkan file korup di IndexedDB.
  - Tombol coba lagi (`RotateCcw`) memicu request baru secara bersih.

### Skenario 4: Pemutaran Offline Tanpa Internet (Offline Playback)
* **Kondisi:** Menjalankan aplikasi dalam kondisi simulasi offline dan memutar lagu yang telah tersimpan di IndexedDB.
* **Hasil:**
  - `DownloadService.getOfflineAudioUrl(song.id)` mengambil Blob dari object store `offline_tracks`.
  - Membuat Blob URL lokal yang langsung disematkan ke `<audio>.src`.
  - Lagu diputar secara instan dengan kualitas audio asli tanpa memerlukan koneksi internet.

### Skenario 5: Penanganan Sumber Terlindungi (Licensing & Error Transparency)
* **Kondisi:** Menguji unduhan pada track yang dibatasi oleh proteksi streaming pihak ketiga.
* **Hasil:**
  - Sistem tidak membuat berkas audio dummy atau progress palsu.
  - Mengembalikan pesan error yang jelas dan transparan: *"Sumber streaming dilindungi hak cipta atau tidak mengizinkan pengunduhan langsung."*
