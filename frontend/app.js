const API_URL = 'http://localhost:3000/api';
let token = localStorage.getItem('token');

// Ustawienia Canvas / Tilemap
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const cols = 10;
const rows = 10;
const tileSize = 40; // 400px / 10
let mapData = Array(rows).fill().map(() => Array(cols).fill(0)); // Pusta mapa (same zera)
let isPlayMode = false;

// Kolory dla konkretnych typów (0 = trawa, 1 = ściana, 2 = gracz/NPC)
const colors = {
    0: '#7cfc00', // Jasnozielony
    1: '#808080', // Szary
    2: '#ff0000'  // Czerwony
};

// --- Inicjalizacja ---
if (token) {
    showEditor();
}

// --- Autoryzacja ---
async function login() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const errorMsg = document.getElementById('login-error');

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });
        const data = await response.json();

        if (response.ok) {
            token = data.token;
            localStorage.setItem('token', token);
            errorMsg.innerText = '';
            showEditor();
        } else {
            errorMsg.innerText = data.message;
        }
    } catch (err) {
        errorMsg.innerText = "Błąd łączenia z serwerem.";
    }
}

function logout() {
    localStorage.removeItem('token');
    token = null;
    document.getElementById('editor-screen').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
}

function showEditor() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('editor-screen').style.display = 'block';
    drawMap();
}

// --- Silnik 2D (Canvas) ---
function drawMap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const tile = mapData[y][x];
            ctx.fillStyle = colors[tile] || '#ffffff';
            ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            ctx.strokeStyle = '#000000'; // Rysowanie siatki
            ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
        }
    }
}

// Edytor kliknięć
canvas.addEventListener('click', (e) => {
    if (isPlayMode) return; // Zablokuj edycję w trybie gry

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Oblicz, który kwadrat został kliknięty
    const gridX = Math.floor(x / tileSize);
    const gridY = Math.floor(y / tileSize);

    // Pobierz wybrane narzędzie
    const selectedTile = parseInt(document.getElementById('tile-type').value);

    // Zaktualizuj mapę i przerysuj
    mapData[gridY][gridX] = selectedTile;
    drawMap();
});

// --- API Projektów ---
async function saveProject() {
    const statusMsg = document.getElementById('status-msg');
    try {
        const response = await fetch(`${API_URL}/projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name: 'Moja Pierwsza Gra', mapData: mapData })
        });

        if (response.ok) {
            statusMsg.innerText = "Zapisano pomyślnie!";
            setTimeout(() => statusMsg.innerText = "", 3000);
        } else {
            statusMsg.innerText = "Błąd zapisu (autoryzacja).";
        }
    } catch (err) {
        statusMsg.innerText = "Błąd serwera.";
    }
}

function playMode() {
    isPlayMode = !isPlayMode;
    const btn = document.querySelector('button[onclick="playMode()"]');
    if (isPlayMode) {
        btn.innerText = "Stop Play Mode";
        btn.style.backgroundColor = "#e74c3c";
        alert("Tryb gry aktywny! Edycja mapy zablokowana. Tutaj można dopisać logikę ruchu gracza na strzałkach.");
    } else {
        btn.innerText = "Play Mode";
        btn.style.backgroundColor = "";
    }
}