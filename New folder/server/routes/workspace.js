// workspace.js — CRUD API for Chats, Library, Projects
const express = require('express');
// Fixed: Uniform safe pathing link
const { pool }  = require('./db');
const router    = express.Router();

function requireAuth(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ ok: false, message: 'Not authenticated.' });
    }
    next();
}
router.use(requireAuth);

router.get('/chats', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, title, messages, created_at FROM chats WHERE user_id = ? ORDER BY created_at DESC',
            [req.session.userId]
        );
        return res.json({ ok: true, chats: rows });
    } catch (err) {
        return res.status(500).json({ ok: false, message: 'Could not fetch chats.' });
    }
});

router.post('/chats', async (req, res) => {
    try {
        const { title, messages } = req.body;
        const chatTitle = title ? title.trim() : 'New AI Conversation';
        const msgsString = typeof messages === 'string' ? messages : JSON.stringify(messages || []);

        const [result] = await pool.query(
            'INSERT INTO chats (user_id, title, messages) VALUES (?, ?, ?)',
            [req.session.userId, chatTitle, msgsString]
        );
        return res.status(201).json({ ok: true, chatId: result.insertId });
    } catch (err) {
        return res.status(500).json({ ok: false, message: 'Could not save chat.' });
    }
});

router.delete('/chats/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM chats WHERE id = ? AND user_id = ?', [req.params.id, req.session.userId]);
        return res.json({ ok: true });
    } catch (err) {
        return res.status(500).json({ ok: false });
    }
});

router.get('/library', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM library WHERE user_id = ? ORDER BY created_at DESC', [req.session.userId]);
        return res.json({ ok: true, library: rows });
    } catch (err) {
        return res.status(500).json({ ok: false });
    }
});

router.post('/library', async (req, res) => {
    try {
        const { prompt_text, response_text, tags } = req.body;
        await pool.query(
            'INSERT INTO library (user_id, prompt_text, response_text, tags) VALUES (?, ?, ?, ?)',
            [req.session.userId, prompt_text, response_text, tags || '']
        );
        return res.status(201).json({ ok: true });
    } catch (err) {
        return res.status(500).json({ ok: false });
    }
});

router.get('/projects', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC', [req.session.userId]);
        return res.json({ ok: true, projects: rows });
    } catch (err) {
        return res.status(500).json({ ok: false });
    }
});

router.post('/projects', async (req, res) => {
    try {
        const { name, description } = req.body;
        await pool.query('INSERT INTO projects (user_id, name, description) VALUES (?, ?, ?)', [req.session.userId, name, description || '']);
        return res.status(201).json({ ok: true });
    } catch (err) {
        return res.status(500).json({ ok: false });
    }
});

module.exports = router;
