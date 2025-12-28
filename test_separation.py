"""
Script de prueba para separación de audio
"""
import requests
import json
import time

API_URL = "http://localhost:8000/api"

# Probar separación del archivo de Radiohead descargado
file_path = "music/Radiohead/Radiohead - High and Dry.mp3"
artist = "Radiohead"

print("🎵 Iniciando separación de audio con htdemucs_6s (6 pistas)")
print(f"📁 Archivo: {file_path}")
print(f"👤 Artista: {artist}")
print("-" * 60)

# Solicitar separación
response = requests.post(f"{API_URL}/separate", json={
    "file_path": file_path,
    "model": "htdemucs_6s",
    "artist": artist
})

data = response.json()
print(f"\n✅ Respuesta: {json.dumps(data, indent=2)}")

if data.get("success"):
    task_id = data["task_id"]
    print(f"\n⚙️  Task ID: {task_id}")
    print("\n⏳ Monitoreando progreso...")
    print("-" * 60)
    
    # Monitorear progreso
    while True:
        time.sleep(3)
        
        status_response = requests.get(f"{API_URL}/task/{task_id}")
        status = status_response.json()
        
        progress = status.get("progress", 0)
        message = status.get("message", "")
        task_status = status.get("status", "")
        
        print(f"[{task_status.upper()}] {progress}% - {message}")
        
        if task_status == "completed":
            print("\n" + "=" * 60)
            print("🎉 ¡Separación completada!")
            print(f"📂 Carpeta de salida: {status.get('output_dir')}")
            print("\n📀 Pistas generadas:")
            print("   • vocals.mp3  (voz)")
            print("   • drums.mp3   (batería)")
            print("   • bass.mp3    (bajo)")
            print("   • other.mp3   (otros instrumentos)")
            print("   • guitar.mp3  (guitarra)")
            print("   • piano.mp3   (piano)")
            print("=" * 60)
            break
        elif task_status == "error":
            print(f"\n❌ Error: {message}")
            break
else:
    print(f"❌ Error al iniciar separación: {data}")
