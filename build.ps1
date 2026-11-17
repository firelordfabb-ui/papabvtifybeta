Set-Location "C:\Users\fabiangarfield\.gemini\antigravity\scratch\auralis-next"
"Starting build at $(Get-Date)..." | Out-File "build.log"
cmd /c "npm run build" *>> "build.log"
"Finished at $(Get-Date) with exit code $LASTEXITCODE" | Out-File -Append "build.log"
