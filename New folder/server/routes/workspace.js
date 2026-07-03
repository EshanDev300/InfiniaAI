// routes/workspace.js — CRUD API for Chats, Library, Projects
// All routes require an active session (userId in req.session)

const express = require('express');
const { pool }  = require('../db');
const router    = express.Router();

// ─── Middleware: require authentication ────────────────────────────────────
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

// GET /api/workspace/chats — list all chats for the logged-in user
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

// POST /api/workspace/chats — save a new chat
router.post('/chats', async (req, res) => {
    try {
        const { title, messages } = req.body;
        if (!title || !messages) {
            return res.status(400).json({ ok: false, message: 'Title and messages are required.' });
        }
        const [result] = await pool.query(
            'INSERT INTO chats (user_id, title, messages) VALUES (?, ?, ?)',
            [req.session.userId, title.trim(), JSON.stringify(messages)]
        );
        return res.status(201).json({ ok: true, chatId: result.insertId, message: 'Chat saved.' });
    } catch (err) {
        console.error('[CHATS POST ERROR]', err);
        return res.status(500).json({ ok: false, message: 'Could not save chat.' });
    }
});

// DELETE /api/workspace/chats/:id — delete a specific chat
router.delete('/chats/:id', async (req, res) => {
    try {
        const [result] = await pool.query(
            'DELETE FROM chats WHERE id = ? AND user_id = ?',
            [req.params.id, req.session.userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, message: 'Chat not found or unauthorized.' });
        }
        return res.json({ ok: true, message: 'Chat deleted.' });
    } catch (err) {
        console.error('[CHATS DELETE ERROR]', err);
        return res.status(500).json({ ok: false, message: 'Could not delete chat.' });
    }
});

// ════════════════════════════════════════════════════════════
//  LIBRARY (Saved Prompts)
// ════════════════════════════════════════════════════════════

// GET /api/workspace/library
router.get('/library', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, title, content, created_at FROM library WHERE user_id = ? ORDER BY created_at DESC',
            [req.session.userId]
        );
        return res.json({ ok: true, items: rows });
    } catch (err) {
        console.error('[LIBRARY GET ERROR]', err);
        return res.status(500).json({ ok: false, message: 'Could not fetch library.' });
    }
});

// POST /api/workspace/library
router.post('/library', async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title || !content) {
            return res.status(400).json({ ok: false, message: 'Title and content are required.' });
        }
        const [result] = await pool.query(
            'INSERT INTO library (user_id, title, content) VALUES (?, ?, ?)',
            [req.session.userId, title.trim(), content.trim()]
        );
        return res.status(201).json({ ok: true, itemId: result.insertId, message: 'Prompt saved to library.' });
    } catch (err) {
        console.error('[LIBRARY POST ERROR]', err);
        return res.status(500).json({ ok: false, message: 'Could not save to library.' });
    }
});

// DELETE /api/workspace/library/:id
router.delete('/library/:id', async (req, res) => {
    try {
        const [result] = await pool.query(
            'DELETE FROM library WHERE id = ? AND user_id = ?',
            [req.params.id, req.session.userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, message: 'Library item not found or unauthorized.' });
        }
        return res.json({ ok: true, message: 'Library item deleted.' });
    } catch (err) {
        console.error('[LIBRARY DELETE ERROR]', err);
        return res.status(500).json({ ok: false, message: 'Could not delete library item.' });
    }
});

// ════════════════════════════════════════════════════════════
//  PROJECTS
// ════════════════════════════════════════════════════════════

// GET /api/workspace/projects
router.get('/projects', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, name, description, created_at FROM projects WHERE user_id = ? ORDER BY created_at DESC',
            [req.session.userId]
        );
        return res.json({ ok: true, projects: rows });
    } catch (err) {
        console.error('[PROJECTS GET ERROR]', err);
        return res.status(500).json({ ok: false, message: 'Could not fetch projects.' });
    }
});

// POST /api/workspace/projects
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

// DELETE /api/workspace/projects/:id
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
