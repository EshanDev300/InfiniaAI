// db.js — MySQL2 connection pool
// -------------------------------------------------------
// Configure your MySQL credentials below or set ENV vars:
//   DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT
// -------------------------------------------------------

// Load environment variables from .env file (zero-dependency custom loader)
const fs = require('fs');
const path = require('path');
try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split(/\r?\n/).forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const delimiterIdx = trimmed.indexOf('=');
                if (delimiterIdx > 0) {
                    const key = trimmed.substring(0, delimiterIdx).trim();
                    let val = trimmed.substring(delimiterIdx + 1).trim();
                    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                        val = val.substring(1, val.length - 1);
                    }
                    process.env[key] = val;
                }
            }
        });
    }
} catch (err) {
    console.error('Error loading .env file:', err);
}

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',       // ← set your MySQL password
    database: process.env.DB_NAME     || 'infinia_ai',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection to the manual database and verify table existence
async function testConnection() {
    const conn = await pool.getConnection();
    try {
        // Query to check if the users table exists
        await conn.query('SELECT 1 FROM users LIMIT 1');
        console.log('[DB] ✅ Database connection verified. All tables are present.');
    } catch (err) {
        throw new Error(
            `Database connection failed or tables do not exist. ` +
            `Please ensure you have created the database "${process.env.DB_NAME || 'infinia_ai'}" ` +
            `and imported "schema.sql". Error details: ${err.message}`
        );
    } finally {
        conn.release();
    }
}

module.exports = { pool, testConnection };
