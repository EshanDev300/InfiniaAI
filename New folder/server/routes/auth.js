// routes/auth.js — Authentication API Routes
// POST /api/register  — Create new account
// POST /api/login     — Login and start session
// POST /api/logout    — End session
// GET  /api/me        — Return current session user

const express = require('express');
const bcrypt  = require('bcryptjs');
const { pool } = require('../db');

const router = express.Router();

// ─── Helper ────────────────────────────────────────────────────────────────
function respond(res, status, ok, message, data = {}) {
    return res.status(status).json({ ok, message, ...data });
}

// ─── POST /api/register ────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
    try {
        const { full_name, username, email, password } = req.body;

        // ── Validation ──
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
        // Strong password regex: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return respond(res, 400, false, 'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character (e.g. !@#$%).');
        }

        // ── Check existing user ──
        const [existingEmail] = await pool.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
        if (existingEmail.length > 0) {
            return respond(res, 409, false, 'This email is already registered. Please login instead.');
        }
        const [existingUsername] = await pool.query('SELECT id FROM users WHERE username = ?', [username.toLowerCase()]);
        if (existingUsername.length > 0) {
            return respond(res, 409, false, 'This username is already taken. Please choose another.');
        }

        // ── Hash password ──
        const hashedPassword = await bcrypt.hash(password, 12);

        // ── Insert user ──
        const [result] = await pool.query(
            'INSERT INTO users (full_name, username, email, password, tier) VALUES (?, ?, ?, ?, ?)',
            [full_name.trim(), username.trim().toLowerCase(), email.toLowerCase(), hashedPassword, 'FREE']
        );

        return respond(res, 201, true, 'Account created successfully! Welcome to Infinia AI.', {
            user: { id: result.insertId, full_name: full_name.trim(), username: username.trim().toLowerCase(), email: email.toLowerCase(), tier: 'FREE' }
        });

    } catch (err) {
        console.error('[REGISTER ERROR]', err);
        return respond(res, 500, false, 'Server error. Please try again later.');
    }
});

// ─── POST /api/login ───────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return respond(res, 400, false, 'Email and password are required.');
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return respond(res, 400, false, 'Enter a valid email address.');
        }

        // ── Find user ──
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
        if (rows.length === 0) {
            return respond(res, 401, false, 'Email not registered. Please create an account first.');
        }
        const user = rows[0];

        // ── Check password ──
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return respond(res, 401, false, 'Incorrect password. Please try again.');
        }

        // ── Create session ──
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
        res.clearCookie('infinia.sid');
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
            id:        req.session.userId,
            email:     req.session.userEmail,
            full_name: req.session.userName,
            tier:      req.session.userTier
        }
    });
});

module.exports = router;
