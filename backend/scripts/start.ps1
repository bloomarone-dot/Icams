# Demarrage complet ICAMS (Windows PowerShell)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

Write-Host "=== Docker PostgreSQL ===" -ForegroundColor Cyan
Set-Location $Root
docker compose up -d
Start-Sleep -Seconds 8

Write-Host "=== Migrations ===" -ForegroundColor Cyan
Set-Location "$Root\backend"
& .\.venv\Scripts\python.exe -m alembic upgrade head

Write-Host "=== Verification ===" -ForegroundColor Cyan
& .\.venv\Scripts\python.exe scripts\verify.py --skip-api

Write-Host "=== Backend (Ctrl+C pour arreter) ===" -ForegroundColor Cyan
& .\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
