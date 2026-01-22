const Database = require('better-sqlite3');
const db = new Database('timed-forms.db');

try {
    const subs = db.prepare('SELECT id, student_name FROM submissions LIMIT 10').all();
    console.log('--- Submissions ---');
    console.log(subs);
} catch (e) {
    console.error(e);
}
