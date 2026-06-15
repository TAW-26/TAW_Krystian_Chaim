const API_URL = 'http://localhost:3000/api';
let token = localStorage.getItem('token');
let currentUsername = localStorage.getItem('username');
let currentRole = localStorage.getItem('role'); // NOWE: Przechowuje rolę logowania
let currentEditingProjectId = null;

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let gameObjects = [];
let isPlayMode = false;
let activeTimers = [];
const objectSize = 40;
let canvasBgColor = '#1a2e1a';
let currentScore = 0;
const collectibleItems = ['🪙', '💎', '💰', '🌻', '🍄', '🌸'];

let currentTool = { category: 'player', emoji: '🤠' };
const enemySpeedMap = { '🦇': 400, '👾': 500, '🕷️': 600, '👻': 1000, '🦖': 1200, '🧟': 2000 };

if (token) { showDashboard(); }

// --- LOGOWANIE I REJESTRACJA ---
function toggleAuthForms() {
    const loginScreen = document.getElementById('login-screen');
    const registerScreen = document.getElementById('register-screen');
    if (loginScreen.style.display === 'none') {
        loginScreen.style.display = 'block'; registerScreen.style.display = 'none';
    } else {
        loginScreen.style.display = 'none'; registerScreen.style.display = 'block';
    }
}

async function register() {
    const user = document.getElementById('reg-username').value;
    const pass = document.getElementById('reg-password').value;
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });
        const data = await response.json();
        alert(data.message);
        if (response.ok) toggleAuthForms();
    } catch (err) { alert("Błąd rejestracji"); }
}

async function login() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });
        const data = await response.json();
        if (response.ok) {
            token = data.token;
            currentUsername = data.username;
            currentRole = data.role; // NOWE: Przypisywanie roli
            localStorage.setItem('token', token);
            localStorage.setItem('username', currentUsername);
            localStorage.setItem('role', currentRole);
            showDashboard();
        } else { alert(data.message); }
    } catch (err) { alert("Błąd połączenia z API."); }
}

function logout() {
    localStorage.clear();
    token = null; currentUsername = null; currentRole = null;
    document.getElementById('dashboard-screen').style.display = 'none';
    document.getElementById('editor-screen').style.display = 'none';
    document.getElementById('login-screen').style.display = 'block';
}

// --- FUNKCJE PULPITU (DASHBOARD) ---
function showDashboard() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('register-screen').style.display = 'none';
    document.getElementById('editor-screen').style.display = 'none';
    document.getElementById('dashboard-screen').style.display = 'block';

    // Ustawienie wyświetlania profilu i tagu admina
    const roleTag = currentRole === 'Admin' ? ' [ADMIN]' : '';
    document.getElementById('user-profile-display').innerText = `Zalogowany: ${currentUsername}${roleTag}`;

    loadAllGamesFromDatabase();
}

async function loadAllGamesFromDatabase() {
    const grid = document.getElementById('games-grid');
    grid.innerHTML = "<p>Pobieranie gier z bazy PostgreSQL...</p>";
    try {
        const response = await fetch(`${API_URL}/projects`, {
            method: 'GET', headers: { 'Authorization': `Bearer ${token}` }
        });
        const games = await response.json();
        grid.innerHTML = "";
        document.getElementById('stat-total-games').innerText = games.length;

        if(games.length === 0) {
            grid.innerHTML = "<p style='color:#aaa;'>Brak gier w bazie. Stwórz pierwszą planszę!</p>";
            return;
        }

        games.forEach(game => {
            const isAuthor = (game.author_name === currentUsername);
            const isAdmin = (currentRole === 'Admin'); // Sprawdzenie uprawnień

            const card = document.createElement('div');
            card.className = 'game-card';
            card.innerHTML = `
                <img src="${game.image_data || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='}" alt="Miniatura gry">
                <div class="game-card-body">
                    <h4>${game.title}</h4>
                    <p class="desc">${game.description || 'Brak opisu.'}</p>
                    <p class="author">Autor: ${game.author_name}</p>
                    <div class="game-card-actions">
                        ${isAuthor ? `<button class="btn-edit-g" onclick="openGameInEditor(${game.id}, ${true})">Edytuj</button>` : ''}
                        ${isAuthor || isAdmin ? `<button class="btn-delete-g" onclick="deleteGameFromDatabase(${game.id})">Usuń</button>` : ''}
                        ${!isAuthor ? `<button class="btn-play-g" onclick="openGameInEditor(${game.id}, ${false})">Podgląd/Graj</button>` : ''}
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (err) { grid.innerHTML = "<p class='error-msg'>Błąd ładowania danych.</p>"; }
}

function startNewGameProject() {
    currentEditingProjectId = null;
    gameObjects = [];
    document.getElementById('game-title').value = "Nowa Gra";
    document.getElementById('game-desc').value = "";
    document.getElementById('game-author').value = currentUsername;
    document.getElementById('editor-title-bar').innerText = "Kreator: Nowy Projekt";

    document.getElementById('dashboard-screen').style.display = 'none';
    document.getElementById('editor-screen').style.display = 'block';

    document.querySelector('.btn-save').style.display = 'inline-block';
    updateBgColor("#1a2e1a");
}

async function openGameInEditor(gameId, allowedToEdit) {
    try {
        const response = await fetch(`${API_URL}/projects`, {
            method: 'GET', headers: { 'Authorization': `Bearer ${token}` }
        });
        const games = await response.json();
        const selected = games.find(g => g.id === gameId);

        if (selected) {
            currentEditingProjectId = selected.id;
            document.getElementById('game-title').value = selected.title;
            document.getElementById('game-desc').value = selected.description;
            document.getElementById('game-author').value = selected.author_name;

            canvasBgColor = selected.mapData.bgColor || '#1a2e1a';
            document.getElementById('bg-color').value = canvasBgColor;
            document.getElementById('win-score-target').value = selected.mapData.winScore || 3;
            gameObjects = selected.mapData.objects || [];

            document.getElementById('dashboard-screen').style.display = 'none';
            document.getElementById('editor-screen').style.display = 'block';

            if(allowedToEdit) {
                document.getElementById('editor-title-bar').innerText = `Edycja: ${selected.title}`;
                document.querySelector('.btn-save').style.display = 'inline-block';
            } else {
                document.getElementById('editor-title-bar').innerText = `Podgląd: ${selected.title} (Tylko Odczyt)`;
                document.querySelector('.btn-save').style.display = 'none';
            }
            drawScene();
        }
    } catch(err) { alert("Błąd otwierania gry"); }
}

async function deleteGameFromDatabase(gameId) {
    if (!confirm("Czy na pewno chcesz bezpowrotnie usunąć tę grę z bazy danych?")) return;
    try {
        const response = await fetch(`${API_URL}/projects/${gameId}`, {
            method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        alert(data.message);
        loadAllGamesFromDatabase();
    } catch(err) { alert("Błąd usuwania gry."); }
}

function backToDashboard() {
    stopEnemyAI();
    isPlayMode = false;
    showDashboard();
}

// --- EDYTOR I ZAKŁADKI ---
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).style.display = 'block';
    event.currentTarget.classList.add('active');
    if (tabId === 'tab-player') setCurrentSelection('player', document.getElementById('select-player').value);
    if (tabId === 'tab-enemies') setCurrentSelection('enemy', document.getElementById('select-enemy').value);
    if (tabId === 'tab-walls') setCurrentSelection('wall', document.getElementById('select-wall').value);
    if (tabId === 'tab-decor') setCurrentSelection('decor', document.getElementById('select-decor').value);
}

function setCurrentSelection(category, emoji) {
    currentTool.category = category; currentTool.emoji = emoji;
    document.getElementById('btn-eraser').classList.remove('active');
    document.getElementById('active-tool-display').innerText = emoji;
}

function setEraserTool() {
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById('btn-eraser').classList.add('active');
    currentTool = { category: 'eraser', emoji: '🧽' };
    document.getElementById('active-tool-display').innerText = '🧽 Gumka';
}

function updateBgColor(color) { canvasBgColor = color; drawScene(); }

function drawScene() {
    ctx.fillStyle = canvasBgColor; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i < canvas.width; i += objectSize) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }
    ctx.font = "30px Arial"; ctx.textBaseline = "top";
    gameObjects.forEach(obj => { ctx.fillText(obj.emoji, obj.x + 4, obj.y + 2); });

    if (isPlayMode) {
        const target = document.getElementById('win-score-target').value;
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; ctx.fillRect(5, 5, 170, 35);
        ctx.fillStyle = "#FFD700"; ctx.font = "bold 20px Arial"; ctx.fillText(`Punkty: ${currentScore} / ${target}`, 15, 12);
    }
}

canvas.addEventListener('click', (e) => {
    if (isPlayMode) return;
    const rect = canvas.getBoundingClientRect();
    const snapX = Math.floor((e.clientX - rect.left) / objectSize) * objectSize;
    const snapY = Math.floor((e.clientY - rect.top) / objectSize) * objectSize;

    gameObjects = gameObjects.filter(obj => !(obj.x === snapX && obj.y === snapY));
    if (currentTool.category !== 'eraser') {
        if (currentTool.category === 'player') gameObjects = gameObjects.filter(obj => obj.category !== 'player');
        gameObjects.push({ category: currentTool.category, emoji: currentTool.emoji, x: snapX, y: snapY });
    }
    drawScene();
});

function clearCanvas() { gameObjects = []; drawScene(); }

// --- LOGIKA GRY ---
window.addEventListener('keydown', (e) => {
    if (!isPlayMode) return;
    const player = gameObjects.find(obj => obj.category === 'player');
    if (!player) return;

    let nextX = player.x; let nextY = player.y;
    if (e.key === 'ArrowUp') nextY -= objectSize;
    if (e.key === 'ArrowDown') nextY += objectSize;
    if (e.key === 'ArrowLeft') nextX -= objectSize;
    if (e.key === 'ArrowRight') nextX += objectSize;

    if (nextX < 0 || nextX >= canvas.width || nextY < 0 || nextY >= canvas.height) return;

    const targetObjects = gameObjects.filter(obj => obj.x === nextX && obj.y === nextY);
    if (!targetObjects.some(obj => obj.category === 'wall')) {
        player.x = nextX; player.y = nextY;
        const itemHit = targetObjects.find(obj => obj.category === 'decor');
        if (itemHit && collectibleItems.includes(itemHit.emoji)) {
            currentScore++;
            gameObjects = gameObjects.filter(obj => obj !== itemHit);
            checkWin();
        }
        drawScene(); checkGameOver();
    }
});

function startEnemyAI() {
    const modifier = parseInt(document.getElementById('ai-speed-modifier').value) / 100;
    gameObjects.forEach(obj => {
        if (obj.category === 'enemy') {
            const finalSpeed = (enemySpeedMap[obj.emoji] || 1000) / modifier;
            const timer = setInterval(() => {
                const direction = Math.floor(Math.random() * 4);
                let nextX = obj.x; let nextY = obj.y;
                if (direction === 0) nextY -= objectSize; if (direction === 1) nextY += objectSize;
                if (direction === 2) nextX -= objectSize; if (direction === 3) nextX += objectSize;

                if (nextX >= 0 && nextX < canvas.width && nextY >= 0 && nextY < canvas.height) {
                    const block = gameObjects.find(o => o.x === nextX && o.y === nextY && (o.category === 'wall' || o.category === 'enemy'));
                    if (!block) { obj.x = nextX; obj.y = nextY; }
                }
                drawScene(); checkGameOver();
            }, finalSpeed);
            activeTimers.push(timer);
        }
    });
}

function stopEnemyAI() { activeTimers.forEach(timer => clearInterval(timer)); activeTimers = []; }
function checkGameOver() {
    const player = gameObjects.find(obj => obj.category === 'player');
    if (!player) return;
    const enemyHit = gameObjects.find(obj => obj.category === 'enemy' && obj.x === player.x && obj.y === player.y);
    if (enemyHit) endGamePlay(`💥 Przegrana! Dopadł cię ${enemyHit.emoji}.`);
}
function checkWin() {
    const target = parseInt(document.getElementById('win-score-target').value) || 1;
    if (currentScore >= target) endGamePlay(`🎉 Zwycięstwo! Gra ukończona pomyślnie.`);
}
function endGamePlay(message) {
    stopEnemyAI(); isPlayMode = false;
    document.getElementById('play-btn').innerText = "Uruchom Grę (Play Mode)";
    document.getElementById('play-btn').style.backgroundColor = "#ff9800";
    setTimeout(() => { alert(message); reloadCurrentEditorState(); }, 50);
}

async function reloadCurrentEditorState() {
    if(currentEditingProjectId) {
        openGameInEditor(currentEditingProjectId, true);
    } else {
        gameObjects = []; drawScene();
    }
}

// --- ZAPIS Z MINIATURKĄ (BASE64) ---
async function saveProject() {
    const title = document.getElementById('game-title').value;
    const description = document.getElementById('game-desc').value;
    const author = document.getElementById('game-author').value;

    if(!title) return alert("Podaj nazwę gry!");

    const imageBase64String = canvas.toDataURL("image/png");

    const payload = {
        id: currentEditingProjectId,
        title: title,
        description: description,
        author: author,
        image_data: imageBase64String,
        mapData: {
            bgColor: canvasBgColor,
            winScore: document.getElementById('win-score-target').value,
            objects: gameObjects
        }
    };

    try {
        const response = await fetch(`${API_URL}/projects`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        alert(data.message);
        if(response.ok) showDashboard();
    } catch (err) { alert("Błąd zapisu w PostgreSQL."); }
}

function togglePlayMode() {
    isPlayMode = !isPlayMode;
    const btn = document.getElementById('play-btn');
    if (isPlayMode) {
        if (!gameObjects.some(obj => obj.category === 'player')) return alert("Dodaj gracza!");
        currentScore = 0; btn.innerText = "Stop Test Mode"; btn.style.backgroundColor = "#f44336";
        startEnemyAI(); drawScene();
    } else {
        btn.innerText = "Uruchom Grę (Play Mode)"; btn.style.backgroundColor = "#ff9800";
        stopEnemyAI(); reloadCurrentEditorState();
    }
}
