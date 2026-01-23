-- Migration V5: Add Proctoring Settings
-- Adds a JSONB column to tests table to store security configurations
-- {
--   "enable_webcam": boolean,
--   "enable_audio": boolean,
--   "enable_fullscreen": boolean,
--   "tab_lock": boolean
-- }

ALTER TABLE tests 
ADD COLUMN IF NOT EXISTS proctoring_settings JSONB DEFAULT '{}';

-- Index for future filtering if needed
CREATE INDEX IF NOT EXISTS idx_tests_proctoring ON tests USING GIN (proctoring_settings);
