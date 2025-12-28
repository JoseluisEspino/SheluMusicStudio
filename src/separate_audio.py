"""
Módulo para separar audio en múltiples pistas usando Demucs
"""
import os
import subprocess
import sys


def separate_audio(
    input_file,
    output_folder="separated",
    model="htdemucs_6s",
    stems=6,
    device="cpu"
):
    """
    Separa un archivo de audio en múltiples pistas usando Demucs.
    Las pistas se guardan en una carpeta con el mismo nombre del archivo,
    ubicada en el mismo directorio del archivo original.
    
    Args:
        input_file (str): Ruta del archivo de audio a separar
        output_folder (str): Carpeta temporal (se reorganizará)
        model (str): Modelo de Demucs a usar
            - 'htdemucs_6s': Por defecto, 6 stems (drums, bass, vocals, other, guitar, piano)
            - 'htdemucs': Alta calidad (4 stems: drums, bass, vocals, other)
            - 'htdemucs_ft': Fine-tuned, mejor calidad pero 4x más lento (4 stems)
            - 'mdx_extra': Entrenado con datos extra (4 stems)
        stems (int): Número de stems (4 o 6)
        device (str): 'cpu' o 'cuda' para usar GPU
        
    Returns:
        str: Ruta de la carpeta con las pistas, o None si hubo error
    """
    import shutil
    
    if not os.path.exists(input_file):
        print(f"❌ Error: No se encontró el archivo {input_file}")
        return None
    
    # Crear carpeta temporal
    temp_output = os.path.join(output_folder, "_temp")
    os.makedirs(temp_output, exist_ok=True)
    
    print(f"🎵 Separando: {os.path.basename(input_file)}")
    print(f"Modelo: {model}")
    print(f"Stems: {stems} pistas")
    print(f"Dispositivo: {device.upper()}")
    print("Esto puede tomar varios minutos...\n")
    
    # Construir comando de demucs
    cmd = [
        "demucs",
        "-n", model,
        "-o", temp_output,
        "--device", device,
        input_file
    ]
    
    try:
        # Ejecutar demucs
        result = subprocess.run(cmd, check=True)
        
        # Obtener nombre del archivo sin extensión
        song_name = os.path.splitext(os.path.basename(input_file))[0]
        temp_dir = os.path.join(temp_output, model, song_name)
        
        if os.path.exists(temp_dir):
            # Crear carpeta de destino junto al archivo original
            input_dir = os.path.dirname(input_file)
            final_output_dir = os.path.join(input_dir, song_name)
            
            # Si ya existe, eliminarla
            if os.path.exists(final_output_dir):
                shutil.rmtree(final_output_dir)
            
            # Mover carpeta con las pistas al destino final
            shutil.move(temp_dir, final_output_dir)
            
            # Limpiar carpeta temporal
            try:
                shutil.rmtree(temp_output)
            except:
                pass
            
            print("\n✅ Separación completada!")
            print(f"📁 Las pistas se guardaron en: {final_output_dir}\n")
            
            # Mostrar las pistas generadas
            if os.path.exists(final_output_dir):
                print("📀 Pistas generadas:")
                for file in sorted(os.listdir(final_output_dir)):
                    if file.endswith('.wav') or file.endswith('.mp3'):
                        print(f"  ✓ {file}")
            
            return final_output_dir
        else:
            print(f"\n❌ Error: No se encontró la carpeta de salida temporal")
            return None
        
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Error durante la separación: {e}")
        return None
    except FileNotFoundError:
        print("\n❌ Error: Demucs no está instalado o no se encuentra en el PATH")
        print("Asegúrate de haber activado el entorno virtual e instalado las dependencias")
        return None


def separate_all_in_folder(input_folder="music", **kwargs):
    """
    Separa todos los archivos MP3 en una carpeta.
    
    Args:
        input_folder (str): Carpeta con los archivos de audio
        **kwargs: Argumentos adicionales para separate_audio()
    """
    if not os.path.exists(input_folder):
        print(f"❌ Error: No se encontró la carpeta {input_folder}")
        return
    
    # Buscar archivos MP3
    mp3_files = [f for f in os.listdir(input_folder) if f.endswith('.mp3')]
    
    if not mp3_files:
        print(f"⚠️ No se encontraron archivos MP3 en {input_folder}")
        return
    
    print(f"📂 Encontrados {len(mp3_files)} archivos MP3\n")
    
    for i, mp3_file in enumerate(mp3_files, 1):
        print(f"\n{'='*60}")
        print(f"Procesando {i}/{len(mp3_files)}")
        print(f"{'='*60}\n")
        
        file_path = os.path.join(input_folder, mp3_file)
        separate_audio(file_path, **kwargs)


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Separa audio en múltiples pistas')
    parser.add_argument('input', nargs='?', help='Archivo de audio a separar')
    parser.add_argument('--folder', action='store_true', help='Procesar toda la carpeta music/')
    parser.add_argument('-m', '--model', default='htdemucs_6s', 
                       choices=['htdemucs_6s', 'htdemucs', 'htdemucs_ft', 'mdx_extra'],
                       help='Modelo de Demucs a usar (por defecto: htdemucs_6s - 6 pistas)')
    parser.add_argument('-d', '--device', default='cpu', choices=['cpu', 'cuda'],
                       help='Dispositivo para procesamiento')
    parser.add_argument('-o', '--output', default='separated',
                       help='Carpeta de salida')
    
    args = parser.parse_args()
    
    if args.folder:
        # Procesar todos los archivos en music/
        separate_all_in_folder(
            input_folder="music",
            output_folder=args.output,
            model=args.model,
            device=args.device
        )
    elif args.input:
        # Procesar un solo archivo
        separate_audio(
            input_file=args.input,
            output_folder=args.output,
            model=args.model,
            device=args.device
        )
    else:
        print("❌ Error: Debes especificar un archivo o usar --folder")
        parser.print_help()
