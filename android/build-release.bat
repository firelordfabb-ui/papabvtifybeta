@echo off
title PAPABVTIFY Android Release Compiler
echo ========================================================
echo   PAPABVTIFY Android Release Build (APK & AAB)
echo   Target: com.papabvtify.music
echo ========================================================
echo.
if "%ANDROID_HOME%"=="" (
    echo [PERINGATAN] ANDROID_HOME belum diset pada environment Windows ini.
    echo Pastikan Android SDK / Android Studio sudah terpasang.
)
echo Menjalankan Gradle Release Build...
call gradlew.bat assembleRelease bundleRelease
echo.
echo ========================================================
echo Selesai! File output:
echo APK: app\build\outputs\apk\release\app-release-unsigned.apk
echo AAB: app\build\outputs\bundle\release\app-release.aab
echo ========================================================
pause
