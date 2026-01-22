const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

async function applyIndexes() {
    const client = await pool.connect();
    try {
        console.log('Applying database indexes...');

        // List of index creation queries
        const queries = [
            "CREATE INDEX IF NOT EXISTS idx_submissions_test_id ON submissions(test_id);",
            "CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);",
            "CREATE INDEX IF NOT EXISTS idx_questions_test_id ON questions(test_id);",
            "CREATE INDEX IF NOT EXISTS idx_tests_community_id ON tests(community_id);",
            "CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON community_members(user_id);",
            "CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON community_members(community_id);",
            "CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);",
            "CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);"
        ];

        for (const query of queries) {
            console.log(`Executing: ${query}`);
            await client.query(query);
        }

        console.log('Running ANALYZE...');
        await client.query("ANALYZE;");

        console.log('Successfully applied all indexes.');
    } catch (err) {
        console.error('Failed to apply indexes:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

applyIndexes();
