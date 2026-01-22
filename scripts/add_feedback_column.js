const Database = require('better-sqlite3');
const db = new Database('timed-forms.db');

try {
    console.log('Checking for feedback column in submissions table...');
    const tableInfo = db.prepare("PRAGMA table_info(submissions)").all();
    const hasFeedback = tableInfo.some(col => col.name === 'feedback');

    if (!hasFeedback) {
        console.log('Adding feedback column...');
        db.prepare('ALTER TABLE submissions ADD COLUMN feedback TEXT').run();
        console.log('Success: Added feedback column.');
    } else {
        console.log('Info: feedback column already exists.');
    }
} catch (e) {
    console.error('Migration failed:', e);
}
