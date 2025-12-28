# Script de inicio para Shelu Music Studio
Write-Host "🎵 Iniciando Shelu Music Studio..." -ForegroundColor Cyan

# Verificar entorno virtual
if (!(Test-Path ".\venv\Scripts\Activate.ps1")) {
    Write-Host "❌ Error: No se encontró el entorno virtual" -ForegroundColor Red
    Write-Host "Ejecuta: python -m venv venv" -ForegroundColor Yellow
    exit 1
}

# Activar entorno virtual
Write-Host "Activando entorno virtual..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

# Verificar dependencias
Write-Host "Verificando dependencias..." -ForegroundColor Yellow
$packages = pip list --format=freeze
if ($packages -notmatch "fastapi") {
    Write-Host "⚠️  Instalando dependencias..." -ForegroundColor Yellow
    pip install -r requirements.txt
}

# Crear directorios si no existen
Write-Host "Creando directorios necesarios..." -ForegroundColor Yellow
if (!(Test-Path "music")) { New-Item -ItemType Directory -Path "music" | Out-Null }
if (!(Test-Path "separated")) { New-Item -ItemType Directory -Path "separated" | Out-Null }
if (!(Test-Path "static\css")) { New-Item -ItemType Directory -Path "static\css" -Force | Out-Null }
if (!(Test-Path "static\js")) { New-Item -ItemType Directory -Path "static\js" -Force | Out-Null }

Write-Host ""
Write-Host "✅ Configuración completa!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Iniciando servidor FastAPI en http://localhost:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para detener el servidor, presiona Ctrl+C" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

# Iniciar servidor
python api/main.py
