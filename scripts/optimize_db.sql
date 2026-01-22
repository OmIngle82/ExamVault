-- Add indexes to foreign keys to speed up joins and lookups
CREATE INDEX IF NOT EXISTS idx_submissions_test_id ON submissions(test_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_questions_test_id ON questions(test_id);
CREATE INDEX IF NOT EXISTS idx_tests_community_id ON tests(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Analyze tables to update statistics for the query planner
ANALYZE submissions;
ANALYZE questions;
ANALYZE tests;
ANALYZE community_members;
ANALYZE users;
