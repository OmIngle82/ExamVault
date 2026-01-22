CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    prompt TEXT NOT NULL,
    options JSONB,
    correct_answer TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
