// API Base URL
const API_URL = 'http://localhost:8000/api';

// Estado global
let currentTasks = {};
let currentSongForSeparation = null;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initSearch();
    initLibrary();
    initModal();
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
    const artist = artistInput?.value.trim() || null;
    
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
