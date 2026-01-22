const Database = require('better-sqlite3');
const db = new Database('timed-forms.db');

try {
    console.log('Starting Migration...');

    db.exec('PRAGMA foreign_keys = OFF;');

    db.transaction(() => {
        // 1. Questions (Cascade Delete on Test)
        console.log('Migrating Questions...');
        db.exec(`CREATE TABLE questions_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            test_id INTEGER NOT NULL,
            type TEXT CHECK(type IN ('text', 'mcq')) NOT NULL,
            prompt TEXT NOT NULL,
            options TEXT,
            correct_answer TEXT,
            FOREIGN KEY(test_id) REFERENCES tests(id) ON DELETE CASCADE
        )`);
        db.exec('INSERT INTO questions_new SELECT * FROM questions');
        db.exec('DROP TABLE questions');
        db.exec('ALTER TABLE questions_new RENAME TO questions');

        // 2. Submissions (Cascade Delete on Test)
        console.log('Migrating Submissions...');
        db.exec(`CREATE TABLE submissions_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            test_id INTEGER NOT NULL,
            student_name TEXT NOT NULL,
            start_time TEXT NOT NULL,
            submit_time TEXT,
            answers TEXT,
            score INTEGER,
            total_questions INTEGER,
            violation_count INTEGER DEFAULT 0,
            FOREIGN KEY(test_id) REFERENCES tests(id) ON DELETE CASCADE
        )`);
        db.exec('INSERT INTO submissions_new SELECT id, test_id, student_name, start_time, submit_time, answers, score, total_questions, violation_count FROM submissions');
        db.exec('DROP TABLE submissions');
        db.exec('ALTER TABLE submissions_new RENAME TO submissions');

        // 3. Community Members (Cascade Delete on Community)
        console.log('Migrating Community Members...');
        db.exec(`CREATE TABLE community_members_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            community_id INTEGER NOT NULL,
            user_id TEXT NOT NULL,
            status TEXT DEFAULT 'joined',
            joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(community_id) REFERENCES communities(id) ON DELETE CASCADE
        )`);
        db.exec('INSERT INTO community_members_new SELECT * FROM community_members');
        db.exec('DROP TABLE community_members');
        db.exec('ALTER TABLE community_members_new RENAME TO community_members');

        // 4. Tests (Set Null on Community Delete)
        console.log('Migrating Tests...');
        // Note: We need to preserve all existing columns including recent adds like scheduled_at
        db.exec(`CREATE TABLE tests_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            duration_minutes INTEGER NOT NULL,
            start_time TEXT,
            end_time TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            scheduled_at DATETIME,
            community_id INTEGER,
            FOREIGN KEY(community_id) REFERENCES communities(id) ON DELETE SET NULL
        )`);
        db.exec('INSERT INTO tests_new SELECT id, title, description, duration_minutes, start_time, end_time, created_at, scheduled_at, community_id FROM tests');
        db.exec('DROP TABLE tests');
        db.exec('ALTER TABLE tests_new RENAME TO tests');

    })();

    db.exec('PRAGMA foreign_keys = ON;');
    console.log('Migration Complete.');

} catch (e) {
    console.error('Migration Failed:', e);
}
