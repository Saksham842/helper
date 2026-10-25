@echo off
title Parakeet AI Copilot Launcher
echo ===================================================
echo     Starting Parakeet AI Production Stack
echo ===================================================

echo [1/2] Starting Next.js Web Platform (http://localhost:3000)...
start "Parakeet Web Platform" cmd /c "pnpm --filter @parakeet/web start"

echo [2/2] Launching SystemAudioHelper Desktop Stealth HUD...
if exist "apps\desktop\release\win-unpacked\SystemAudioHelper.exe" (
    start "" "apps\desktop\release\win-unpacked\SystemAudioHelper.exe"
) else (
    echo [Notice] Pre-packaged binary not found. Launching via dev runner...
    start "Parakeet Desktop HUD" cmd /c "pnpm --filter @parakeet/desktop dev"
)

echo.
echo Parakeet AI is running.
echo Web Dashboard: http://localhost:3000/dashboard
echo HUD Toggle Hotkey: Ctrl+Shift+V
echo ===================================================
