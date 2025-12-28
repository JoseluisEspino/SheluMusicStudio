# 🚀 Guía de Desarrollo - Shelu Music Studio

## Inicio Rápido

### Windows (PowerShell)
```powershell
.\start.ps1
```

### Linux/Mac
```bash
chmod +x start.sh
./start.sh
```

## Arquitectura

### Backend (FastAPI)
- **api/main.py**: Aplicación FastAPI principal
  - Endpoints REST para búsqueda, descarga y separación
  - Servicio de archivos estáticos
  - Manejo de tareas en background

- **src/youtube_service.py**: 
  - `search_youtube()`: Búsqueda en YouTube
  - `download_audio()`: Descarga y conversión a MP3

- **src/separation_service.py**:
  - `separate_audio_task()`: Separación con Demucs en background
  - `separate_audio()`: Ejecución de Demucs
  - `organize_separated_files()`: Organización por artista

- **src/file_manager.py**:
  - `list_songs()`: Listar canciones descargadas
  - `get_separated_files()`: Obtener pistas separadas
  - `get_library_stats()`: Estadísticas de la biblioteca

### Frontend (Vanilla JS)
- **static/index.html**: Estructura HTML con tabs
- **static/css/style.css**: Estilos con tema oscuro
- **static/js/app.js**: Lógica del cliente
  - Búsqueda y resultados
  - Descarga con modal de separación
  - Biblioteca con filtros
  - Polling de tareas

## API Endpoints

### POST /api/search
Buscar videos en YouTube
```json
Request: {
  "query": "nombre de canción",
  "max_results": 10
}

Response: {
  "success": true,
  "results": [
    {
      "video_id": "...",
      "title": "...",
      "channel": "...",
      "duration": 180,
      "thumbnail": "...",
      "url": "..."
    }
  ]
}
```

### POST /api/download
Descargar audio de YouTube
```json
Request: {
  "video_id": "dQw4w9WgXcQ",
  "title": "Never Gonna Give You Up",
  "artist": "Rick Astley"  // opcional
}

Response: {
  "success": true,
  "task_id": "download_...",
  "file_path": "music/Rick Astley/Never Gonna Give You Up.mp3"
}
```

### POST /api/separate
Separar audio en pistas
```json
Request: {
  "file_path": "music/artist/song.mp3",
  "model": "htdemucs_6s",
  "artist": "Artist Name"  // opcional
}

Response: {
  "success": true,
  "task_id": "separate_...",
  "message": "Separación iniciada"
}
```

### GET /api/task/{task_id}
Obtener estado de una tarea
```json
Response: {
  "status": "processing",  // downloading, processing, completed, error
  "progress": 45,
  "message": "Separando audio...",
  "output_dir": "separated/artist/song/"  // cuando está completed
}
```

### GET /api/songs?artist={artist}
Listar canciones (filtro opcional por artista)
```json
Response: {
  "success": true,
  "songs": [
    {
      "id": "song_name",
      "title": "Song Title",
      "artist": "Artist",
      "file_path": "music/Artist/Song.mp3",
      "size": 5242880
    }
  ]
}
```

### GET /api/artists
Listar todos los artistas
```json
Response: {
  "success": true,
  "artists": ["AC/DC", "Måneskin", "Queen"]
}
```

### GET /api/separated/{song_id}
Obtener archivos separados de una canción
```json
Response: {
  "success": true,
  "files": {
    "song_id": "song_name",
    "output_dir": "separated/artist/song/",
    "stems": {
      "vocals": "path/vocals.mp3",
      "drums": "path/drums.mp3",
      "bass": "path/bass.mp3",
      "other": "path/other.mp3",
      "guitar": "path/guitar.mp3",
      "piano": "path/piano.mp3"
    }
  }
}
```

## Flujo de Trabajo

### 1. Búsqueda
```
Usuario → Frontend → POST /api/search → YouTube API → Resultados
```

### 2. Descarga
```
Usuario selecciona resultado → POST /api/download
  → yt-dlp descarga video
  → FFmpeg convierte a MP3
  → Archivo guardado en music/{artist}/
  → Response con file_path
```

### 3. Separación (Background)
```
Usuario solicita separación → POST /api/separate
  → Tarea en background
  → Demucs procesa audio
  → Stems guardados en separated/{artist}/{song}/
  → Estado actualizable via GET /api/task/{id}
```

### 4. Biblioteca
```
GET /api/songs → Lista de MP3s descargados
GET /api/separated/{song_id} → Stems disponibles
```

## Modelos Demucs

### htdemucs_6s (Recomendado)
- 6 pistas: vocals, drums, bass, other, guitar, piano
- Mejor para música con múltiples instrumentos
- Tiempo: ~2-4 min por canción de 3 min (CPU)

### htdemucs
- 4 pistas: vocals, drums, bass, other
- Más rápido que 6s
- Buena calidad general

### htdemucs_ft
- 4 pistas fine-tuned
- Mayor calidad que htdemucs estándar
- ~4x más lento

### mdx_extra
- Variable stems
- Máxima calidad
- Muy lento

## Estructura de Datos

### Organización por Artista
```
music/
├── Måneskin/
│   ├── IL DONO DELLA VITA.mp3
│   └── I WANNA BE YOUR SLAVE.mp3
└── Queen/
    └── Bohemian Rhapsody.mp3

separated/
├── Måneskin/
│   ├── IL DONO DELLA VITA/
│   │   ├── vocals.mp3
│   │   ├── drums.mp3
│   │   ├── bass.mp3
│   │   ├── other.mp3
│   │   ├── guitar.mp3
│   │   └── piano.mp3
│   └── I WANNA BE YOUR SLAVE/
│       └── [6 stems]
└── Queen/
    └── Bohemian Rhapsody/
        └── [6 stems]
```

## Desarrollo

### Añadir un nuevo endpoint

1. Edita `api/main.py`:
```python
@app.get("/api/nuevo-endpoint")
async def nuevo_endpoint():
    return {"success": True, "data": "..."}
```

2. Actualiza `static/js/app.js`:
```javascript
async function llamarNuevoEndpoint() {
    const response = await fetch(`${API_URL}/nuevo-endpoint`);
    const data = await response.json();
    // procesar data
}
```

### Añadir un nuevo modelo de Demucs

Edita `static/index.html` en el select de modelos:
```html
<option value="nuevo_modelo">Nuevo Modelo - Descripción</option>
```

### Debugging

**Ver logs del servidor:**
Los logs aparecen en la terminal donde ejecutaste `start.ps1`

**Debugging frontend:**
Abre DevTools del navegador (F12) → Console tab

**Ver estado de tareas:**
```javascript
// En DevTools Console
console.log(currentTasks);
```

## Testing

### Probar API con curl

**Búsqueda:**
```bash
curl -X POST http://localhost:8000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Måneskin", "max_results": 5}'
```

**Descargar:**
```bash
curl -X POST http://localhost:8000/api/download \
  -H "Content-Type: application/json" \
  -d '{"video_id": "...", "title": "Song", "artist": "Artist"}'
```

### Probar separación

1. Descarga un MP3 manualmente en `music/test/`
2. Llama al endpoint:
```bash
curl -X POST http://localhost:8000/api/separate \
  -H "Content-Type: application/json" \
  -d '{"file_path": "music/test/song.mp3", "model": "htdemucs_6s"}'
```

## Performance

### Optimizaciones
- **CPU**: Por defecto usa CPU para Demucs
- **GPU**: Instala PyTorch con CUDA y cambia `device="cuda"` en `separation_service.py`
- **Caché**: Los modelos de Demucs se cachean en `~/.cache/torch/hub/`

### Tiempo de Separación (CPU Intel i7)
- htdemucs_6s: ~3 min por canción de 3 min
- htdemucs: ~2 min
- htdemucs_ft: ~8 min
- mdx_extra: ~10+ min

### Con GPU (NVIDIA RTX)
- htdemucs_6s: ~30 seg
- htdemucs: ~20 seg

## Solución de Problemas

### Error: "FFmpeg not found"
```powershell
winget install Gyan.FFmpeg
# Reiniciar terminal
```

### Error: "Port 8000 already in use"
Edita `api/main.py`:
```python
uvicorn.run(app, host="0.0.0.0", port=8001)
```

### Error: "Module not found"
```bash
pip install -r requirements.txt
```

### Separación muy lenta
1. Verifica que no estés usando `mdx_extra` (es el más lento)
2. Usa `htdemucs` para mayor velocidad
3. Considera usar GPU (CUDA)

## Contribuir

1. Fork del repositorio
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m "Añadir nueva funcionalidad"`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Pull Request en GitHub

## Recursos

- [Documentación FastAPI](https://fastapi.tiangolo.com/)
- [Demucs GitHub](https://github.com/facebookresearch/demucs)
- [yt-dlp Documentación](https://github.com/yt-dlp/yt-dlp)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)

---

**Happy Coding! 🎵**
