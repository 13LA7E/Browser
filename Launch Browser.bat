@echo off
echo.
echo ========================================
echo   Electron Browser
echo ========================================
echo.
echo Starting browser...
echo.

cd /d "%~dp0"
start "" "release\Electron Browser-win32-x64\Electron Browser.exe"

echo.
echo Browser launched!
echo You can close this window.
echo.
pause
