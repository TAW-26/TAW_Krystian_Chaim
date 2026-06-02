const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;
const SECRET_KEY = 'super-tajny-klucz-zmien-go-pozniej'; // Do tokenów JWT

// Symulacja bazy danych
let users = [
    { id: 1, username: 'admin', password: '123', role: 'Admin' },
    { id: 2, username: 'user1', password: '123', role: 'User' }
];

let projects = []; // Tutaj będą zapisywane mapy i obiekty (jako JSON)

// Middleware do sprawdzania tokena (Autoryzacja)
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Brak tokena' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Nieważny token' });
        req.user = user;
        next();
    });
};

// Endpoint: Logowanie
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token, role: user.role });
    } else {
        res.status(401).json({ message: 'Nieprawidłowe dane logowania' });
    }
});

// Endpoint: Pobieranie projektów zalogowanego użytkownika
app.get('/api/projects', authenticateToken, (req, res) => {
    const userProjects = projects.filter(p => p.userId === req.user.id);
    res.json(userProjects);
});

// Endpoint: Zapisywanie projektu gry (Tilemap JSON)
app.post('/api/projects', authenticateToken, (req, res) => {
    const { name, mapData } = req.body;
    const newProject = {
        id: Date.now(),
        userId: req.user.id,
        name: name || 'Nowa Gra',
        mapData: mapData,
        createdAt: new Date()
    };
    projects.push(newProject);
    res.status(201).json({ message: 'Projekt zapisany!', project: newProject });
});

app.listen(PORT, () => {
    console.log(`Serwer działa na http://localhost:${PORT}`);
    console.log('UWAGA: Baza danych działa w trybie IN-MEMORY (dane znikną po restarcie).');
});