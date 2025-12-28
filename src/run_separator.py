import os
import subprocess
import torch
import shutil

def save_as_mp3(input_file, output_path):
    """Guarda el archivo de audio separado como MP3 usando ffmpeg."""
    subprocess.run([
        "ffmpeg", "-i", input_file, "-codec:a", "libmp3lame", "-qscale:a", "2", "-y", output_path
    ], check=True, capture_output=True)

def separate_audio(input_file, model="htdemucs", base_output_folder="separated_audio"):
    """
    Separa los instrumentos de un archivo de audio utilizando Demucs y guarda las pistas separadas en carpetas dedicadas.
    """
    if not os.path.exists(base_output_folder):
        os.makedirs(base_output_folder)
    
    vocals_folder = os.path.join(base_output_folder, "vocals")
    no_vocals_folder = os.path.join(base_output_folder, "no_vocals")
    
    # Crea las carpetas si no existen
    os.makedirs(vocals_folder, exist_ok=True)
    os.makedirs(no_vocals_folder, exist_ok=True)
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    
    print(f"Separación en curso con el modelo {model} en {device}...")
    print(f"Archivo: {os.path.basename(input_file)}")
    
    # Ruta al ejecutable de demucs en el entorno virtual
    demucs_path = r"venv\Scripts\demucs.exe"
    
    try:
        subprocess.run([
            demucs_path, "-n", model, "--two-stems", "vocals", "--out", base_output_folder, "--device", device, input_file
        ], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Error durante la ejecución de Demucs: {e}")
        return
    
    # Nombre del archivo sin extensión
    track_name = os.path.splitext(os.path.basename(input_file))[0]
    demucs_output_folder = os.path.join(base_output_folder, model, track_name)
    
    # Verifica la existencia de la carpeta generada
    if not os.path.exists(demucs_output_folder):
        print(f"Error: la carpeta '{demucs_output_folder}' no fue encontrada.")
        return
    
    # Rutas de los archivos separados
    vocals_path = os.path.join(demucs_output_folder, "vocals.wav")
    no_vocals_path = os.path.join(demucs_output_folder, "no_vocals.wav")
    
    # Verifica la existencia de los archivos separados
    if os.path.exists(vocals_path) and os.path.exists(no_vocals_path):
        # Crea los nombres de los archivos de salida
        vocals_output_path = os.path.join(vocals_folder, f"{track_name}_vocals.mp3")
        no_vocals_output_path = os.path.join(no_vocals_folder, f"{track_name}_no_vocals.mp3")
        
        # Convierte y guarda los archivos separados como MP3
        print("Convirtiendo a MP3...")
        save_as_mp3(vocals_path, vocals_output_path)
        save_as_mp3(no_vocals_path, no_vocals_output_path)
        
        print(f"\n✅ Archivos MP3 guardados:")
        print(f"  - Vocals: {vocals_output_path}")
        print(f"  - No Vocals: {no_vocals_output_path}")
        
        # Elimina los archivos intermedios (.wav)
        os.remove(vocals_path)
        os.remove(no_vocals_path)
        
        # Elimina la carpeta temporal generada por Demucs
        shutil.rmtree(os.path.join(base_output_folder, model), ignore_errors=True)
        print("Carpeta temporal eliminada.")
    else:
        print("Error: los archivos separados no fueron encontrados.")

if __name__ == "__main__":
    # Usar el archivo de Måneskin
    input_audio = r"music\Måneskin - IL DONO DELLA VITA (Lyric Video).mp3"
    
    if not os.path.exists(input_audio):
        print(f"Error: No se encontró el archivo {input_audio}")
    else:
        print(f"🎵 Separando: {os.path.basename(input_audio)}")
        print("Usando modelo: htdemucs (alta calidad)")
        print("Esto puede tomar varios minutos...\n")
        separate_audio(input_audio, model="htdemucs")
