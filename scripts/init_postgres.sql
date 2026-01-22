-- Consolidated Postgres Schema for Timed Forms

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student', -- 'student', 'admin'
  full_name TEXT,
  avatar_url TEXT,
  xp INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Communities
CREATE TABLE IF NOT EXISTS communities (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Community Members
CREATE TABLE IF NOT EXISTS community_members (
  community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (community_id, user_id)
);

-- 4. Tests
CREATE TABLE IF NOT EXISTS tests (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  time_limit INTEGER, -- Legacy/Redundant? Keeping for safety
  start_time TIMESTAMP, -- Availability Start
  end_time TIMESTAMP,   -- Availability End
  scheduled_at TIMESTAMP,
  community_id INTEGER REFERENCES communities(id) ON DELETE SET NULL,
  questions JSONB, -- Stored JSON copy for quick load
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Questions (Normalized)
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'text' or 'mcq'
  prompt TEXT NOT NULL,
  correct_answer TEXT,
  options JSONB, -- Array of strings for MCQs
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Submissions
CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  score INTEGER DEFAULT 0,
  violation_count INTEGER DEFAULT 0,
  feedback JSONB, -- AI Feedback
  start_time TIMESTAMP,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. User Badges
CREATE TABLE IF NOT EXISTS user_badges (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, badge_id)
);

-- 8. Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_submissions_test_id ON submissions(test_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_questions_test_id ON questions(test_id);
CREATE INDEX IF NOT EXISTS idx_tests_community_id ON tests(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
