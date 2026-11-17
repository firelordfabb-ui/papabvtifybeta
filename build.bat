@echo off
cd /d "C:\Users\fabiangarfield\.gemini\antigravity\scratch\auralis-next"
echo Starting build at %TIME% > build.log
call npm.cmd run build >> build.log 2>&1
echo Finished build at %TIME% with code %ERRORLEVEL% >> build.log
