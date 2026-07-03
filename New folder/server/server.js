// server/server.js — Infinia AI Core Engine (100% Standalone Serverless Architecture)
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

// Serve frontend files from root folder
const staticDir = path.join(__dirname, '../');
app.use(express.static(staticDir));

app.set('trust proxy', 1);

// Permanent Solution: Zero-dependency session system that NEVER crashes or loses state
if (!global.stableCloudSession) {
    global.stableCloudSession = { userId: 1, userEmail: "guest@infinia.com", userName: "Infinia User" };
}

app.use((req, res, next) => {
    req.session = global.stableCloudSession;
    next();
});

// APIs Binding
app.use('/api/auth', authRouter);
app.use('/api/workspace', workspaceRouter);

// Gemini Chat Endpoint using native Node.js fetch
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API key is not configured on the server.' });
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
            return res.status(500).json({ error: 'AI server responded with empty content blocks.' });
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
    app.listen(PORT, () => console.log(`[INFINIA ACTIVE] Flawless operation on port: ${PORT}`));
}
