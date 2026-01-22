const Database = require('better-sqlite3');
const db = new Database('timed-forms.db');

try {
    console.log('Backfilling scheduled_at...');
    const info = db.prepare(`
    UPDATE tests 
    SET scheduled_at = start_time 
    WHERE scheduled_at IS NULL AND start_time IS NOT NULL
  `).run();
    console.log(`Updated ${info.changes} rows.`);

    const tags = db.prepare("SELECT id, title, start_time, scheduled_at FROM tests LIMIT 5").all();
    console.log(tags);
} catch (e) {
    console.error(e);
}
