const Database = require('better-sqlite3');
const db = new Database('timed-forms.db');

try {
    const columns = db.prepare("PRAGMA table_info(submissions)").all();
    console.log("Columns:", columns.map(c => c.name));
} catch (e) {
    console.error(e);
}
