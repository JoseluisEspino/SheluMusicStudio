"""
Script principal para el flujo completo:
1. Descargar música de YouTube
2. Separar en múltiples pistas con Demucs
"""
import os
import sys

# Añadir src al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.download_music import download_audio_from_youtube
from src.separate_audio import separate_audio


def main():
    print("=" * 60)
    print("  Shelu Music Studio - Descarga y Separación de Audio")
    print("=" * 60)
    print()
    
    # Paso 1: Descargar música
    print("📥 PASO 1: Descargar música de YouTube\n")
    query = input("Ingresa el nombre de la canción: ")
    
    if not query.strip():
        print("❌ Error: Debes ingresar un nombre")
        return
    
    audio_file = download_audio_from_youtube(query)
    
    if not audio_file:
        print("\n❌ No se pudo descargar la canción")
        return
    
    # Paso 2: Preguntar si separar
    print("\n" + "=" * 60)
    print("📊 PASO 2: Separación de audio")
    print("=" * 60)
    print()
    
    separar = input("¿Deseas separar este audio en pistas? (s/n): ").lower()
    
    if separar == 's':
        print("\nModelos disponibles:")
        print("  1. htdemucs_6s (recomendado) - 6 pistas (drums, bass, vocals, other, guitar, piano)")
        print("  2. htdemucs - 4 pistas (drums, bass, vocals, other)")
        print("  3. htdemucs_ft - Mejor calidad, más lento - 4 pistas")
        print()
        
        modelo_choice = input("Selecciona modelo (1-3) [1]: ").strip() or "1"
        
        modelos = {
            "1": "htdemucs_6s",
            "2": "htdemucs",
            "3": "htdemucs_ft"
        }
        
        modelo = modelos.get(modelo_choice, "htdemucs_6s")
        
        print(f"\n🎼 Separando audio con modelo: {modelo}")
        print("Esto puede tomar varios minutos...\n")
        
        success = separate_audio(
            input_file=audio_file,
            model=modelo,
            device="cuda"
        )
        
        if success:
            print("\n✅ ¡Proceso completado!")
            print(f"\n📁 Archivos generados:")
            print(f"  - Audio original: {audio_file}")
            print(f"  - Pistas separadas: separated/{modelo}/")
        else:
            print("\n❌ Hubo un error en la separación")
    else:
        print("\n✅ Audio descargado exitosamente")
        print(f"📁 Ubicación: {audio_file}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️ Proceso cancelado por el usuario")
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")
