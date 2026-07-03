// server.js — Infinia AI Express Server Engine
// ---------------------------------------------------------------

const fs = require('fs');
const path = require('path');

try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split(/\r?\n/).forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const delimiterIdx = trimmed.indexOf('=');
                if (delimiterIdx > 0) {
                    const key = trimmed.substring(0, delimiterIdx).trim();
                    let val = trimmed.substring(delimiterIdx + 1).trim();
                    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                        val = val.substring(1, val.length - 1);
                    }
                    process.env[key] = val;
                }
            }
        });
    }
} catch (err) {
    console.error('Error loading .env file:', err);
}

const express      = require('express');
const cors         = require('cors');
const session      = require('express-session');
const MySQLStore   = require('express-mysql-session')(session);
const { pool, testConnection } = require('./db');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const staticDir = path.join(__dirname, '../');
app.use(express.static(staticDir));

// Vercel Session Management Fix
app.set('trust proxy', 1);

const sessionStore = new MySQLStore({
    createDatabaseTable: true,
    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
}, pool);

app.use(session({
    key: 'infinia_session',
    secret: process.env.SESSION_SECRET || 'infinia-default-encryption-key-2026',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true, 
        maxAge: 1000 * 60 * 60 * 24,
        sameSite: 'lax'
    }
}));

// API Routes
app.post('/api/auth/signup', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (rows.length > 0) {
            return res.status(400).json({ message: 'Email already registered.' });
        }
        await pool.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, password]);
        res.status(201).json({ ok: true });
    } catch (err) {
        res.status(500).json({ message: 'Database failure during operations.' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }
        req.session.userId = rows[0].id;
        req.session.userName = rows[0].name;
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ message: 'Internal server login error.' });
    }
});

app.get('/api/auth/user', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: 'Unauthorized' });
    res.json({ id: req.session.userId, name: req.session.userName });
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ ok: true });
    });
});

app.post('/api/chat', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Please sign in first.' });
    const { message } = req.body;
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const aiResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: message,
        });
        res.json({ reply: aiResponse.text });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(staticDir, 'index.html'));
    }
});

module.exports = app;

if (process.env.NODE_ENV !== 'production') {
    testConnection().then(() => {
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    }).catch(err => console.error(err));
}
