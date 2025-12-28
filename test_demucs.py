"""
Script simple para probar la separación de audio con Demucs
"""
import os
import sys

# Configurar el backend de torchaudio antes de importar demucs
os.environ['TORCHAUDIO_USE_BACKEND_DISPATCHER'] = '1'

import subprocess

def separate_audio_simple(input_file, output_folder="separated_audio"):
    """
    Separa un archivo de audio usando Demucs directamente desde línea de comandos
    """
    print(f"🎵 Separando: {os.path.basename(input_file)}")
    print("Usando modelo: htdemucs (alta calidad)")
    print("Esto puede tomar varios minutos...\n")
    
    # Usar el ejecutable de demucs directamente
    demucs_cmd = [
        r"venv\Scripts\demucs.exe",
        "-n", "htdemucs",
        "--two-stems", "vocals",
        "-o", output_folder,
        input_file
    ]
    
    try:
        # Ejecutar con output en tiempo real
        result = subprocess.run(demucs_cmd, check=True)
        print("\n✅ Separación completada!")
        print(f"Los archivos se guardaron en: {output_folder}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Error durante la separación: {e}")
        return False

if __name__ == "__main__":
    # Archivo a separar
    input_file = r"music\Måneskin - IL DONO DELLA VITA (Lyric Video).mp3"
    
    if not os.path.exists(input_file):
        print(f"❌ Error: No se encontró el archivo {input_file}")
        sys.exit(1)
    
    separate_audio_simple(input_file)
