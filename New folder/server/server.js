// server.js — Infinia AI Server Engine (Production-Ready Serverless Fallback)
// ---------------------------------------------------------------------------------
const express      = require('express');
const cors         = require('cors');
const path         = require('path');
const { pool }     = require('./db');

const authRouter      = require('./auth');
const workspaceRouter = require('./workspace');

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

// Zero-dependency memory pipeline initialization
app.use((req, res, next) => {
    if (!global.serverlessSessionStore) {
        global.serverlessSessionStore = { userId: null, userEmail: null, userName: null };
    }
    req.session = global.serverlessSessionStore;
    next();
});

// Route Interfaces Registration
app.use('/api/auth', authRouter);
app.use('/api/workspace', workspaceRouter);

// Native AI Gemini Engine Bridge via Core Native Fetch
app.post('/api/chat', async (req, res) => {
    if (!global.serverlessSessionStore || !global.serverlessSessionStore.userId) {
        return res.status(401).json({ error: 'Please sign in first.' });
    }
    
    const { message } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API token is missing on deployment config.' });
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: message }] }]
            })
        });

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
            return res.json({ reply: data.candidates[0].content.parts[0].text });
        } else {
            return res.status(500).json({ error: 'AI engine did not return text blocks.' });
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
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
    app.listen(PORT, () => console.log(`[CORE ENGINE READY] Port: ${PORT}`));
}
