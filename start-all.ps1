# Quick starter for backend (FastAPI) and mobile (Expo)
# Usage: run from PowerShell:  .\start-all.ps1
# Notes:
# - Opens two PowerShell windows: one for backend, one for mobile.
# - Adjust PYTHON path if needed. Assumes uvicorn available in PATH/venv.
# - Mobile starts with Expo tunnel and cleared cache.

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$backendDir = Join-Path $projectRoot "backend"
$mobileDir  = Join-Path $projectRoot "mobile"

# Start backend
Start-Process powershell -ArgumentList "-NoLogo","-NoExit","-Command", "Set-Location $backendDir; uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

# Start mobile (Expo)
Start-Process powershell -ArgumentList "-NoLogo","-NoExit","-Command", "Set-Location $mobileDir; npm run start -- --tunnel --clear"
