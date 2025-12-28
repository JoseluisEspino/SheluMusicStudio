#!/bin/bash
# Script de inicio para Shelu Music Studio (Linux/Mac)

echo "🎵 Iniciando Shelu Music Studio..."

# Verificar entorno virtual
if [ ! -f "venv/bin/activate" ]; then
    echo "❌ Error: No se encontró el entorno virtual"
    echo "Ejecuta: python3 -m venv venv"
    exit 1
fi

# Activar entorno virtual
echo "Activando entorno virtual..."
source venv/bin/activate

# Verificar dependencias
echo "Verificando dependencias..."
if ! pip list | grep -q "fastapi"; then
    echo "⚠️  Instalando dependencias..."
    pip install -r requirements.txt
fi

# Crear directorios si no existen
echo "Creando directorios necesarios..."
mkdir -p music separated static/css static/js

echo ""
echo "✅ Configuración completa!"
echo ""
echo "🚀 Iniciando servidor FastAPI en http://localhost:8000"
echo ""
echo "Para detener el servidor, presiona Ctrl+C"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Iniciar servidor
python api/main.py
