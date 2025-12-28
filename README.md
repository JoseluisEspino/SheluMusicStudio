# 🎵 SheluMusicStudio

**Aplicación web para descargar audio de YouTube y separarlo en pistas individuales con IA**

![Python](https://img.shields.io/badge/Python-3.11+-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)

## ✨ Características

- 🌐 **Interfaz Web Moderna**: Diseño responsivo con tema oscuro
- 🔍 **Búsqueda en YouTube**: Busca y visualiza resultados directamente
- 📥 **Descarga de Audio**: Convierte videos a MP3 de alta calidad
- 🎼 **Separación con IA**: Usa Demucs para separar en 6 pistas
  - Vocals (voz), Drums (batería), Bass (bajo)
  - Other (otros), Guitar (guitarra), Piano (piano)
- 👤 **Organización por Artista**: Clasifica automáticamente tu música
- 📊 **Biblioteca Musical**: Administra tu colección con estadísticas
- ⚡ **Procesamiento en Background**: Sin bloqueos en la interfaz
- 🎯 **API REST Completa**: Endpoints para integración

## 🚀 Inicio Rápido

### Prerrequisitos

- Python 3.11+ 
- FFmpeg instalado ([Descargar](https://ffmpeg.org/download.html))

### Instalación

1. **Clonar repositorio:**
```bash
git clone https://github.com/JoseluisEspino/SheluMusicStudio.git
cd SheluMusicStudio
```

2. **Crear y activar entorno virtual:**
```powershell
# Windows
python -m venv venv
.\venv\Scripts\Activate.ps1

# Linux/macOS
python3 -m venv venv
source venv/bin/activate
```

3. **Instalar dependencias:**
```bash
pip install -r requirements.txt
```

4. **Instalar FFmpeg (Windows con winget):**
```powershell
winget install Gyan.FFmpeg
```

## 🎮 Uso

### Iniciar Aplicación Web

```bash
# Activar entorno virtual
.\venv\Scripts\Activate.ps1  # Windows
# source venv/bin/activate   # Linux/Mac

# Iniciar servidor
python api/main.py
```

Abre tu navegador en: **http://localhost:8000**

### Funcionalidades Web

1. **🔍 Buscar**: Ingresa nombre de canción/artista
2. **📥 Descargar**: Selecciona resultado y especifica artista (opcional)
3. **🎵 Separar**: Elige modelo y separa en pistas
4. **📚 Biblioteca**: Administra tu colección organizada
5. **⚙️ Tareas**: Monitorea descargas y separaciones en tiempo real

### API REST

**Buscar en YouTube:**
```bash
POST /api/search
Body: { "query": "Måneskin", "max_results": 5 }
```

**Descargar Audio:**
```bash
POST /api/download
Body: { "video_id": "...", "title": "Song", "artist": "Artist" }
```

**Separar Audio:**
```bash
POST /api/separate
Body: { "file_path": "music/artist/song.mp3", "model": "htdemucs_6s" }
```

### CLI (Modo Consola)

También disponible el CLI interactivo:
```bash
python main.py
```

## 🏗️ Estructura del Proyecto

```
SheluMusicStudio/
├── api/
│   └── main.py              # FastAPI app
├── src/
│   ├── youtube_service.py   # Búsqueda y descarga
│   ├── separation_service.py # Separación con Demucs
│   ├── file_manager.py      # Gestión de biblioteca
│   ├── download_music.py    # Utilidades descarga
│   └── separate_audio.py    # Utilidades separación
├── static/
│   ├── index.html           # Frontend
│   ├── css/style.css
│   └── js/app.js
├── music/                   # MP3s descargados (por artista)
├── separated/               # Pistas separadas (por artista/canción)
└── requirements.txt
```

## 🎨 Modelos de Separación

| Modelo | Pistas | Calidad | Velocidad | Uso |
|--------|--------|---------|-----------|-----|
| **htdemucs_6s** | 6 | ⭐⭐⭐⭐ | Media | Recomendado |
| **htdemucs** | 4 | ⭐⭐⭐⭐ | Rápida | General |
| **htdemucs_ft** | 4 | ⭐⭐⭐⭐⭐ | Lenta | Alta calidad |
| **mdx_extra** | 4 | ⭐⭐⭐⭐⭐ | Muy lenta | Máxima calidad |

## 🗂️ Organización de Archivos

```
music/
├── Måneskin/
│   └── IL DONO DELLA VITA.mp3
└── AC_DC/
    └── Thunderstruck.mp3

separated/
├── Måneskin/
│   └── IL DONO DELLA VITA/
│       ├── vocals.mp3
│       ├── drums.mp3
│       ├── bass.mp3
│       ├── other.mp3
│       ├── guitar.mp3
│       └── piano.mp3
└── AC_DC/
    └── ...
```

## 🛠️ Solución de Problemas

**FFmpeg no encontrado**: Asegúrate de instalarlo y reiniciar la terminal

**Puerto en uso**: Cambia el puerto en `api/main.py`:
```python
uvicorn.run(app, host="0.0.0.0", port=8001)
```

**Separación lenta**: Usa GPU instalando PyTorch con CUDA

## 📦 Dependencias Principales

- fastapi 0.115.6 - Framework web
- uvicorn 0.34.0 - Servidor ASGI
- yt-dlp 2025.12.8 - Descarga YouTube
- demucs 4.0.1 - Separación IA
- torch 2.8.0 - Deep Learning
- torchaudio 2.8.0 - Audio processing

## 👨‍💻 Autor

**Jose Luis Espino** - [GitHub](https://github.com/JoseluisEspino)

## 🙏 Créditos

- [Demucs](https://github.com/facebookresearch/demucs) - Facebook Research
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - Descarga de YouTube
- [FastAPI](https://fastapi.tiangolo.com/) - Framework web

## 📄 Licencia

MIT License

---

⭐ **¿Te gusta? Dale una estrella en GitHub!**
