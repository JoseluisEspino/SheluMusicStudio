"""
Servicio de separación de audio con Demucs
"""
import os
import subprocess
from typing import Optional, Dict
import shutil


def separate_audio_task(
    task_id: str,
    file_path: str,
    model: str,
    artist: Optional[str],
    tasks_status: Dict
):
    """
    Tarea de separación de audio (ejecutar en segundo plano)
    
    Args:
        task_id: ID de la tarea
        file_path: Ruta del archivo MP3
        model: Modelo de Demucs a usar
        artist: Nombre del artista (opcional)
        tasks_status: Diccionario de estados de tareas
    """
    try:
        # Actualizar estado
        tasks_status[task_id]["message"] = "Separando audio con Demucs..."
        tasks_status[task_id]["progress"] = 10
        
        # Ejecutar separación
        output_dir = separate_audio(file_path, model=model, device="cpu")
        
        if output_dir:
            # Organizar archivos si se especificó artista
            if artist:
                tasks_status[task_id]["progress"] = 80
                tasks_status[task_id]["message"] = "Organizando archivos..."
                organized_path = organize_separated_files(output_dir, artist)
                output_dir = organized_path
            
            # Completar tarea
            tasks_status[task_id]["status"] = "completed"
            tasks_status[task_id]["progress"] = 100
            tasks_status[task_id]["message"] = "Separación completada"
            tasks_status[task_id]["output_dir"] = output_dir
        else:
            tasks_status[task_id]["status"] = "error"
            tasks_status[task_id]["message"] = "Error al separar el audio"
            
    except Exception as e:
        tasks_status[task_id]["status"] = "error"
        tasks_status[task_id]["message"] = f"Error: {str(e)}"


def separate_audio(
    input_file: str,
    model: str = "htdemucs_6s",
    device: str = "cpu",
    output_folder: str = "separated"
) -> Optional[str]:
    """
    Separar audio en pistas usando Demucs
    
    Args:
        input_file: Ruta del archivo MP3
        model: Modelo de Demucs (htdemucs_6s, htdemucs, htdemucs_ft, mdx_extra)
        device: Dispositivo (cpu, cuda)
        output_folder: Carpeta de salida
        
    Returns:
        Ruta de la carpeta de salida o None si falla
    """
    if not os.path.exists(input_file):
        print(f"Error: El archivo {input_file} no existe")
        return None
    
    try:
        os.makedirs(output_folder, exist_ok=True)
        
        # Comando de Demucs
        cmd = [
            "demucs",
            "--mp3",
            "--mp3-bitrate", "320",
            "-n", model,
            "-d", device,
            "-o", output_folder,
            input_file
        ]
        
        print(f"Ejecutando: {' '.join(cmd)}")
        
        # Ejecutar Demucs
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True
        )
        
        # La estructura de salida de Demucs es:
        # output_folder/model_name/song_name/stem.mp3
        song_name = os.path.splitext(os.path.basename(input_file))[0]
        output_dir = os.path.join(output_folder, model, song_name)
        
        if os.path.exists(output_dir):
            print(f"✓ Audio separado en: {output_dir}")
            return output_dir
        else:
            print(f"✗ No se encontró la carpeta de salida: {output_dir}")
            return None
            
    except subprocess.CalledProcessError as e:
        print(f"Error al ejecutar Demucs: {e}")
        print(f"Salida: {e.output}")
        return None
    except Exception as e:
        print(f"Error inesperado: {e}")
        return None


def organize_separated_files(output_dir: str, artist: str) -> str:
    """
    Organizar archivos separados por artista
    
    Args:
        output_dir: Carpeta con archivos separados
        artist: Nombre del artista
        
    Returns:
        Nueva ruta organizada
    """
    try:
        # Crear estructura: separated/artist/song_name/
        song_name = os.path.basename(output_dir)
        artist_dir = os.path.join("separated", artist)
        new_output_dir = os.path.join(artist_dir, song_name)
        
        # Mover carpeta
        os.makedirs(artist_dir, exist_ok=True)
        if os.path.exists(new_output_dir):
            shutil.rmtree(new_output_dir)
        shutil.move(output_dir, new_output_dir)
        
        print(f"✓ Archivos organizados en: {new_output_dir}")
        return new_output_dir
        
    except Exception as e:
        print(f"Error al organizar archivos: {e}")
        return output_dir


def get_separation_status(task_id: str, tasks_status: Dict) -> Dict:
    """
    Obtener estado de una separación
    """
    return tasks_status.get(task_id, {"status": "not_found"})
