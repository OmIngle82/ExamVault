const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

async function clearDatabase() {
    const client = await pool.connect();
    try {
        console.log('⚠️  clearing ALL database data...');
        await client.query('BEGIN');

        // Order matters due to foreign keys
        await client.query('DELETE FROM chat_messages');
        await client.query('DELETE FROM community_members');
        await client.query('DELETE FROM submissions');
        await client.query('DELETE FROM questions');
        await client.query('DELETE FROM tests');
        await client.query('DELETE FROM communities');
        await client.query('DELETE FROM user_badges');
        await client.query('DELETE FROM users');

        await client.query('COMMIT');
        console.log('✅ Database cleared successfully.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Failed to clear database:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

clearDatabase();
