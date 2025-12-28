"""
Script para reorganizar y convertir pistas separadas
"""
import os
import shutil
import subprocess
import sys

# Añadir src al path para usar find_ffmpeg
sys.path.insert(0, 'src')
from download_music import find_ffmpeg

# Buscar FFmpeg
FFMPEG_PATH = find_ffmpeg()
if not FFMPEG_PATH:
    print("⚠️  FFmpeg no encontrado, los archivos WAV no se convertirán a MP3")
    FFMPEG_CMD = None
else:
    FFMPEG_CMD = os.path.join(FFMPEG_PATH, "ffmpeg.exe")
    print(f"✓ FFmpeg encontrado: {FFMPEG_CMD}\n")

def reorganize_separated_tracks(separated_base="separated"):
    """
    Reorganiza las pistas separadas a la nueva estructura
    (junto al archivo MP3 original) y las convierte a MP3
    """
    print("🔄 Reorganizando pistas separadas...\n")
    
    # Buscar todas las carpetas en separated/
    for model_name in os.listdir(separated_base):
        model_path = os.path.join(separated_base, model_name)
        
        if not os.path.isdir(model_path):
            continue
        
        print(f"📁 Procesando modelo: {model_name}")
        
        # Buscar cada canción separada
        for song_folder in os.listdir(model_path):
            song_path = os.path.join(model_path, song_folder)
            
            if not os.path.isdir(song_path):
                continue
            
            print(f"  🎵 Canción: {song_folder}")
            
            # Buscar el archivo MP3 original
            original_file = find_original_file(song_folder, "music")
            
            if not original_file:
                print(f"    ⚠️  No se encontró el archivo original")
                continue
            
            # Crear carpeta de destino junto al archivo original
            original_dir = os.path.dirname(original_file)
            dest_folder = os.path.join(original_dir, song_folder)
            
            # Crear carpeta de destino
            os.makedirs(dest_folder, exist_ok=True)
            print(f"    📂 Destino: {dest_folder}")
            
            # Copiar y convertir cada pista
            for file in os.listdir(song_path):
                src_file = os.path.join(song_path, file)
                
                if file.endswith('.wav'):
                    # Convertir WAV a MP3
                    mp3_filename = file.replace('.wav', '.mp3')
                    dest_file = os.path.join(dest_folder, mp3_filename)
                    
                    print(f"      ✓ Convirtiendo {file} → {mp3_filename}")
                    convert_to_mp3(src_file, dest_file)
                elif file.endswith('.mp3'):
                    # Copiar MP3 directamente
                    dest_file = os.path.join(dest_folder, file)
                    print(f"      ✓ Copiando {file}")
                    shutil.copy2(src_file, dest_file)
            
            print(f"    ✅ Completado\n")
    
    print("🎉 ¡Reorganización completada!")

def find_original_file(song_name, music_dir="music"):
    """
    Busca el archivo MP3 original en la carpeta music/
    """
    for root, dirs, files in os.walk(music_dir):
        for file in files:
            if file.endswith('.mp3'):
                # Comparar sin extensión
                file_name = os.path.splitext(file)[0]
                if file_name == song_name:
                    return os.path.join(root, file)
    return None

def convert_to_mp3(wav_file, mp3_file, bitrate="320k"):
    """
    Convierte WAV a MP3 usando FFmpeg
    """
    if not FFMPEG_CMD:
        # Si no hay FFmpeg, copiar el WAV directamente
        shutil.copy2(wav_file, wav_file.replace('_temp', ''))
        return False
    
    cmd = [
        FFMPEG_CMD,
        "-i", wav_file,
        "-codec:a", "libmp3lame",
        "-b:a", bitrate,
        "-y",  # Sobrescribir sin preguntar
        mp3_file
    ]
    
    try:
        subprocess.run(cmd, check=True, capture_output=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"      ❌ Error al convertir: {e}")
        return False

if __name__ == "__main__":
    reorganize_separated_tracks()
