// routes/workspace.js — CRUD API for Chats, Library, Projects
const express = require('express');
const { pool }  = require('../db');
const router    = express.Router();

function requireAuth(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ ok: false, message: 'Not authenticated.' });
    }
    next();
}
router.use(requireAuth);

// ════════════════════════════════════════════════════════════
//  CHATS
// ════════════════════════════════════════════════════════════
router.get('/chats', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, title, messages, created_at FROM chats WHERE user_id = ? ORDER BY created_at DESC',
            [req.session.userId]
        );
        return res.json({ ok: true, chats: rows });
    } catch (err) {
        console.error('[CHATS GET ERROR]', err);
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
        return res.status(201).json({ ok: true, chatId: result.insertId, message: 'Chat session saved.' });
    } catch (err) {
        console.error('[CHATS POST ERROR]', err);
        return res.status(500).json({ ok: false, message: 'Could not save chat.' });
    }
});

router.delete('/chats/:id', async (req, res) => {
    try {
        const [result] = await pool.query(
            'DELETE FROM chats WHERE id = ? AND user_id = ?',
            [req.params.id, req.session.userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, message: 'Chat not found or unauthorized.' });
        }
        return res.json({ ok: true, message: 'Chat cleared from history.' });
    } catch (err) {
        console.error('[CHATS DELETE ERROR]', err);
        return res.status(500).json({ ok: false, message: 'Could not delete chat.' });
    }
});

// ════════════════════════════════════════════════════════════
//  LIBRARY
// ════════════════════════════════════════════════════════════
router.get('/library', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, prompt_text, response_text, tags, created_at FROM library WHERE user_id = ? ORDER BY created_at DESC',
            [req.session.userId]
        );
        return res.json({ ok: true, library: rows });
    } catch (err) {
        console.error('[LIBRARY GET ERROR]', err);
        return res.status(500).json({ ok: false, message: 'Could not fetch library items.' });
    }
});

router.post('/library', async (req, res) => {
    try {
        const { prompt_text, response_text, tags } = req.body;
        if (!prompt_text || !response_text) {
            return res.status(400).json({ ok: false, message: 'Prompt text and response text are required.' });
        }
        const [result] = await pool.query(
            'INSERT INTO library (user_id, prompt_text, response_text, tags) VALUES (?, ?, ?, ?)',
            [req.session.userId, prompt_text.trim(), response_text.trim(), tags ? tags.trim() : '']
        );
        return res.status(201).json({ ok: true, itemId: result.insertId, message: 'Saved to library.' });
    } catch (err) {
        console.error('[LIBRARY POST ERROR]', err);
        return res.status(500).json({ ok: false, message: 'Could not save to library.' });
    }
});

router.delete('/library/:id', async (req, res) => {
    try {
        const [result] = await pool.query(
            'DELETE FROM library WHERE id = ? AND user_id = ?',
            [req.params.id, req.session.userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, message: 'Item not found or unauthorized.' });
        }
        return res.json({ ok: true, message: 'Removed from library.' });
    } catch (err) {
        console.error('[LIBRARY DELETE ERROR]', err);
        return res.status(500).json({ ok: false, message: 'Could not remove item.' });
    }
});

// ════════════════════════════════════════════════════════════
//  PROJECTS
// ════════════════════════════════════════════════════════════
router.get('/projects', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, name, description, updated_at FROM projects WHERE user_id = ? ORDER BY updated_at DESC',
            [req.session.userId]
        );
        return res.json({ ok: true, projects: rows });
    } catch (err) {
        console.error('[PROJECTS GET ERROR]', err);
        return res.status(500).json({ ok: false, message: 'Could not fetch projects.' });
    }
});

router.post('/projects', async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ ok: false, message: 'Project name is required.' });
        }
        const [result] = await pool.query(
            'INSERT INTO projects (user_id, name, description) VALUES (?, ?, ?)',
            [req.session.userId, name.trim(), (description || '').trim()]
        );
        return res.status(201).json({ ok: true, projectId: result.insertId, message: 'Project created.' });
    } catch (err) {
        console.error('[PROJECTS POST ERROR]', err);
        return res.status(500).json({ ok: false, message: 'Could not create project.' });
    }
});

router.delete('/projects/:id', async (req, res) => {
    try {
        const [result] = await pool.query(
            'DELETE FROM projects WHERE id = ? AND user_id = ?',
            [req.params.id, req.session.userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, message: 'Project not found or unauthorized.' });
        }
        return res.json({ ok: true, message: 'Project deleted.' });
    } catch (err) {
        console.error('[PROJECTS DELETE ERROR]', err);
        return res.status(500).json({ ok: false, message: 'Could not delete project.' });
    }
});

module.exports = router;
