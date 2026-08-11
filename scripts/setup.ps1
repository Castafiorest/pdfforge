# PDFForge — Windows development setup (PowerShell).
# Creates the backend venv, installs deps, and starts API + worker + web.
# Usage:  powershell -ExecutionPolicy Bypass -File scripts\setup.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Api = Join-Path $Root "apps\api"

Write-Host "→ Setting up backend venv…"
if (-not (Test-Path (Join-Path $Api ".venv"))) {
    python -m venv (Join-Path $Api ".venv")
}
$Py = Join-Path $Api ".venv\Scripts\python.exe"
& $Py -m pip install -q -r (Join-Path $Api "requirements-dev.txt")

Write-Host "→ Installing frontend deps…"
if (-not (Test-Path (Join-Path $Root "node_modules"))) {
    Push-Location $Root
    npm install
    Pop-Location
}

Write-Host "→ Starting API, worker and web…"
$env:TEMP_DIR = Join-Path $Root ".tmp"
$env:DATABASE_URL = "sqlite:///$(Join-Path $Api 'data\pdfforge.db')"
New-Item -ItemType Directory -Force -Path (Join-Path $Api "data") | Out-Null
New-Item -ItemType Directory -Force -Path $env:TEMP_DIR | Out-Null

Push-Location $Api
Start-Process -FilePath $Py -ArgumentList "-m", "uvicorn", "app.main:app", "--port", "8000" -WindowStyle Minimized
Start-Process -FilePath $Py -ArgumentList "-m", "app.workers.worker" -WindowStyle Minimized
Pop-Location

Push-Location $Root
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Minimized
Pop-Location

Write-Host "✓ API on http://localhost:8000 · Web on http://localhost:5173"
