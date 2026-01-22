const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding database...');
    await client.query('BEGIN');

    // Clear existing
    // Order matters due to foreign keys
    await client.query('DELETE FROM chat_messages');
    await client.query('DELETE FROM community_members');
    await client.query('DELETE FROM submissions');
    await client.query('DELETE FROM questions');
    await client.query('DELETE FROM tests');
    await client.query('DELETE FROM communities');
    await client.query('DELETE FROM user_badges');
    await client.query('DELETE FROM users');

    // Create Users
    const adminHash = bcrypt.hashSync('admin123', 10);
    const studentHash = bcrypt.hashSync('student123', 10);

    const adminRes = await client.query('INSERT INTO users (username, password, role, full_name, xp) VALUES ($1, $2, $3, $4, $5) RETURNING id', ['admin', adminHash, 'admin', 'Admin User', 0]);
    const studentRes = await client.query('INSERT INTO users (username, password, role, full_name, xp) VALUES ($1, $2, $3, $4, $5) RETURNING id', ['student', studentHash, 'student', 'Student User', 0]);

    const adminId = adminRes.rows[0].id; // unused variable
    const studentId = studentRes.rows[0].id; // unused variable
    console.log('Seeded users: admin, student');

    // Create Community
    const commRes = await client.query('INSERT INTO communities (name, description, code, owner_id) VALUES ($1, $2, $3, $4) RETURNING id', ['General Science', 'Physics, Chemistry, and Biology', 'SCIENCE', adminRes.rows[0].id]);
    const commId = commRes.rows[0].id;
    console.log(`Seeded community: General Science (${commId})`);

    // Create a test that is active
    const now = new Date();
    const start = new Date(now.getTime() - 1000 * 60 * 60); // 1 hour ago
    const end = new Date(now.getTime() + 1000 * 60 * 60 * 24); // 24 hours from now

    // Define helper questions array for JSON column
    const questionsData = [
      { type: 'mcq', prompt: 'What is the capital of France?', options: ['Berlin', 'Madrid', 'Paris', 'Rome'], correctAnswer: 'Paris' },
      { type: 'mcq', prompt: 'Which planet is known as the Red Planet?', options: ['Earth', 'Mars', 'Jupiter', 'Venus'], correctAnswer: 'Mars' },
      { type: 'text', prompt: 'Describe the theory of relativity in brief.', options: [], correctAnswer: '' }
    ];

    const insertTestQuery = `
      INSERT INTO tests (title, description, duration_minutes, time_limit, start_time, end_time, community_id, scheduled_at, questions)
      VALUES ($1, $2, $3, $3, $4, $5, $6, $4, $7)
      RETURNING id
    `;

    const testResult = await client.query(insertTestQuery, [
      'General Knowledge Quiz',
      'A simple test to check your general knowledge.',
      10, // duration
      start,
      end,
      commId,
      JSON.stringify(questionsData)
    ]);

    const testId = testResult.rows[0].id;

    // Insert questions into separate table as well
    const insertQuestionQuery = `
      INSERT INTO questions (test_id, type, prompt, options, correct_answer)
      VALUES ($1, $2, $3, $4, $5)
    `;

    for (const q of questionsData) {
      await client.query(insertQuestionQuery, [
        testId,
        q.type,
        q.prompt,
        q.options ? JSON.stringify(q.options) : null,
        q.correctAnswer
      ]);
    }

    console.log(`Seeded test with ID: ${testId}`);

    await client.query('COMMIT');
    console.log('Seeding complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
