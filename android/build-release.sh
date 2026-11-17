#!/usr/bin/env bash
set -e
echo "========================================================"
echo "  PAPABVTIFY Android Release Build (APK & AAB)"
echo "  Target: com.papabvtify.music"
echo "========================================================"

if [ -z "$ANDROID_HOME" ]; then
    echo "[PERINGATAN] ANDROID_HOME belum diset."
fi

chmod +x ./gradlew
./gradlew assembleRelease bundleRelease

echo "========================================================"
echo "Selesai! Output:"
echo "APK: app/build/outputs/apk/release/app-release-unsigned.apk"
echo "AAB: app/build/outputs/bundle/release/app-release.aab"
echo "========================================================"
