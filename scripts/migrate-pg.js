const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
    console.error('POSTGRES_URL is missing in .env');
    process.exit(1);
}

const pool = new Pool({ connectionString });

const schema = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK (role IN ('student', 'admin')) DEFAULT 'student'
  );

  CREATE TABLE IF NOT EXISTS tests (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    created_by INTEGER REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('mcq', 'text')),
    prompt TEXT NOT NULL,
    options JSONB, -- Stored as JSON array
    correct_answer TEXT
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id),
    student_username TEXT,
    answers JSONB, -- Key-value pair of questionId -> answer
    score INTEGER,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
`;

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Migrating database...');
        await client.query('BEGIN');
        await client.query(schema);
        await client.query('COMMIT');
        console.log('Migration complete!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
