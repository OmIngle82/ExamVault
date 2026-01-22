const Database = require('better-sqlite3');
const db = new Database('timed-forms.db');

try {
    console.log('Starting Gamification Migration...');

    // 1. Add XP to users table
    const tableInfo = db.prepare("PRAGMA table_info(users)").all();
    const hasXp = tableInfo.some(col => col.name === 'xp');

    if (!hasXp) {
        console.log('Adding xp column to users...');
        db.prepare('ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0').run();
        console.log('Success: Added xp column.');
    } else {
        console.log('Info: xp column already exists.');
    }

    // 2. Create user_badges table
    console.log('Creating user_badges table...');
    db.prepare(`
        CREATE TABLE IF NOT EXISTS user_badges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            badge_id TEXT NOT NULL,
            awarded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(username) ON DELETE CASCADE,
            UNIQUE(user_id, badge_id)
        )
    `).run();
    console.log('Success: Created (or verified) user_badges table.');

} catch (e) {
    console.error('Migration failed:', e);
}
