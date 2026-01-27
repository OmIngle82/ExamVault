const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    try {
        const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tests';
    `);
        console.log(JSON.stringify(res.rows));
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
