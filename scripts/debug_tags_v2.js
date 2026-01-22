const Database = require('better-sqlite3');
const db = new Database('timed-forms.db');

try {
    console.log('--- Schema ---');
    const columns = db.prepare("PRAGMA table_info(tests)").all();
    console.log(columns.map(c => c.name));

    console.log('\n--- Latest 3 Tests ---');
    const tests = db.prepare("SELECT id, title, start_time, scheduled_at FROM tests ORDER BY id DESC LIMIT 3").all();
    console.log(tests);
} catch (e) {
    console.error(e);
}
