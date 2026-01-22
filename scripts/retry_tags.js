const Database = require('better-sqlite3');
const db = new Database('timed-forms.db');

try {
    console.log("Starting migration...");

    // Check columns
    const columns = db.prepare("PRAGMA table_info(tests)").all().map(c => c.name);

    if (!columns.includes('scheduled_at')) {
        console.log("Adding scheduled_at column...");
        db.prepare("ALTER TABLE tests ADD COLUMN scheduled_at DATETIME").run();
        console.log("Column added.");
    } else {
        console.log("Column scheduled_at already exists.");
    }

    // Update data
    const tests = db.prepare("SELECT id FROM tests").all();
    const now = new Date();

    if (tests.length > 0) {
        // Test 1: Today + 2 hours
        const t1 = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(); // ISO String for SQLite
        db.prepare("UPDATE tests SET scheduled_at = ? WHERE id = ?").run(t1, tests[0].id);
        console.log(`Updated Test ${tests[0].id} to ${t1}`);
    }

    if (tests.length > 1) {
        // Test 2: Tomorrow
        const t2 = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();
        db.prepare("UPDATE tests SET scheduled_at = ? WHERE id = ?").run(t2, tests[1].id);
        console.log(`Updated Test ${tests[1].id} to ${t2}`);
    }

    console.log("Migration complete.");

} catch (e) {
    console.error("MIGRATION ERROR:", e);
    process.exit(1);
}
