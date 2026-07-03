// db.js — MySQL2 Connection Pool Setup
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
    password: process.env.DB_PASSWORD || '',       
    database: process.env.DB_NAME     || 'infinia_ai',
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: true
    }
});

module.exports = { pool };
