const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const db = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, 'update_schema_v6.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running migration v6...');
        await db.query(sql);
        console.log('Migration v6 completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await db.end();
    }
}

runMigration();
