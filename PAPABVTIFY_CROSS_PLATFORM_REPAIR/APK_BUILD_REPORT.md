# PAPABVTIFY — APK Build & Production Packaging Report

**Auditor:** Senior Android Release & DevOps Engineer  
**Scope:** Gradle Configuration, Android SDK/NDK, GitHub Actions Workflow, Release Signing, Proguard/R8  

---

## 1. Build Environment & Toolchain

- **Target OS:** Android 8.0 (Oreo / API 26) hingga Android 14+ (API 34)
- **Compile SDK:** 34
- **Target SDK:** 34
- **Min SDK:** 23
- **Capacitor Version:** 8.6.0
- **Node.js LTS:** 22.x
- **Java Toolchain:** OpenJDK 21 (Temurin / Eclipse Adoptium)
- **Gradle Version:** Gradle 8.2+
- **Build Types:** `debug` (untuk pengujian instan) & `release` (keperluan produksi)

---

## 2. Issues Encountered in CI/CD & Fixes

1. **Node.js Version Incompatibility:**
   - *Error:* `The Capacitor CLI requires NodeJS >= 22.0.0`
   - *Fix:* Memperbarui GitHub Actions workflow (`.github/workflows/build-apk.yml`) untuk menyetel `actions/setup-node@v4` dengan `node-version: 22`.
2. **Android SDK Manager Tooling:**
   - *Error:* `Warning: Failed to find package 'tools' / sdkmanager failed`
   - *Fix:* Menghapus pemanggilan manual `tools` usang dan mengandalkan instalasi default cmdline-tools bawaan runner `ubuntu-latest`.
3. **Java 21 Source Release Mismatch:**
   - *Error:* `:capacitor-android:compileDebugJavaWithJavac FAILED: invalid source release: 21`
   - *Fix:* Menyetel `actions/setup-java@v4` dengan `java-version: '21'` dan `distribution: 'temurin'`.

---

## 3. GitHub Actions Pipeline Specification

Workflow CI/CD di `.github/workflows/build-apk.yml`:
```yaml
name: Build Android APK
on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build-apk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - name: Install Dependencies
        run: npm ci
      - name: Build Web Application
        run: npm run build
      - name: Setup Java 21
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '21'
      - name: Setup Android SDK
        uses: android-actions/setup-android@v3
      - name: Sync Capacitor Android
        run: npx cap sync android
      - name: Build Android APK
        working-directory: android
        run: ./gradlew assembleDebug --stacktrace
      - name: Upload APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: PAPABVTIFY-debug-apk
          path: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 4. Local Build Artifact Verification

- Web distribution artifacts (`dist/`) berhasil di-bundle dan disinkronkan ke direktori Android platform:
  `android/app/src/main/assets/public/`
- Manifest permissions, WebSettings, dan ClearText traffic telah tervalidasi.
- Berkas APK dapat langsung dibangun melalui `./gradlew assembleDebug` atau melalui GitHub Actions runner dengan hasil output berkas:
  `app-debug.apk` / `PAPABVTIFY.apk`
