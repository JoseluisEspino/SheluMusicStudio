"""
Prueba directa de separación de audio con Demucs
"""
import os
import sys

# Añadir src al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from separate_audio import separate_audio

# Archivo a separar
input_file = "music/Radiohead/Radiohead - High and Dry.mp3"

if not os.path.exists(input_file):
    print(f"❌ Error: El archivo '{input_file}' no existe")
    print("\nPrimero descarga un archivo desde la web o con:")
    print("python src/download_music.py")
    sys.exit(1)

print("🎵 Separando audio con Demucs (htdemucs_6s - 6 pistas)")
print(f"📁 Archivo: {input_file}")
print("-" * 70)
print("\n⏳ Esto puede tomar varios minutos...")
print("   Presiona Ctrl+C para cancelar\n")

# Separar audio
output_dir = separate_audio(
    input_file=input_file,
    model="htdemucs_6s",
    device="cpu",
    output_folder="separated"
)

if output_dir:
    print("\n" + "=" * 70)
    print("🎉 ¡Separación completada exitosamente!")
    print("=" * 70)
    print(f"\n📂 Carpeta de salida: {output_dir}\n")
    
    # Listar archivos generados
    if os.path.exists(output_dir):
        print("📀 Pistas generadas:")
        for file in sorted(os.listdir(output_dir)):
            if file.endswith('.mp3'):
                file_path = os.path.join(output_dir, file)
                size_mb = os.path.getsize(file_path) / (1024 * 1024)
                
                # Nombres en español
                names = {
                    'vocals': 'Voz',
                    'drums': 'Batería',
                    'bass': 'Bajo',
                    'other': 'Otros',
                    'guitar': 'Guitarra',
                    'piano': 'Piano'
                }
                
                name = file.replace('.mp3', '')
                display_name = names.get(name, name)
                
                print(f"   ✓ {file:<15} ({display_name:<10}) - {size_mb:.2f} MB")
    
    print("\n" + "=" * 70)
    print(f"✅ Proceso completado. Archivos guardados en: {output_dir}")
    print("=" * 70)
else:
    print("\n❌ Error: La separación falló")
    print("Verifica que Demucs esté instalado correctamente:")
    print("   pip install demucs")
