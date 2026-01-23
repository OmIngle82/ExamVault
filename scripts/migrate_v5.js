const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Use provided connection string or local default
const connectionString = process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5432/timed_forms';

const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('Running Migration V5: Adding Proctoring Settings...');

        const sqlPath = path.join(__dirname, 'update_schema_v5.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');

        console.log('✅ Migration V5 applied successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration V5 failed:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
