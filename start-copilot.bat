@echo off
title GhostPilot Copilot Launcher
echo ===================================================
echo     Starting GhostPilot Production Stack
echo ===================================================

echo [1/2] Starting Next.js Web Platform (http://localhost:3000)...
start "GhostPilot Web Platform" cmd /c "pnpm --filter @ghostpilot/web start"

echo [2/2] Launching SystemAudioHelper Desktop Stealth HUD...
if exist "apps\desktop\release\win-unpacked\SystemAudioHelper.exe" (
    start "" "apps\desktop\release\win-unpacked\SystemAudioHelper.exe"
) else (
    echo [Notice] Pre-packaged binary not found. Launching via dev runner...
    start "GhostPilot Desktop HUD" cmd /c "pnpm --filter @ghostpilot/desktop dev"
)

echo.
echo GhostPilot is running.
echo Web Dashboard: http://localhost:3000/dashboard
echo HUD Toggle Hotkey: Ctrl+Shift+V
echo ===================================================
