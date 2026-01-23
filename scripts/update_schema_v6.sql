-- Migration V6: Live Mode Support
-- Adds columns to track real-time test state

ALTER TABLE tests 
ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'self_paced', -- 'self_paced' or 'live'
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',    -- 'draft', 'active', 'ended'
ADD COLUMN IF NOT EXISTS current_question_index INTEGER DEFAULT -1; -- -1 means not started, 0 is first question

-- Index for faster updates
CREATE INDEX IF NOT EXISTS idx_tests_status ON tests(status);
