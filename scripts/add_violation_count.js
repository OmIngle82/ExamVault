const Database = require('better-sqlite3');
const db = new Database('timed-forms.db');

try {
    console.log('Adding violation_count column to submissions table...');
    db.prepare("ALTER TABLE submissions ADD COLUMN violation_count INTEGER DEFAULT 0").run();
    console.log('Success!');
} catch (e) {
    if (e.message.includes('duplicate column name')) {
        console.log('Column already exists.');
    } else {
        console.error('Error:', e);
    }
}
