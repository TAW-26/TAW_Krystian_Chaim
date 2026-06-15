const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = 3000;
const SECRET_KEY = 'super-tajny-klucz-zmien-go-pozniej';

app.use(express.static(path.join(__dirname, '../frontend')));

const pool = new Pool({
    host: '195.150.230.208',
    port: 5432,
    database: '2024_chaim_krystian',
    user: '2024_chaim_krystian',
    password: 'haslo'
});

const initDB = async () => {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS users (
                                                               id SERIAL PRIMARY KEY,
                                                               username TEXT UNIQUE,
                                                               password TEXT,
                                                               role TEXT
                          )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS games (
                                                               id SERIAL PRIMARY KEY,
                                                               userId INTEGER REFERENCES users(id),
            title TEXT,
            description TEXT,
            author_name TEXT,
            mapData TEXT,
            image_data TEXT,
            createdAt TEXT
            )`);

        const userCheck = await pool.query(`SELECT * FROM users WHERE username = 'admin'`);
        if (userCheck.rows.length === 0) {
            await pool.query(`INSERT INTO users (username, password, role) VALUES ('admin', '123', 'Admin')`);
            await pool.query(`INSERT INTO users (username, password, role) VALUES ('krystian', '123', 'User')`);
            console.log('Utworzono konta testowe: admin/123 (Admin) oraz krystian/123 (User)');
        }
        console.log('✅ Sukces: Połączono z bazą PostgreSQL i zweryfikowano tabele.');
    } catch (err) {
        console.error('❌ Błąd bazy danych:', err.message);
    }
};
initDB();

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Brak tokena' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Token nieaktywny' });
        req.user = user;
        next();
    });
};

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Uzupełnij pola' });
    try {
        const userCheck = await pool.query(`SELECT * FROM users WHERE username = $1`, [username]);
        if (userCheck.rows.length > 0) return res.status(400).json({ message: 'Login zajęty' });
        await pool.query(`INSERT INTO users (username, password, role) VALUES ($1, $2, 'User')`, [username, password]);
        res.status(201).json({ message: 'Zarejestrowano pomyślnie!' });
    } catch (err) { res.status(500).json({ message: 'Błąd rejestracji' }); }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query(`SELECT * FROM users WHERE username = $1 AND password = $2`, [username, password]);
        const user = result.rows[0];
        if (user) {
            const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '2h' });
            // Serwer wysyła teraz również rolę użytkownika
            res.json({ token, username: user.username, role: user.role });
        } else { res.status(401).json({ message: 'Błędne dane' }); }
    } catch (err) { res.status(500).json({ message: 'Błąd serwera' }); }
});

app.get('/api/projects', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM games ORDER BY id DESC`);
        const formatted = result.rows.map(p => ({
            id: p.id,
            userId: p.userid,
            title: p.title,
            description: p.description,
            author_name: p.author_name,
            image_data: p.image_data,
            mapData: JSON.parse(p.mapdata)
        }));
        res.json(formatted);
    } catch (err) { res.status(500).json({ message: 'Błąd pobierania list gier' }); }
});

app.post('/api/projects', authenticateToken, async (req, res) => {
    const { id, title, description, author, mapData, image_data } = req.body;
    const stringifiedMap = JSON.stringify(mapData);
    const createdAt = new Date().toISOString();

    try {
        if (id) {
            const check = await pool.query(`SELECT * FROM games WHERE id = $1`, [id]);
            if (check.rows[0].userid !== req.user.id && req.user.role !== 'Admin') {
                return res.status(403).json({ message: 'Brak uprawnień do edycji tego projektu!' });
            }
            await pool.query(
                `UPDATE games SET title=$1, description=$2, author_name=$3, mapData=$4, image_data=$5 WHERE id=$6`,
                [title, description, author, stringifiedMap, image_data, id]
            );
            return res.status(200).json({ message: 'Projekt zaktualizowany w bazie!', projectId: id });
        } else {
            const result = await pool.query(
                `INSERT INTO games (userId, title, description, author_name, mapData, image_data, createdAt) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                [req.user.id, title, description, author, stringifiedMap, image_data, createdAt]
            );
            return res.status(201).json({ message: 'Nowy projekt zapisany w bazie!', projectId: result.rows[0].id });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Błąd zapisu w PostgreSQL' });
    }
});

app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
    const projectId = req.params.id;
    try {
        const check = await pool.query(`SELECT * FROM games WHERE id = $1`, [projectId]);
        if (check.rows.length === 0) return res.status(404).json({ message: 'Nie znaleziono projektu' });

        if (check.rows[0].userid !== req.user.id && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Nie jesteś autorem ani administratorem! Usunięcie zablokowane.' });
        }

        await pool.query(`DELETE FROM games WHERE id = $1`, [projectId]);
        res.json({ message: 'Projekt został trwale usunięty z bazy.' });
    } catch (err) { res.status(500).json({ message: 'Błąd podczas usuwania' }); }
});

app.get('*', (req, res) => { res.sendFile(path.join(__dirname, '../frontend/index.html')); });
app.listen(PORT, () => { console.log(`🚀 Kreator gier działa na http://localhost:${PORT}`); });
