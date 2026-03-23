// API Base URL
const API_URL = 'http://localhost:8000/api';

// Estado global
let currentTasks = {};
let currentSongForSeparation = null;
let musicTree = null;
let selectedTracks = [];
let playQueue = [];
let currentTrackIndex = 0;
let audioPlayers = []; // Array de reproductores para múltiples pistas

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initSearch();
    initLibrary();
    initModal();
    initExplorer();
    startTaskPolling();
});

// === TABS ===
function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            // Actualizar tabs
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Actualizar contenido
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabName) {
                    content.classList.add('active');
                    
                    // Cargar datos al cambiar de tab
                    if (tabName === 'library') {
                        loadLibrary();
                    } else if (tabName === 'tasks') {
                        renderTasks();
                    } else if (tabName === 'explorer') {
                        loadMusicTree();
                    }
                }
            });
        });
    });
}

// === BÚSQUEDA ===
function initSearch() {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchQuery');
    
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
}

async function performSearch() {
    const query = document.getElementById('searchQuery').value.trim();
    if (!query) {
        alert('Por favor ingresa un término de búsqueda');
        return;
    }
    
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '<div class="loading"><div class="spinner"></div><p>Buscando...</p></div>';
    
    try {
        const response = await fetch(`${API_URL}/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, max_results: 10 })
        });
        
        const data = await response.json();
        
        if (data.success && data.results.length > 0) {
            renderSearchResults(data.results);
        } else {
            resultsContainer.innerHTML = '<p class="loading">No se encontraron resultados</p>';
        }
    } catch (error) {
        console.error('Error en búsqueda:', error);
        resultsContainer.innerHTML = '<p class="loading" style="color: var(--error-color);">Error al buscar</p>';
    }
}

function renderSearchResults(results) {
    const container = document.getElementById('searchResults');
    
    container.innerHTML = results.map(result => `
        <div class="result-item" data-video-id="${result.video_id}">
            <img src="${result.thumbnail}" alt="${result.title}" class="result-thumbnail">
            <div class="result-info">
                <div class="result-title">${result.title}</div>
                <div class="result-channel">Canal: ${result.channel}</div>
                <div class="result-actions">
                    <input 
                        type="text" 
                        class="artist-input" 
                        placeholder="Nombre del artista (opcional)"
                        id="artist-${result.video_id}"
                    >
                    <button class="btn btn-success btn-small download-btn" 
                            data-video-id="${result.video_id}"
                            data-title="${escapeHtml(result.title)}">
                        ⬇️ Descargar
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Añadir event listeners
    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', handleDownload);
    });
}

async function handleDownload(e) {
    const btn = e.currentTarget;
    const videoId = btn.dataset.videoId;
    const title = btn.dataset.title;
    const artistInput = document.getElementById(`artist-${videoId}`);
    const artist = artistInput?.value.trim() || '';
    
    // Validar que el artista no esté vacío
    if (!artist) {
        alert('Por favor, ingresa el nombre del artista antes de descargar.');
        artistInput?.focus();
        return;
    }
    
    btn.disabled = true;
    btn.textContent = 'Descargando...';
    
    try {
        const response = await fetch(`${API_URL}/download`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ video_id: videoId, title, artist })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentTasks[data.task_id] = {
                type: 'download',
                title,
                status: 'completed',
                file_path: data.file_path
            };
            
            btn.textContent = '✓ Descargado';
            btn.classList.remove('btn-success');
            btn.classList.add('btn-secondary');
            
            // Preguntar si quiere separar
            if (confirm('¿Deseas separar el audio ahora?')) {
                openSeparateModal(data.file_path, title, artist);
            }
        } else {
            throw new Error('Error en la descarga');
        }
    } catch (error) {
        console.error('Error al descargar:', error);
        btn.textContent = '✗ Error';
        btn.disabled = false;
        alert(`Error al descargar: ${error.message}`);
    }
}

// === BIBLIOTECA ===
function initLibrary() {
    document.getElementById('refreshLibrary').addEventListener('click', loadLibrary);
    document.getElementById('artistFilter').addEventListener('change', loadLibrary);
}

async function loadLibrary() {
    const artist = document.getElementById('artistFilter').value;
    
    try {
        // Cargar estadísticas
        const statsResponse = await fetch(`${API_URL}/songs`);
        const statsData = await statsResponse.json();
        
        // Cargar artistas
        const artistsResponse = await fetch(`${API_URL}/artists`);
        const artistsData = await artistsResponse.json();
        
        // Actualizar filtro de artistas
        updateArtistFilter(artistsData.artists);
        
        // Cargar canciones
        const songsUrl = artist ? `${API_URL}/songs?artist=${encodeURIComponent(artist)}` : `${API_URL}/songs`;
        const songsResponse = await fetch(songsUrl);
        const songsData = await songsResponse.json();
        
        // Renderizar
        renderStats(songsData.songs);
        renderSongs(songsData.songs);
        
    } catch (error) {
        console.error('Error al cargar biblioteca:', error);
    }
}

function updateArtistFilter(artists) {
    const filter = document.getElementById('artistFilter');
    const currentValue = filter.value;
    
    filter.innerHTML = '<option value="">Todos los artistas</option>' +
        artists.map(artist => `<option value="${artist}">${artist}</option>`).join('');
    
    filter.value = currentValue;
}

function renderStats(songs) {
    const artists = new Set(songs.map(s => s.artist));
    const totalSize = songs.reduce((sum, s) => sum + (s.size || 0), 0);
    
    const statsHtml = `
        <div class="stat-card">
            <div class="stat-value">${songs.length}</div>
            <div class="stat-label">Canciones</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${artists.size}</div>
            <div class="stat-label">Artistas</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${(totalSize / (1024 * 1024)).toFixed(1)} MB</div>
            <div class="stat-label">Tamaño Total</div>
        </div>
    `;
    
    document.getElementById('libraryStats').innerHTML = statsHtml;
}

function renderSongs(songs) {
    const container = document.getElementById('songsList');
    
    if (songs.length === 0) {
        container.innerHTML = '<p class="loading">No hay canciones en la biblioteca</p>';
        return;
    }
    
    container.innerHTML = songs.map(song => `
        <div class="song-item">
            <div class="song-info">
                <div class="song-title">${song.title}</div>
                <div class="song-meta">
                    ${song.artist} • ${(song.size / (1024 * 1024)).toFixed(2)} MB
                </div>
            </div>
            <div class="song-actions">
                <button class="btn btn-primary btn-small separate-btn"
                        data-file-path="${song.file_path}"
                        data-title="${escapeHtml(song.title)}"
                        data-artist="${song.artist}">
                    🎵 Separar
                </button>
                <button class="btn btn-secondary btn-small view-stems-btn"
                        data-song-id="${song.id}">
                    👁️ Ver Pistas
                </button>
            </div>
        </div>
    `).join('');
    
    // Event listeners
    document.querySelectorAll('.separate-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filePath = e.currentTarget.dataset.filePath;
            const title = e.currentTarget.dataset.title;
            const artist = e.currentTarget.dataset.artist;
            openSeparateModal(filePath, title, artist);
        });
    });
    
    document.querySelectorAll('.view-stems-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const songId = e.currentTarget.dataset.songId;
            viewSeparatedStems(songId);
        });
    });
}

async function viewSeparatedStems(songId) {
    try {
        const response = await fetch(`${API_URL}/separated/${songId}`);
        const data = await response.json();
        
        if (data.success && Object.keys(data.files.stems || {}).length > 0) {
            const stemsList = Object.entries(data.files.stems)
                .map(([name, path]) => `• ${name}: ${path}`)
                .join('\n');
            
            alert(`Pistas separadas:\n\n${stemsList}`);
        } else {
            alert('Esta canción aún no ha sido separada');
        }
    } catch (error) {
        console.error('Error al obtener pistas:', error);
        alert('Error al obtener las pistas separadas');
    }
}

// === MODAL DE SEPARACIÓN ===
function initModal() {
    const modal = document.getElementById('separateModal');
    const closeBtn = modal.querySelector('.close');
    const cancelBtn = document.getElementById('cancelSeparation');
    const startBtn = document.getElementById('startSeparation');
    
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    cancelBtn.addEventListener('click', () => modal.classList.remove('active'));
    startBtn.addEventListener('click', startSeparation);
    
    // Cerrar al hacer clic fuera del modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

function openSeparateModal(filePath, title, artist) {
    currentSongForSeparation = { filePath, title, artist };
    
    document.getElementById('modalFileName').textContent = title;
    document.getElementById('separateModal').classList.add('active');
}

async function startSeparation() {
    if (!currentSongForSeparation) return;
    
    const model = document.getElementById('modelSelect').value;
    const { filePath, artist } = currentSongForSeparation;
    
    try {
        const response = await fetch(`${API_URL}/separate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                file_path: filePath,
                model,
                artist
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentTasks[data.task_id] = {
                type: 'separation',
                title: currentSongForSeparation.title,
                status: 'processing',
                progress: 0
            };
            
            document.getElementById('separateModal').classList.remove('active');
            
            // Cambiar a tab de tareas
            document.querySelector('.tab[data-tab="tasks"]').click();
            
            alert('Separación iniciada. Puedes ver el progreso en la pestaña "Tareas"');
        } else {
            throw new Error('Error al iniciar separación');
        }
    } catch (error) {
        console.error('Error al separar:', error);
        alert('Error al iniciar la separación');
    }
}

// === TAREAS ===
function startTaskPolling() {
    setInterval(updateTasks, 2000);
}

async function updateTasks() {
    for (const taskId in currentTasks) {
        if (currentTasks[taskId].status === 'processing') {
            try {
                const response = await fetch(`${API_URL}/task/${taskId}`);
                const data = await response.json();
                
                currentTasks[taskId] = {
                    ...currentTasks[taskId],
                    ...data
                };
            } catch (error) {
                console.error('Error al actualizar tarea:', error);
            }
        }
    }
    
    renderTasks();
}

function renderTasks() {
    const container = document.getElementById('tasksList');
    const tasks = Object.entries(currentTasks);
    
    if (tasks.length === 0) {
        container.innerHTML = '<p class="loading">No hay tareas en progreso</p>';
        return;
    }
    
    container.innerHTML = tasks.map(([taskId, task]) => `
        <div class="task-item ${task.status}">
            <div class="task-header">
                <div>
                    <strong>${task.title || 'Tarea'}</strong>
                    <div style="font-size: 0.9rem; color: var(--text-muted);">
                        ${task.type === 'download' ? '⬇️ Descarga' : '🎵 Separación'}
                    </div>
                </div>
                <div class="task-status ${task.status}">${getStatusText(task.status)}</div>
            </div>
            <div>${task.message || ''}</div>
            ${task.progress !== undefined ? `
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${task.progress}%"></div>
                </div>
            ` : ''}
        </div>
    `).join('');
}

function getStatusText(status) {
    const statusMap = {
        'downloading': 'Descargando',
        'processing': 'Procesando',
        'completed': 'Completado',
        'error': 'Error'
    };
    return statusMap[status] || status;
}

// === UTILIDADES ===
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// === EXPLORADOR Y REPRODUCTOR ===
function initExplorer() {
    // Event listeners para controles - verificar que existan
    const playSelectedBtn = document.getElementById('playSelectedBtn');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const restartBtn = document.getElementById('restartBtn');
    const stopBtn = document.getElementById('stopBtn');
    const clearQueueBtn = document.getElementById('clearQueueBtn');
    const refreshExplorerBtn = document.getElementById('refreshExplorerBtn');
    const progressBar = document.getElementById('progressBar');
    
    if (playSelectedBtn) playSelectedBtn.addEventListener('click', playSelected);
    if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlayPause);
    if (restartBtn) restartBtn.addEventListener('click', restartPlayback);
    if (stopBtn) stopBtn.addEventListener('click', stopPlayback);
    if (clearQueueBtn) clearQueueBtn.addEventListener('click', clearQueue);
    if (refreshExplorerBtn) {
        refreshExplorerBtn.addEventListener('click', () => {
            loadMusicTree();
        });
    }
    
    // Event listener para la barra de progreso
    if (progressBar) progressBar.addEventListener('input', seekToPosition);
}

async function loadMusicTree() {
    const container = document.getElementById('musicTree');
    container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Cargando biblioteca...</p></div>';
    
    try {
        const response = await fetch(`${API_URL}/music-tree`);
        const data = await response.json();
        
        if (data.success && data.tree.artists.length > 0) {
            musicTree = data.tree;
            renderMusicTree(data.tree);
        } else {
            container.innerHTML = '<p class="loading">No hay música en la biblioteca</p>';
        }
    } catch (error) {
        console.error('Error al cargar árbol:', error);
        container.innerHTML = '<p class="loading" style="color: var(--error-color);">Error al cargar biblioteca</p>';
    }
}

function renderMusicTree(tree) {
    const container = document.getElementById('musicTree');
    
    const html = tree.artists.map(artist => `
        <div class="tree-artist">
            <div class="tree-artist-header" onclick="toggleArtist('${escapeHtml(artist.name)}')">
                <span class="tree-icon">▶</span>
                <span class="tree-artist-name">👤 ${escapeHtml(artist.name)}</span>
                <span style="margin-left: auto; color: var(--text-muted); font-size: 0.9rem;">
                    ${artist.songs.length} canción${artist.songs.length !== 1 ? 'es' : ''}
                </span>
            </div>
            <div class="tree-songs" id="artist-${artist.name.replace(/[^a-zA-Z0-9]/g, '_')}">
                ${artist.songs.map(song => renderSong(artist.name, song)).join('')}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
    
    // Añadir event listeners a los botones de separar
    document.querySelectorAll('.btn-separate').forEach(btn => {
        btn.addEventListener('click', function() {
            const artistName = this.dataset.artist;
            const songName = this.dataset.song;
            const songPath = this.dataset.path;
            separateSong(artistName, songName, songPath, this);
        });
    });
}

function renderSong(artistName, song) {
    const songId = `${artistName}-${song.name}`.replace(/[^a-zA-Z0-9]/g, '_');
    
    if (!song.has_stems) {
        return `
            <div class="tree-song">
                <div class="tree-song-header">
                    <div class="tree-song-info">
                        <span class="tree-song-name">🎵 ${escapeHtml(song.name)}</span>
                        <span style="color: var(--text-muted); font-size: 0.8rem;">Sin pistas</span>
                    </div>
                    <div class="tree-song-actions">
                        <button class="btn-separate" data-artist="${escapeHtml(artistName)}" data-song="${escapeHtml(song.name)}" data-path="${escapeHtml(song.file_path)}">
                            🎸 Separar
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="tree-song">
            <div class="tree-song-header" onclick="toggleSong('${songId}')">
                <div class="tree-song-info">
                    <span class="tree-icon">▶</span>
                    <span class="tree-song-name">🎵 ${escapeHtml(song.name)}</span>
                    <span class="tree-song-badge">${song.stems.length} pistas</span>
                </div>
            </div>
            <div class="tree-stems" id="song-${songId}">
                ${song.stems.map(stem => renderStem(artistName, song.name, stem)).join('')}
            </div>
        </div>
    `;
}

function renderStem(artistName, songName, stem) {
    const stemIcons = {
        'vocals': '🎤',
        'drums': '🥁',
        'bass': '🎸',
        'guitar': '🎸',
        'piano': '🎹',
        'other': '🎼'
    };
    
    const icon = stemIcons[stem.name] || '🎵';
    const size = (stem.size / (1024 * 1024)).toFixed(2);
    const trackId = `${artistName}-${songName}-${stem.name}`.replace(/[^a-zA-Z0-9]/g, '_');
    
    return `
        <div class="tree-stem">
            <div class="tree-stem-info">
                <input type="checkbox" class="stem-checkbox" id="check-${trackId}"
                       onchange="toggleTrackSelection('${trackId}', '${escapeHtml(artistName)}', '${escapeHtml(songName)}', '${escapeHtml(stem.name)}', '${stem.file_path}')">
                <span class="stem-icon">${icon}</span>
                <span class="stem-name">${escapeHtml(stem.name)}</span>
            </div>
            <span class="stem-size">${size} MB</span>
        </div>
    `;
}

function toggleArtist(artistName) {
    const id = `artist-${artistName.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const element = document.getElementById(id);
    const header = element.previousElementSibling;
    
    element.classList.toggle('show');
    header.classList.toggle('expanded');
}

function toggleSong(songId) {
    const element = document.getElementById(`song-${songId}`);
    const header = element.previousElementSibling;
    
    element.classList.toggle('show');
    header.querySelector('.tree-icon').style.transform = 
        element.classList.contains('show') ? 'rotate(90deg)' : '';
}

function toggleTrackSelection(trackId, artist, song, stem, filePath) {
    const checkbox = document.getElementById(`check-${trackId}`);
    
    if (checkbox.checked) {
        selectedTracks.push({
            id: trackId,
            artist,
            song,
            stem,
            filePath,
            displayName: `${artist} - ${song} [${stem}]`
        });
    } else {
        selectedTracks = selectedTracks.filter(t => t.id !== trackId);
    }
    
    updateSelectedList();
}

function updateSelectedList() {
    const container = document.getElementById('selectedList');
    const count = document.getElementById('selectedCount');
    const playBtn = document.getElementById('playSelectedBtn');
    
    count.textContent = selectedTracks.length;
    // Siempre habilitar el botón
    if (playBtn) playBtn.disabled = false;
    
    console.log('updateSelectedList: selectedTracks.length =', selectedTracks.length);
    
    // Actualizar también los controles circulares
    updatePlayerUI();
    
    if (selectedTracks.length === 0) {
        container.innerHTML = '<p class="empty-queue">No hay pistas seleccionadas</p>';
        return;
    }
    
    container.innerHTML = selectedTracks.map(track => `
        <div class="selected-item">
            <span class="selected-item-name">${escapeHtml(track.displayName)}</span>
            <button class="selected-item-remove" onclick="removeFromSelected('${track.id}')">✕</button>
        </div>
    `).join('');
}

function removeFromSelected(trackId) {
    const checkbox = document.getElementById(`check-${trackId}`);
    if (checkbox) checkbox.checked = false;
    
    selectedTracks = selectedTracks.filter(t => t.id !== trackId);
    updateSelectedList();
}

let isPlaying = false;

function playSelected() {
    if (selectedTracks.length === 0) {
        console.log('No hay pistas seleccionadas');
        return;
    }
    
    console.log('=== Iniciando reproducción desde playSelected ===');
    startPlayback();
}

function startPlayback() {
    console.log('=== startPlayback ===');
    
    // Si ya hay reproducción, solo reanudar
    if (audioPlayers.length > 0 && !isPlaying) {
        console.log('Reanudando reproducción existente');
        audioPlayers.forEach(audio => audio.play());
        isPlaying = true;
        updatePlayerUI();
        return;
    }
    
    // Si no hay pistas seleccionadas, no hacer nada
    if (selectedTracks.length === 0) {
        console.log('No hay pistas para reproducir');
        return;
    }
    
    // Detener reproducción anterior
    stopAllAudio();
    
    playQueue = [...selectedTracks];
    updateQueueList();
    
    // Crear un reproductor para cada pista
    audioPlayers = playQueue.map((track, index) => {
        const audio = new Audio(`/${track.filePath}`);
        audio.volume = 1.0;
        
        console.log(`Creando reproductor ${index + 1}/${playQueue.length}: ${track.displayName}`);
        
        audio.addEventListener('error', (e) => {
            console.error(`Error al cargar ${track.displayName}:`, e);
        });
        
        // Evento cuando termina la reproducción
        audio.addEventListener('ended', () => {
            if (index === 0) { // Usar el primer audio como referencia
                console.log('Reproducción terminada');
                stopPlayback();
            }
        });
        
        // Evento cuando los metadatos están cargados (incluida la duración)
        if (index === 0) {
            audio.addEventListener('loadedmetadata', () => {
                console.log('Metadata cargada, duración:', audio.duration, 'segundos');
                updateProgress();
            });
            
            // Actualizar progreso durante la reproducción
            audio.addEventListener('timeupdate', () => {
                updateProgress();
            });
        }
        
        return audio;
    });
    
    console.log('audioPlayers creados:', audioPlayers.length);
    
    // Actualizar UI
    const npTitle = document.getElementById('npTitle');
    if (npTitle) {
        npTitle.textContent = `${playQueue.length} pista${playQueue.length > 1 ? 's' : ''}`;
    }
    
    // Reproducir todas las pistas simultáneamente
    console.log(`Reproduciendo ${audioPlayers.length} pistas...`);
    audioPlayers.forEach((audio, idx) => {
        audio.play().then(() => {
            console.log(`Audio ${idx + 1} reproduciendo`);
        }).catch(error => {
            console.error(`Error al reproducir audio ${idx + 1}:`, error);
        });
    });
    
    isPlaying = true;
    console.log('isPlaying =', isPlaying, 'audioPlayers.length =', audioPlayers.length);
    updatePlayerUI();
}

function togglePlayPause() {
    console.log('=== togglePlayPause ===');
    console.log('audioPlayers.length:', audioPlayers.length, 'isPlaying:', isPlaying);
    
    // Si no hay reproductores, iniciar reproducción
    if (audioPlayers.length === 0) {
        console.log('No hay reproductores, iniciando reproducción...');
        startPlayback();
        return;
    }
    
    if (isPlaying) {
        // Pausar
        console.log('Pausando reproducción');
        audioPlayers.forEach(audio => audio.pause());
        isPlaying = false;
    } else {
        // Reanudar
        console.log('Reanudando reproducción');
        audioPlayers.forEach(audio => {
            audio.play().catch(error => {
                console.error('Error al reanudar:', error);
            });
        });
        isPlaying = true;
    }
    
    updatePlayerUI();
}

function restartPlayback() {
    if (audioPlayers.length === 0) return;
    
    audioPlayers.forEach(audio => {
        audio.currentTime = 0;
        audio.play().catch(error => {
            console.error('Error al reiniciar:', error);
        });
    });
    
    isPlaying = true;
    updatePlayerUI();
}

function stopPlayback() {
    audioPlayers.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
    });
    
    isPlaying = false;
    updatePlayerUI();
    updateProgress();
}

function clearQueue() {
    stopAllAudio();
    playQueue = [];
    audioPlayers = [];
    isPlaying = false;
    
    const npTitle = document.getElementById('npTitle');
    const timeDisplay = document.getElementById('timeDisplay');
    const durationDisplay = document.getElementById('durationDisplay');
    const progressBar = document.getElementById('progressBar');
    
    if (npTitle) npTitle.textContent = 'Ninguna pista';
    if (timeDisplay) timeDisplay.textContent = '0:00';
    if (durationDisplay) durationDisplay.textContent = '0:00';
    if (progressBar) progressBar.value = 0;
    
    updateQueueList();
    updatePlayerUI();
}

function updatePlayerUI() {
    const hasQueue = audioPlayers.length > 0;
    const hasSelected = selectedTracks.length > 0;
    
    const playPauseBtn = document.getElementById('playPauseBtn');
    const progressBar = document.getElementById('progressBar');
    const restartBtn = document.getElementById('restartBtn');
    const stopBtn = document.getElementById('stopBtn');
    
    console.log('=== updatePlayerUI ===');
    console.log('audioPlayers.length:', audioPlayers.length);
    console.log('selectedTracks.length:', selectedTracks.length);
    console.log('hasQueue:', hasQueue, 'hasSelected:', hasSelected);
    console.log('isPlaying:', isPlaying);
    
    if (!playPauseBtn || !progressBar || !restartBtn || !stopBtn) {
        console.warn('Elementos del reproductor no encontrados');
        return;
    }
    
    // Actualizar botón play/pause - SIEMPRE HABILITADO
    playPauseBtn.textContent = isPlaying ? '⏸️' : '▶️';
    playPauseBtn.title = isPlaying ? 'Pausar' : (hasQueue ? 'Reanudar' : 'Reproducir');
    playPauseBtn.disabled = false; // SIEMPRE HABILITADO
    
    // Actualizar otros controles - SIEMPRE HABILITADOS
    restartBtn.disabled = false;
    stopBtn.disabled = false;
    progressBar.disabled = false;
    
    console.log('Todos los botones habilitados');
}

function updateProgress() {
    if (audioPlayers.length === 0) {
        console.log('updateProgress: No hay reproductores');
        return;
    }
    
    const progressBar = document.getElementById('progressBar');
    const timeDisplay = document.getElementById('timeDisplay');
    const durationDisplay = document.getElementById('durationDisplay');
    
    if (!progressBar || !timeDisplay || !durationDisplay) {
        console.warn('Elementos de progreso no encontrados');
        return;
    }
    
    const audio = audioPlayers[0]; // Usar el primer audio como referencia
    const currentTime = audio.currentTime;
    const duration = audio.duration;
    
    if (!isNaN(duration) && duration > 0) {
        const progress = (currentTime / duration) * 100;
        progressBar.value = progress;
        timeDisplay.textContent = formatTime(currentTime);
        durationDisplay.textContent = formatTime(duration);
    } else {
        console.log('Duración aún no disponible');
    }
}

function seekToPosition(e) {
    if (audioPlayers.length === 0) return;
    
    const audio = audioPlayers[0];
    const duration = audio.duration;
    
    if (!isNaN(duration) && duration > 0) {
        const seekTime = (e.target.value / 100) * duration;
        
        // Sincronizar todos los reproductores
        audioPlayers.forEach(player => {
            player.currentTime = seekTime;
        });
    }
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function stopAllAudio() {
    audioPlayers.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
    });
    audioPlayers = [];
}

function updateQueueList() {
    const container = document.getElementById('queueList');
    
    if (playQueue.length === 0) {
        container.innerHTML = '<p class="empty-queue">La cola está vacía</p>';
        return;
    }
    
    container.innerHTML = playQueue.map((track, index) => `
        <div class="queue-item">
            <span class="queue-item-name">
                ${escapeHtml(track.displayName)}
            </span>
            <button class="queue-item-remove" onclick="removeFromQueue(${index}, event)">✕</button>
        </div>
    `).join('');
}

function removeFromQueue(index, event) {
    if (event) event.stopPropagation();
    
    // Detener y eliminar el reproductor específico
    if (audioPlayers[index]) {
        audioPlayers[index].pause();
        audioPlayers[index].currentTime = 0;
    }
    
    playQueue.splice(index, 1);
    audioPlayers.splice(index, 1);
    
    if (playQueue.length === 0) {
        clearQueue();
        return;
    }
    
    updateQueueList();
    document.getElementById('npTitle').textContent = `${playQueue.length} pistas`;
    updatePlayerUI();
}

// === SEPARACIÓN DESDE EXPLORADOR ===
async function separateSong(artistName, songName, songPath, btn) {
    const originalText = btn.innerHTML;
    
    // Confirmar acción
    if (!confirm(`¿Deseas separar "${songName}" en pistas individuales?\n\nEsto creará una carpeta "${songName}" con 6 pistas (vocals, drums, bass, guitar, piano, other).`)) {
        return;
    }
    
    // Deshabilitar botón
    btn.disabled = true;
    btn.innerHTML = '⏳ Separando...';
    
    try {
        console.log('Separando canción:', songPath);
        
        const response = await fetch(`${API_URL}/separate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                file_path: songPath,
                model: 'htdemucs_6s'
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Error en la respuesta del servidor');
        }
        
        const data = await response.json();
        console.log('Respuesta del servidor:', data);
        
        if (data.success && data.task_id) {
            // Monitorear progreso
            const taskId = data.task_id;
            btn.innerHTML = '⏳ 0%';
            
            const checkProgress = setInterval(async () => {
                try {
                    const progressResponse = await fetch(`${API_URL}/task/${taskId}`);
                    const progressData = await progressResponse.json();
                    
                    console.log('Progreso:', progressData);
                    
                    if (progressData.status === 'completed') {
                        clearInterval(checkProgress);
                        btn.innerHTML = '✅ Completado';
                        
                        // Actualizar árbol después de 2 segundos
                        setTimeout(() => {
                            loadMusicTree();
                        }, 2000);
                        
                    } else if (progressData.status === 'error') {
                        clearInterval(checkProgress);
                        btn.disabled = false;
                        btn.innerHTML = originalText;
                        alert(`Error al separar: ${progressData.message || progressData.error || 'Error desconocido'}`);
                        
                    } else if (progressData.progress !== undefined) {
                        btn.innerHTML = `⏳ ${Math.round(progressData.progress)}%`;
                    }
                } catch (error) {
                    console.error('Error al verificar progreso:', error);
                }
            }, 1000);
            
        } else {
            throw new Error(data.message || 'No se recibió task_id del servidor');
        }
        
    } catch (error) {
        console.error('Error al separar:', error);
        btn.disabled = false;
        btn.innerHTML = originalText;
        alert(`Error al iniciar separación: ${error.message}`);
    }
}