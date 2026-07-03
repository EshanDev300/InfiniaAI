// server/server.js — Infinia AI Server Engine (Universal Deployment Core)
// ---------------------------------------------------------------------------------
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

// Serve static frontend assets correctly from parent root directory
const staticDir = path.join(__dirname, '../');
app.use(express.static(staticDir));

app.set('trust proxy', 1);

// Initialize a robust universal zero-dependency serverless session memory layout
if (!global.serverlessSessionStore) {
    global.serverlessSessionStore = { userId: null, userEmail: null, userName: null };
}

// Session routing inject bridge mapping
app.use((req, res, next) => {
    req.session = global.serverlessSessionStore;
    next();
});

// APIs Registration 
app.use('/api/auth', authRouter);
app.use('/api/workspace', workspaceRouter);

// Gemini AI Chat integration utilizing direct core low-level HTTP requests
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
            return res.status(500).json({ error: 'AI infrastructure did not return structural response node components.' });
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
    app.listen(PORT, () => console.log(`[CORE MODULE ENGINE ACTIVE] Local Node Port: ${PORT}`));
}
