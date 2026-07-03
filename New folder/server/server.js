// server/server.js — Infinia AI Server Engine (Universal Cloud Core)
const express = require('express');
const cors = require('cors');
const path = require('path');
const { pool } = require('./db');

const authRouter = require('./auth');
const workspaceRouter = require('./workspace');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static assets from the parent root folder
const staticDir = path.join(__dirname, '../');
app.use(express.static(staticDir));

app.set('trust proxy', 1);

// Super stable global memory block for session tokens on cloud instances
if (!global.serverlessSessionStore) {
    global.serverlessSessionStore = { userId: null, userEmail: null, userName: null };
}

app.use((req, res, next) => {
    req.session = global.serverlessSessionStore;
    next();
});

// Register Module Router Subsystems
app.use('/api/auth', authRouter);
app.use('/api/workspace', workspaceRouter);

// Gemini Flash AI Dynamic Bridge via Native Endpoint
app.post('/api/chat', async (req, res) => {
    if (!global.serverlessSessionStore || !global.serverlessSessionStore.userId) {
        return res.status(401).json({ error: 'Please sign in first.' });
    }
    
    const { message } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API token key is unconfigured on the cloud engine.' });
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
            return res.status(500).json({ error: 'AI frame structure failed to render content nodes.' });
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
    app.listen(PORT, () => console.log(`[ENGINE ACTIVE] Running flawlessly on Port: ${PORT}`));
}
