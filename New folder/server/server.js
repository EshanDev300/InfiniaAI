// server.js — Infinia AI Express Server Engine
// ---------------------------------------------------------------
const express      = require('express');
const cors         = require('cors');
const session      = require('express-session');
const MySQLStore   = require('express-mysql-session')(session);
const path         = require('path');
const { pool }     = require('./db');

const authRouter      = require('./auth');
const workspaceRouter = require('./workspace');
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

// Route Mapping Middleware
app.use('/api/auth', authRouter);
app.use('/api/workspace', workspaceRouter);

app.post('/api/chat', async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Please sign in first.' });
    }
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
        const filePath = path.join(staticDir, req.path);
        res.sendFile(filePath, (err) => {
            if (err) {
                res.sendFile(path.join(staticDir, 'index.html'));
            }
        });
    }
});

module.exports = app;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Engine listening on port ${PORT}`));
}
