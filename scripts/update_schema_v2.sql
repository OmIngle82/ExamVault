-- Add XP column to users if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='xp') THEN 
        ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0; 
    END IF; 
END $$;

-- Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, badge_id)
);

-- Add missing columns to submissions
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='submissions' AND column_name='start_time') THEN 
        ALTER TABLE submissions ADD COLUMN start_time TIMESTAMP; 
    END IF; 

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='submissions' AND column_name='violation_count') THEN 
        ALTER TABLE submissions ADD COLUMN violation_count INTEGER DEFAULT 0; 
    END IF; 

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='submissions' AND column_name='feedback') THEN 
        ALTER TABLE submissions ADD COLUMN feedback JSONB; 
    END IF; 
END $$;
