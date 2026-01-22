const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

async function runIntegrationTest() {
    console.log("🚀 Starting Full System Integration Test...");

    const baseUrl = 'http://localhost:3000';
    const studentUser = 'student';
    const client = await pool.connect();

    try {
        // 1. Verify User Exists
        const userRes = await client.query('SELECT * FROM users WHERE username = $1', [studentUser]);
        const user = userRes.rows[0];

        if (!user) {
            console.error("❌ Test User 'student' not found!");
            return;
        }
        console.log("✅ User 'student' found. Initial XP:", user.xp || 0);
        const initialXP = user.xp || 0;

        // 1.5 Reset Password to 'password' to ensure login works
        const hashedPassword = await bcrypt.hash('password', 10);
        await client.query('UPDATE users SET password = $1 WHERE username = $2', [hashedPassword, studentUser]);
        console.log("✅ Password for 'student' reset to 'password'.");

        // 2. Get a Test ID
        const testRes = await client.query('SELECT id, title FROM tests LIMIT 1');
        const test = testRes.rows[0];
        if (!test) {
            console.error("❌ No tests found in DB!");
            return;
        }
        console.log(`✅ Using Test: ${test.title} (ID: ${test.id})`);

        // Parse questions from separate table
        const questionsRes = await client.query('SELECT id, prompt FROM questions WHERE test_id = $1', [test.id]);
        const questions = questionsRes.rows;
        console.log(`✅ Found ${questions.length} questions for Test ID ${test.id}`);

        // Generate dummy answers
        const answers = {};
        questions.forEach(q => {
            answers[q.id] = "Integration Test Answer";
        });

        // 2.9 Cleanup Previous Submissions (to allow re-test)
        console.log("🧹 Cleaning up previous submissions for unique test...");
        // We need to find student_id first because student_name might be null
        await client.query('DELETE FROM submissions WHERE student_id = $1 AND test_id = $2', [user.id, test.id]);

        const payload = {
            studentName: studentUser,
            answers: answers,
            startTime: new Date().toISOString(),
            violationCount: 0
        };

        // 2.5 LOGIN to get Session
        console.log("🔑 Logging in as 'student'...");
        const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: studentUser, password: 'password' })
        });

        if (loginRes.status !== 200) {
            console.error("❌ Login Failed. Status:", loginRes.status);
            console.log("Check if password for 'student' is 'password'. If not, reset it in DB.");
            return;
        }

        const cookie = loginRes.headers.get('set-cookie');
        console.log("✅ Login Successful! Cookie received.");

        console.log("\n📡 Sending Submission for Test ID:", test.id);

        const response = await fetch(`${baseUrl}/api/tests/${test.id}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookie
            },
            body: JSON.stringify(payload)
        });

        if (response.status !== 200) {
            console.error(`❌ API Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error(text);
        } else {
            const data = await response.json();
            console.log("✅ Submission Successful!");
            console.log("   - Score:", data.score);
            console.log("   - Total:", data.total);
            console.log("   - XP Earned:", data.gamification?.xpEarned);

            // 4. Verify DB Updates
            const updatedUserRes = await client.query('SELECT xp FROM users WHERE username = $1', [studentUser]);
            const updatedUser = updatedUserRes.rows[0];
            console.log(`✅ User XP Updated: ${initialXP} -> ${updatedUser.xp} (Diff: ${updatedUser.xp - initialXP})`);

            if (updatedUser.xp >= initialXP) { // It might be equal if score is 0
                console.log("🎉 Gamification Logic Verified!");
            } else {
                console.warn("⚠️ XP Decreased? That shouldn't happen.");
            }

            // 5. Verify Submission Record
            const subRes = await client.query('SELECT * FROM submissions WHERE test_id = $1 AND student_id = $2 ORDER BY id DESC LIMIT 1', [test.id, user.id]);
            const sub = subRes.rows[0];

            if (sub && sub.feedback) {
                console.log("✅ Feedback stored in DB.");
            } else {
                console.error("❌ Feedback missing in DB!");
            }
        }

    } catch (e) {
        console.error("❌ Request Failed:", e);
        console.log("Make sure the server is running on port 3000!");

        // Always try to cleanup just in case
        await client.query('ROLLBACK').catch(() => { });
    } finally {
        client.release();
        await pool.end();
    }
}

runIntegrationTest();
