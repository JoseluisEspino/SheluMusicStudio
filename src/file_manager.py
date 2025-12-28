"""
Gestor de archivos y organización por artista
"""
import os
from typing import List, Dict, Optional
import json


def list_songs(artist: Optional[str] = None) -> List[Dict]:
    """
    Listar canciones descargadas
    
    Args:
        artist: Filtrar por artista (opcional)
        
    Returns:
        Lista de canciones con metadata
    """
    songs = []
    music_dir = "music"
    
    if not os.path.exists(music_dir):
        return songs
    
    if artist:
        # Listar canciones de un artista específico
        artist_dir = os.path.join(music_dir, artist)
        if os.path.exists(artist_dir):
            for file in os.listdir(artist_dir):
                if file.endswith('.mp3'):
                    file_path = os.path.join(artist_dir, file)
                    songs.append({
                        'id': os.path.splitext(file)[0],
                        'title': os.path.splitext(file)[0],
                        'artist': artist,
                        'file_path': file_path,
                        'size': os.path.getsize(file_path)
                    })
    else:
        # Listar todas las canciones
        for root, dirs, files in os.walk(music_dir):
            for file in files:
                if file.endswith('.mp3'):
                    file_path = os.path.join(root, file)
                    # Obtener artista de la estructura de carpetas
                    rel_path = os.path.relpath(root, music_dir)
                    artist_name = rel_path if rel_path != '.' else 'Unknown'
                    
                    songs.append({
                        'id': os.path.splitext(file)[0],
                        'title': os.path.splitext(file)[0],
                        'artist': artist_name,
                        'file_path': file_path,
                        'size': os.path.getsize(file_path)
                    })
    
    return sorted(songs, key=lambda x: (x['artist'], x['title']))


def get_separated_files(song_id: str) -> Dict:
    """
    Obtener archivos separados de una canción
    
    Args:
        song_id: ID de la canción
        
    Returns:
        Diccionario con rutas de stems
    """
    separated_dir = "separated"
    
    if not os.path.exists(separated_dir):
        return {}
    
    # Buscar en toda la estructura separated/
    for root, dirs, files in os.walk(separated_dir):
        if song_id in root:
            stems = {}
            for file in files:
                if file.endswith('.mp3'):
                    stem_name = os.path.splitext(file)[0]
                    stems[stem_name] = os.path.join(root, file)
            
            if stems:
                return {
                    'song_id': song_id,
                    'output_dir': root,
                    'stems': stems
                }
    
    return {}


def organize_by_artist(file_path: str, artist: str) -> str:
    """
    Organizar archivo por artista
    
    Args:
        file_path: Ruta del archivo
        artist: Nombre del artista
        
    Returns:
        Nueva ruta del archivo
    """
    import shutil
    
    music_dir = "music"
    artist_dir = os.path.join(music_dir, artist)
    os.makedirs(artist_dir, exist_ok=True)
    
    filename = os.path.basename(file_path)
    new_path = os.path.join(artist_dir, filename)
    
    # Mover archivo
    if file_path != new_path:
        shutil.move(file_path, new_path)
        print(f"✓ Archivo movido a: {new_path}")
    
    return new_path


def get_library_stats() -> Dict:
    """
    Obtener estadísticas de la biblioteca
    
    Returns:
        Diccionario con estadísticas
    """
    music_dir = "music"
    separated_dir = "separated"
    
    stats = {
        'total_songs': 0,
        'total_artists': 0,
        'total_separated': 0,
        'total_size_mb': 0
    }
    
    # Contar canciones y artistas
    if os.path.exists(music_dir):
        artists = set()
        for root, dirs, files in os.walk(music_dir):
            for file in files:
                if file.endswith('.mp3'):
                    stats['total_songs'] += 1
                    file_path = os.path.join(root, file)
                    stats['total_size_mb'] += os.path.getsize(file_path) / (1024 * 1024)
                    
                    # Obtener artista
                    rel_path = os.path.relpath(root, music_dir)
                    if rel_path != '.':
                        artists.add(rel_path)
        
        stats['total_artists'] = len(artists)
    
    # Contar separaciones
    if os.path.exists(separated_dir):
        for root, dirs, files in os.walk(separated_dir):
            if any(f.endswith('.mp3') for f in files):
                stats['total_separated'] += 1
    
    stats['total_size_mb'] = round(stats['total_size_mb'], 2)
    
    return stats
