@echo off
setlocal
cd /d "%~dp0"
if not exist node_modules (
  echo Dependencies are missing. Run setup.bat first.
  pause
  exit /b 1
)
npm run dev
