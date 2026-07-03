// auth.js — Session Authentication Routes Architecture
const express = require('express');
const { pool } = require('./db');
const router = express.Router();

function respond(res, status, ok, message, data = {}) {
    return res.status(status).json({ ok, message, ...data });
}

router.post('/register', async (req, res) => {
    try {
        const { full_name, username, email, password } = req.body;
        if (!full_name || !username || !email || !password) {
            return respond(res, 400, false, 'All fields are required.');
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
        return respond(res, 500, false, 'Database layer authentication crash.');
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return respond(res, 400, false, 'Email and password are required.');
        }

        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
        if (rows.length === 0 || password !== rows[0].password) {
            return respond(res, 401, false, 'Invalid email or password.');
        }

        const user = rows[0];
        req.session.userId    = user.id;
        req.session.userEmail = user.email;
        req.session.userName  = user.full_name;
        req.session.userTier  = user.tier || 'free';

        return respond(res, 200, true, 'Login successful', {
            user: { id: user.id, full_name: user.full_name, email: user.email }
        });
    } catch (err) {
        return respond(res, 500, false, 'Internal login session crash.');
    }
});

router.post('/logout', (req, res) => {
    if (!req.session) return respond(res, 200, true, 'Logged out.');
    req.session.destroy(() => {
        res.clearCookie('infinia_session');
        return respond(res, 200, true, 'Logged out successfully.');
    });
});

router.get('/me', (req, res) => {
    if (!req.session || !req.session.userId) {
        return respond(res, 401, false, 'Not authenticated.');
    }
    return respond(res, 200, true, 'Authenticated.', {
        user: { id: req.session.userId, email: req.session.userEmail, full_name: req.session.userName }
    });
});

module.exports = router;
