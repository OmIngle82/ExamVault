const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

async function migrate() {
    const client = await pool.connect();
    try {
        const schemaPath = path.join(__dirname, 'update_schema_v3.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Running v3 migration...');
        await client.query('BEGIN');
        await client.query(schemaSql);
        await client.query('COMMIT');
        console.log('Migration v3 complete.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration v3 failed:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
