# 🎵 Guía de Separación de Audio con Demucs

## 📋 ¿Qué es la Separación de Audio?

La separación de audio (también conocida como **Source Separation**) es el proceso de dividir una canción en sus componentes individuales (pistas o "stems") usando inteligencia artificial.

## 🧠 Modelo htdemucs_6s

El modelo **htdemucs_6s** de Facebook Research puede separar audio en **6 pistas**:

| Pista | Descripción | Contenido |
|-------|-------------|-----------|
| 🎤 **vocals** | Voz principal | Todas las voces humanas |
| 🥁 **drums** | Batería | Tambores, platillos, percusión |
| 🎸 **bass** | Bajo | Línea de bajo |
| 🎹 **other** | Otros instrumentos | Sintetizadores, cuerdas, vientos |
| 🎸 **guitar** | Guitarra | Guitarras eléctricas y acústicas |
| 🎹 **piano** | Piano | Piano y teclados |

## 📁 Estructura de Archivos

### Entrada
```
music/
└── Radiohead/
    └── Radiohead - High and Dry.mp3
```

### Salida (Nueva estructura - junto al archivo original)
```
music/
└── Radiohead/
    ├── Radiohead - High and Dry.mp3
    └── Radiohead - High and Dry/      ← Carpeta con las pistas
        ├── vocals.mp3   (voz)
        ├── drums.mp3    (batería)
        ├── bass.mp3     (bajo)
        ├── other.mp3    (otros)
        ├── guitar.mp3   (guitarra)
        └── piano.mp3    (piano)
```

**Ventajas de esta estructura:**
- ✅ Las pistas están junto al archivo original
- ✅ Fácil de encontrar y organizar
- ✅ No necesitas buscar en carpetas separadas
- ✅ La carpeta tiene el mismo nombre que la canción

## 🚀 Cómo Usar

### 1. Desde la Web (Interfaz Gráfica)

1. Abre http://localhost:8000
2. Ve a la pestaña **📚 Biblioteca**
3. Busca la canción que quieres separar
4. Haz clic en **🎵 Separar**
5. Selecciona el modelo (htdemucs_6s recomendado)
6. Espera el procesamiento
7. Ve a **⚙️ Tareas** para ver el progreso

### 2. Desde Python (CLI)

```python
from src.separate_audio import separate_audio

output_dir = separate_audio(
    input_file="music/artist/song.mp3",
    model="htdemucs_6s",
    device="cpu",
    output_folder="separated"
)

print(f"Pistas guardadas en: {output_dir}")
```

### 3. Desde la API REST

```bash
curl -X POST http://localhost:8000/api/separate \
  -H "Content-Type: application/json" \
  -d '{
    "file_path": "music/Radiohead/Radiohead - High and Dry.mp3",
    "model": "htdemucs_6s",
    "artist": "Radiohead"
  }'
```

## ⏱️ Tiempo de Procesamiento

El tiempo depende de:
- **Duración de la canción**: Más larga = más tiempo
- **Modelo usado**: 6 pistas tarda más que 4
- **Hardware**: CPU vs GPU

### Tiempos Aproximados (CPU Intel i7)

| Canción | Duración | Modelo | Tiempo |
|---------|----------|--------|--------|
| High and Dry | 4:18 | htdemucs_6s | ~3-4 min |
| Bohemian Rhapsody | 5:55 | htdemucs_6s | ~5-6 min |
| Canción corta | 2:30 | htdemucs_6s | ~2 min |

### Con GPU (NVIDIA RTX)
El procesamiento es **10-15x más rápido**:
- Canción de 4 min → ~20-30 segundos

## 🎯 Calidad de las Pistas

### Pistas de Alta Calidad
- ✅ **vocals**: Excelente separación de voces
- ✅ **drums**: Muy buena definición de batería
- ✅ **bass**: Buena separación del bajo

### Pistas de Calidad Variable
- ⚠️ **other**: Depende de la complejidad
- ⚠️ **guitar**: Buena, pero puede mezclarse con "other"
- ⚠️ **piano**: Experimental, calidad variable

## 🔧 Modelos Disponibles

### htdemucs_6s (Recomendado) ⭐
- **Pistas**: 6 (vocals, drums, bass, other, guitar, piano)
- **Calidad**: ⭐⭐⭐⭐ Muy buena
- **Velocidad**: ⭐⭐⭐ Media
- **Uso**: Música con múltiples instrumentos

### htdemucs
- **Pistas**: 4 (vocals, drums, bass, other)
- **Calidad**: ⭐⭐⭐⭐ Muy buena
- **Velocidad**: ⭐⭐⭐⭐ Rápida
- **Uso**: Música general, más rápido que 6s

### htdemucs_ft
- **Pistas**: 4 (fine-tuned)
- **Calidad**: ⭐⭐⭐⭐⭐ Excelente
- **Velocidad**: ⭐ Lenta (4x más lento)
- **Uso**: Cuando necesitas máxima calidad

### mdx_extra
- **Pistas**: 4
- **Calidad**: ⭐⭐⭐⭐⭐ Excelente
- **Velocidad**: ⭐ Muy lenta
- **Uso**: Producción profesional

## 💾 Tamaño de Archivos

Para una canción de 4 minutos (formato MP3 320kbps):

| Archivo Original | Pistas Separadas | Total |
|-----------------|------------------|-------|
| ~12 MB | 6 × ~2-3 MB | ~18-20 MB |

## 🎓 Casos de Uso

### 1. Karaoke
Usa la pista **vocals** invertida o elimínala para crear backing tracks

### 2. Remixes y Mashups
Combina pistas de diferentes canciones

### 3. Aprendizaje Musical
Escucha pistas individuales para aprender:
- 🎸 Líneas de guitarra
- 🥁 Patrones de batería
- 🎹 Arreglos de piano

### 4. Análisis Musical
Estudia la composición de canciones profesionales

### 5. Producción
Usa stems para crear versiones alternativas

## 🔍 Verificar Resultados

Después de la separación, verifica:

1. **Todas las pistas generadas**: Deben ser 6 archivos MP3
2. **Tamaño de archivos**: No deben estar vacíos
3. **Calidad de audio**: Reproduce cada pista individualmente
4. **Artefactos**: Algunas pistas pueden tener pequeños artefactos

## ⚙️ Configuración Avanzada

### Usar GPU (más rápido)

1. Instala PyTorch con CUDA:
```bash
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118
```

2. Modifica `src/separation_service.py`:
```python
device="cuda"  # En lugar de "cpu"
```

### Cambiar Bitrate del MP3

En `src/separation_service.py`:
```python
"--mp3-bitrate", "320",  # Cambiar a 192 o 256
```

### Formato FLAC (sin pérdida)

Reemplaza `--mp3` con `--flac` en el comando de Demucs

## 🐛 Solución de Problemas

### Error: "Out of memory"
- **Causa**: No hay suficiente RAM
- **Solución**: Cierra otras aplicaciones o usa un modelo más ligero (htdemucs)

### Separación muy lenta
- **Causa**: Usando CPU
- **Solución**: Instala CUDA para usar GPU

### Pistas con artefactos
- **Causa**: Audio original de baja calidad
- **Solución**: Descarga audio de mayor calidad o usa modelo mdx_extra

### Error: "Model not found"
- **Causa**: Primera ejecución, descargando modelo
- **Solución**: Espera a que termine la descarga (~50-200 MB)

## 📊 Benchmarks

### CPU (Intel i7-10700K @ 3.8 GHz)
- htdemucs_6s: ~1 min por minuto de audio
- htdemucs: ~40 seg por minuto de audio

### GPU (NVIDIA RTX 3080)
- htdemucs_6s: ~5 seg por minuto de audio
- htdemucs: ~3 seg por minuto de audio

## 🔗 Referencias

- [Demucs GitHub](https://github.com/facebookresearch/demucs)
- [Paper Original](https://arxiv.org/abs/1911.13254)
- [Facebook Research](https://ai.facebook.com/blog/ai-creates-music-source-separation/)

---

**¡Disfruta separando tus canciones favoritas! 🎵**
