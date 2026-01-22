const Database = require('better-sqlite3');
const db = new Database('timed-forms.db');

try {
    const info = db.prepare("PRAGMA table_info(tests)").all();
    console.log("Schema:", info.map(c => c.name));

    const tests = db.prepare("SELECT id, title, scheduled_at FROM tests").all();
    console.log("Data:", tests);
} catch (e) {
    console.error(e);
}
