-- Add community_id
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tests' AND column_name='community_id') THEN 
        ALTER TABLE tests ADD COLUMN community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE; 
    END IF; 
END $$;

-- Add start_time
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tests' AND column_name='start_time') THEN 
        ALTER TABLE tests ADD COLUMN start_time TIMESTAMP; 
    END IF; 
END $$;

-- Add end_time
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tests' AND column_name='end_time') THEN 
        ALTER TABLE tests ADD COLUMN end_time TIMESTAMP; 
    END IF; 
END $$;

-- Add scheduled_at
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tests' AND column_name='scheduled_at') THEN 
        ALTER TABLE tests ADD COLUMN scheduled_at TIMESTAMP; 
    END IF; 
END $$;

-- Add duration_minutes if missing (we had time_limit in original schema, code uses duration_minutes)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tests' AND column_name='duration_minutes') THEN 
        ALTER TABLE tests ADD COLUMN duration_minutes INTEGER; 
    END IF; 
END $$;
