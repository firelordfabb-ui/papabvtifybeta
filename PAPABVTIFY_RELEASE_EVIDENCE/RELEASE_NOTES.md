# PAPABVTIFY — OFFICIAL RELEASE NOTES
**Versi:** 2.0.0 Ultimate Final Release  
**Identitas:** Next-Generation Multiplatform Music Streaming & Audio DSP  
**Status Produksi:** Production Ready  

---

## 🌟 Ikhtisar Rilis

PAPABVTIFY versi 2.0.0 menghadirkan lompatan besar dari aplikasi web prototipe menjadi ekosistem pemutar musik multiplatform profesional yang kokoh, cepat, dan aman.

Rilis ini menggabungkan tema visual **Dreamy Fantasy** dengan aksen Ice Blue & Lavender yang artistik, tema malam **Aurora Borealis Dark Mode**, mesin audio DSP 10-band equalizer, karaoke lirik sinkron, antrean musik murni (kosong saat pertama dibuka), serta arsitektur backend berpengamanan tinggi.

---

## 📦 Hasil Kompilasi & Distribusi Multiplatform

### 1. Windows 10 & Windows 11
- **Setup Installer:** `PAPABVTIFY_RELEASE_EVIDENCE/Windows/PAPABVTIFY-Setup.exe` (126 MB)
  - Pemasangan lengkap ke Program Files, integrasi menu start, desktop shortcut, uninstaller bersih.
- **Portable Binary:** `PAPABVTIFY_RELEASE_EVIDENCE/Windows/PAPABVTIFY.exe` (114 MB)
  - Pemutar musik portabel instan, dapat langsung dijalankan tanpa proses instalasi.
- **Fitur Khusus Desktop:**
  - `backgroundThrottling: false` — Musik tidak akan tersendat saat diminimalkan.
  - Native Windows SMTC & Tray Bar integration.

### 2. Android
- **Proyek Native:** Terintegrasi di direktori `android/`.
- **Izin Lengkap:** Foreground Audio Service, Media Playback Notification, Bluetooth Audio, Wake Lock.
- **Kompilasi:** Siap di-build via `android/build-release.bat` atau `./gradlew assembleRelease bundleRelease` menjadi `PAPABVTIFY.apk` dan `PAPABVTIFY.aab`.

### 3. iOS
- **Proyek Native Xcode:** Terintegrasi di direktori `ios/App/`.
- **Konfigurasi Audio:** `UIBackgroundModes: ["audio"]` di `Info.plist` untuk pemutaran musik di latar belakang iOS & Safe Area handling.
- **Kompilasi:** Siap dibuka dengan Xcode di macOS via `open ios/App/App.xcworkspace` atau melalui `ios/build-ios.sh`.

---

## 🛡️ Keamanan & Kestabilan

1. **Eliminasi Total Layar Hitam (Black Screen):**
   - Mengatasi crash iterasi `stats.mostPlayed` di mesin rekomendasi.
   - Pemasangan `<ErrorBoundary>` di tingkat root dan modal.
2. **Kriptografi Kuat:**
   - Hashing password menggunakan scrypt dengan garam kriptografis acak 16-byte dan komparasi timing-safe.
3. **Perlindungan Brute-Force:**
   - Pembatasan maksimal 5 kali percobaan gagal login per alamat IP dalam 15 menit.
4. **Server-Side Host RBAC:**
   - Kontrol Listening Room dilindungi verifikasi identitas Host pada setiap request API.
5. **Autentikasi Google GIS Transparan:**
   - UI pelacakan status 5 langkah dari koneksi hingga verifikasi server token.

---

## 🚀 Panduan Menjalankan Cepat

### Di Lingkungan Desktop:
- Jalankan langsung `dist-electron/PAPABVTIFY.exe` atau pasang melalui `dist-electron/PAPABVTIFY-Setup.exe`.
- Atau jalankan `start-app.bat` untuk mode web app.

### Di Lingkungan Android Studio:
- Buka folder `android/` di Android Studio dan klik **Run**.

### Di Lingkungan macOS Xcode:
- Jalankan `open ios/App/App.xcworkspace` di macOS.
