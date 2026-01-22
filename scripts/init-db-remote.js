const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

if (!process.env.POSTGRES_URL) {
    console.error("Error: POSTGRES_URL environment variable is missing.");
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: {
        rejectUnauthorized: false // Often required for managed Postgres services
    }
});

async function initRemoteDB() {
    const client = await pool.connect();
    try {
        console.log('Connecting to database...');

        const sqlPath = path.join(__dirname, 'init_postgres.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running initialization script...');
        await client.query(sqlContent);

        console.log('✅ Database initialized successfully.');
    } catch (err) {
        console.error('❌ Initialization failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

initRemoteDB();
