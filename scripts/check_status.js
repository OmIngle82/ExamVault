const Database = require('better-sqlite3');
const db = new Database('timed-forms.db');

try {
    const info = db.prepare("PRAGMA table_info(tests)").all();
    const hasCol = info.find(c => c.name === 'scheduled_at');
    console.log("Has scheduled_at:", !!hasCol);

    if (hasCol) {
        const data = db.prepare("SELECT id, title, scheduled_at FROM tests").all();
        console.log("Data:", data);
    }
} catch (e) {
    console.error(e);
}
