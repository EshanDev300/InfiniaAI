// routes/auth.js — Authentication API Routes
const express = require('express');
const { pool } = require('../db');

const router = express.Router();

function respond(res, status, ok, message, data = {}) {
    return res.status(status).json({ ok, message, ...data });
}

// ─── POST /api/register ────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
    try {
        const { full_name, username, email, password } = req.body;

        if (!full_name || !username || !email || !password) {
            return respond(res, 400, false, 'All fields are required.');
        }
        if (full_name.trim().length < 2) {
            return respond(res, 400, false, 'Full name must be at least 2 characters.');
        }
        if (username.trim().length < 3) {
            return respond(res, 400, false, 'Username must be at least 3 characters.');
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return respond(res, 400, false, 'Please enter a valid email address.');
        }

        const [existing] = await pool.query('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
        if (existing.length > 0) {
            return respond(res, 409, false, 'Email or Username already taken.');
        }

        await pool.query(
            'INSERT INTO users (full_name, username, email, password) VALUES (?, ?, ?, ?)',
            [full_name.trim(), username.trim().toLowerCase(), email.trim().toLowerCase(), password]
        );

        return respond(res, 201, true, 'Account created successfully!');
    } catch (err) {
        console.error('[REGISTRATION ERROR]', err);
        return respond(res, 500, false, 'Server error during registration.');
    }
});

// ─── POST /api/login ───────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return respond(res, 400, false, 'Email and password are required.');
        }

        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
        if (rows.length === 0) {
            return respond(res, 401, false, 'Invalid email or password.');
        }

        const user = rows[0];
        if (password !== user.password) {
            return respond(res, 401, false, 'Invalid email or password.');
        }

        req.session.userId    = user.id;
        req.session.userEmail = user.email;
        req.session.userName  = user.full_name;
        req.session.userTier  = user.tier;

        return respond(res, 200, true, `Welcome back, ${user.full_name}!`, {
            user: { id: user.id, full_name: user.full_name, username: user.username, email: user.email, tier: user.tier }
        });
    } catch (err) {
        console.error('[LOGIN ERROR]', err);
        return respond(res, 500, false, 'Server error. Please try again later.');
    }
});

// ─── POST /api/logout ──────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return respond(res, 500, false, 'Could not log out. Please try again.');
        }
        res.clearCookie('infinia_session');
        return respond(res, 200, true, 'Logged out successfully.');
    });
});

// ─── GET /api/me ──────────────────────────────────────────────────────────
router.get('/me', (req, res) => {
    if (!req.session || !req.session.userId) {
        return respond(res, 401, false, 'Not authenticated.');
    }
    return respond(res, 200, true, 'Session active.', {
        user: {
            id: req.session.userId,
            email: req.session.userEmail,
            full_name: req.session.userName,
            tier: req.session.userTier
        }
    });
});

module.exports = router;
