"""
Módulo para descargar música desde YouTube
"""
import os
import glob
import yt_dlp


def find_ffmpeg():
    """Encuentra la ubicación de FFmpeg instalado por winget"""
    ffmpeg_pattern = r'C:\Users\*\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg*\*\bin'
    ffmpeg_paths = glob.glob(ffmpeg_pattern)
    if ffmpeg_paths:
        return ffmpeg_paths[0]
    return None


def download_audio_from_youtube(search_query, output_folder='music'):
    """
    Busca un video en YouTube y descarga solo el audio en formato MP3.
    
    Args:
        search_query (str): Cadena de texto para buscar en YouTube
        output_folder (str): Carpeta donde guardar el audio
        
    Returns:
        str: Ruta del archivo descargado o None si hay error
    """
    # Crear carpeta de salida
    os.makedirs(output_folder, exist_ok=True)
    
    # Encontrar FFmpeg
    ffmpeg_location = find_ffmpeg()
    
    # Configuración de yt-dlp
    ydl_opts = {
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'outtmpl': f'{output_folder}/%(title)s.%(ext)s',
        'quiet': False,
        'no_warnings': False,
        'default_search': 'ytsearch1',  # Buscar en YouTube
    }
    
    # Añadir ubicación de FFmpeg si está disponible
    if ffmpeg_location:
        ydl_opts['ffmpeg_location'] = ffmpeg_location
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            print(f"🔍 Buscando: {search_query}")
            info = ydl.extract_info(search_query, download=True)
            
            # Obtener información del video
            if 'entries' in info:
                video_info = info['entries'][0]
            else:
                video_info = info
                
            filename = ydl.prepare_filename(video_info)
            filename = filename.rsplit('.', 1)[0] + '.mp3'
            
            print(f"✅ Descarga completada: {filename}")
            return filename
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None


if __name__ == "__main__":
    # Ejemplo de uso
    query = input("Ingresa el nombre de la canción a buscar: ")
    resultado = download_audio_from_youtube(query)
    
    if resultado:
        print(f"\n📁 Archivo guardado en: {resultado}")
    else:
        print("\n⚠️ No se pudo descargar el audio")
