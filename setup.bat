@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20 or later is required. Install Node.js and reopen this window.
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo npm was not found. Reinstall Node.js with npm enabled.
  pause
  exit /b 1
)
if not exist .env.local copy .env.example .env.local >nul
echo Installing frontend dependencies...
npm install
if errorlevel 1 (
  echo Dependency installation failed. Check your internet connection and npm output.
  pause
  exit /b 1
)
echo.
echo Setup complete. Start the frontend with start.bat
pause
