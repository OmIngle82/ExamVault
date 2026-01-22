-- Enable UUID extension if needed, though we seem to use integer IDs for some things and UUIDs for others in various projects. 
-- Based on typical timed_forms schema inferred from usage.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user', -- 'student', 'teacher', 'admin'
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tests (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  questions JSONB NOT NULL, -- Storing questions as JSON
  time_limit INTEGER NOT NULL, -- in minutes
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  score INTEGER,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS communities (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL, -- Invite code
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS community_members (
  community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (community_id, user_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- For DM
  community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE, -- For Group Chat
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
