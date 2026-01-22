const Database = require('better-sqlite3');
const db = new Database('timed-forms.db');

try {
    console.log('--- Checking Foreign Keys ---');
    const tables = ['questions', 'submissions', 'tests', 'community_members'];

    for (const table of tables) {
        const sql_info = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name=?`).get(table);
        console.log(`\nTable: ${table}`);
        console.log(sql_info.sql);
    }

} catch (e) {
    console.error(e);
}
