"""
Servicio de búsqueda y descarga de YouTube
"""
import yt_dlp
import os
import re
from typing import List, Dict, Optional
from src.download_music import find_ffmpeg


def search_youtube(query: str, max_results: int = 5) -> List[Dict]:
    """
    Buscar videos en YouTube
    
    Args:
        query: Término de búsqueda
        max_results: Número máximo de resultados
        
    Returns:
        Lista de diccionarios con información de videos
    """
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            search_results = ydl.extract_info(f"ytsearch{max_results}:{query}", download=False)
            
            results = []
            for entry in search_results.get('entries', []):
                results.append({
                    'video_id': entry.get('id'),
                    'title': entry.get('title'),
                    'channel': entry.get('channel'),
                    'duration': entry.get('duration'),
                    'thumbnail': entry.get('thumbnail'),
                    'url': f"https://www.youtube.com/watch?v={entry.get('id')}"
                })
            
            return results
            
    except Exception as e:
        print(f"Error en búsqueda: {e}")
        return []


def sanitize_filename(filename: str) -> str:
    """
    Sanitizar nombre de archivo
    """
    # Eliminar caracteres no válidos
    filename = re.sub(r'[<>:"/\\|?*]', '', filename)
    # Reemplazar espacios múltiples
    filename = re.sub(r'\s+', ' ', filename)
    return filename.strip()


def download_audio(
    video_id: str,
    title: str,
    artist: Optional[str] = None,
    output_folder: str = "music"
) -> Optional[str]:
    """
    Descargar audio de YouTube
    
    Args:
        video_id: ID del video de YouTube
        title: Título del video
        artist: Nombre del artista (opcional)
        output_folder: Carpeta de salida
        
    Returns:
        Ruta del archivo descargado o None si falla
    """
    try:
        # Crear estructura de carpetas
        if artist:
            artist_folder = os.path.join(output_folder, sanitize_filename(artist))
            os.makedirs(artist_folder, exist_ok=True)
            output_path = artist_folder
        else:
            output_path = output_folder
            os.makedirs(output_path, exist_ok=True)
        
        # Sanitizar título
        safe_title = sanitize_filename(title)
        
        # Buscar FFmpeg
        ffmpeg_location = find_ffmpeg()
        
        # Configurar opciones de descarga
        ydl_opts = {
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'outtmpl': os.path.join(output_path, f'{safe_title}.%(ext)s'),
            'quiet': False,
            'no_warnings': False,
        }
        
        if ffmpeg_location:
            ydl_opts['ffmpeg_location'] = ffmpeg_location
        
        # Descargar
        url = f"https://www.youtube.com/watch?v={video_id}"
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        
        # Ruta del archivo resultante
        file_path = os.path.join(output_path, f"{safe_title}.mp3")
        
        if os.path.exists(file_path):
            print(f"✓ Audio descargado: {file_path}")
            return file_path
        else:
            print(f"✗ No se encontró el archivo: {file_path}")
            return None
            
    except Exception as e:
        print(f"Error al descargar: {e}")
        return None
