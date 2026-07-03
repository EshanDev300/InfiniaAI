const { pool } = require('../server/db');

async function test() {
    try {
        console.log('Testing connection...');
        const conn = await pool.getConnection();
        console.log('Connected successfully!');
        const [rows] = await conn.query('SHOW TABLES');
        console.log('Tables:', rows);
        conn.release();
    } catch (err) {
        console.error('Error object:', err);
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
    } finally {
        process.exit(0);
    }
}

test();
