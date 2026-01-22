const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'timed-forms.db');
const db = new Database(dbPath);

console.log('Initializing database...');

db.exec(`
  DROP TABLE IF EXISTS submissions;
  DROP TABLE IF EXISTS questions;
  DROP TABLE IF EXISTS tests;
  DROP TABLE IF EXISTS users;

  CREATE TABLE tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    start_time TEXT, -- ISO string
    end_time TEXT,   -- ISO string
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_id INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'text' or 'mcq'
    prompt TEXT NOT NULL,
    options TEXT, -- JSON string for options if MCQ
    correct_answer TEXT,
    FOREIGN KEY(test_id) REFERENCES tests(id)
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_id INTEGER NOT NULL,
    student_name TEXT NOT NULL,
    start_time TEXT NOT NULL,
    submit_time TEXT,
    answers TEXT, -- JSON string
    score INTEGER,
    total_questions INTEGER,
    FOREIGN KEY(test_id) REFERENCES tests(id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' -- 'admin' or 'student'
  );
`);

console.log('Database initialized successfully.');
