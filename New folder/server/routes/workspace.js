// workspace.js — User Workspace Content Engine
const express = require('express');
const { pool }  = require('./db');
const router    = express.Router();

router.use((req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ ok: false, message: 'Not authenticated.' });
    }
    next();
});

router.get('/chats', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, title, messages, created_at FROM chats WHERE user_id = ? ORDER BY created_at DESC', [req.session.userId]);
        return res.json({ ok: true, chats: rows });
    } catch (err) {
        return res.status(500).json({ ok: false });
    }
});

router.post('/chats', async (req, res) => {
    try {
        const { title, messages } = req.body;
        const [result] = await pool.query(
            'INSERT INTO chats (user_id, title, messages) VALUES (?, ?, ?)',
            [req.session.userId, title || 'New Chat', typeof messages === 'string' ? messages : JSON.stringify(messages || [])]
        );
        return res.status(201).json({ ok: true, chatId: result.insertId });
    } catch (err) {
        return res.status(500).json({ ok: false });
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

module.exports = router;
