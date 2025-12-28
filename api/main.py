"""
API REST para SheluMusicStudio
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import List, Optional
import os
import sys
import json
from datetime import datetime

# Añadir src al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.youtube_service import search_youtube, download_audio
from src.separation_service import separate_audio_task, get_separation_status
from src.file_manager import organize_by_artist, list_songs, get_separated_files

app = FastAPI(
    title="SheluMusicStudio API",
    description="API para descarga y separación de audio de YouTube",
    version="1.0.0"
)

# Montar directorio de archivos estáticos
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/music", StaticFiles(directory="music"), name="music")
app.mount("/separated", StaticFiles(directory="separated"), name="separated")


# Modelos de datos
class SearchRequest(BaseModel):
    query: str
    max_results: int = 5


class DownloadRequest(BaseModel):
    video_id: str
    title: str
    artist: Optional[str] = None


class SeparateRequest(BaseModel):
    file_path: str
    model: str = "htdemucs_6s"
    artist: Optional[str] = None


# Estado de tareas
tasks_status = {}


@app.get("/")
async def root():
    """Página principal"""
    return FileResponse("static/index.html")


@app.post("/api/search")
async def search_music(request: SearchRequest):
    """
    Buscar música en YouTube
    """
    try:
        results = search_youtube(request.query, max_results=request.max_results)
        return {"success": True, "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/download")
async def download_music(request: DownloadRequest, background_tasks: BackgroundTasks):
    """
    Descargar audio de YouTube
    """
    try:
        # Generar ID de tarea
        task_id = f"download_{request.video_id}_{datetime.now().timestamp()}"
        
        # Inicializar estado
        tasks_status[task_id] = {
            "status": "downloading",
            "progress": 0,
            "message": "Descargando audio..."
        }
        
        # Descargar en segundo plano
        file_path = download_audio(
            video_id=request.video_id,
            title=request.title,
            artist=request.artist
        )
        
        if file_path:
            tasks_status[task_id] = {
                "status": "completed",
                "progress": 100,
                "message": "Descarga completada",
                "file_path": file_path
            }
            return {
                "success": True,
                "task_id": task_id,
                "file_path": file_path
            }
        else:
            tasks_status[task_id] = {
                "status": "error",
                "message": "Error al descargar"
            }
            raise HTTPException(status_code=500, detail="Error al descargar el audio")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/separate")
async def separate_music(request: SeparateRequest, background_tasks: BackgroundTasks):
    """
    Separar audio en pistas
    """
    try:
        # Generar ID de tarea
        task_id = f"separate_{datetime.now().timestamp()}"
        
        # Inicializar estado
        tasks_status[task_id] = {
            "status": "processing",
            "progress": 0,
            "message": "Iniciando separación..."
        }
        
        # Ejecutar separación en segundo plano
        background_tasks.add_task(
            separate_audio_task,
            task_id=task_id,
            file_path=request.file_path,
            model=request.model,
            artist=request.artist,
            tasks_status=tasks_status
        )
        
        return {
            "success": True,
            "task_id": task_id,
            "message": "Separación iniciada"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/task/{task_id}")
async def get_task_status(task_id: str):
    """
    Obtener estado de una tarea
    """
    if task_id not in tasks_status:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    
    return tasks_status[task_id]


@app.get("/api/songs")
async def get_songs(artist: Optional[str] = None):
    """
    Listar canciones descargadas
    """
    try:
        songs = list_songs(artist=artist)
        return {"success": True, "songs": songs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/separated/{song_id}")
async def get_separated(song_id: str):
    """
    Obtener archivos separados de una canción
    """
    try:
        files = get_separated_files(song_id)
        return {"success": True, "files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/artists")
async def get_artists():
    """
    Listar artistas disponibles
    """
    try:
        music_dir = "music"
        if not os.path.exists(music_dir):
            return {"success": True, "artists": []}
        
        artists = [d for d in os.listdir(music_dir) 
                  if os.path.isdir(os.path.join(music_dir, d))]
        
        return {"success": True, "artists": sorted(artists)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
