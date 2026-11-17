@echo off
title PAPABVTIFY — Modern Editorial Music Experience
echo ========================================================
echo   PAPABVTIFY — Quality Overhaul Edition
echo   Ad-Free Streaming, Real Metadata, Synced Lyrics, World Radio
echo ========================================================
echo.

start "" npm.cmd run dev

echo Menunggu dev server aktif...
timeout /t 3 /nobreak > nul

REM Buka sebagai jendela aplikasi mandiri (PWA Desktop Window) menggunakan Microsoft Edge atau Chrome jika tersedia
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:5173 --window-size=1380,880
) else if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:5173 --window-size=1380,880
) else if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app=http://localhost:5173 --window-size=1380,880
) else (
    start http://localhost:5173
)

echo PAPABVTIFY siap dinikmati!
