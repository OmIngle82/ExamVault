const Database = require('better-sqlite3');
const db = new Database('timed-forms.db');

try {
    console.log('Creating communities table...');
    db.prepare(`
    CREATE TABLE IF NOT EXISTS communities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      admin_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

    console.log('Creating community_members table...');
    db.prepare(`
    CREATE TABLE IF NOT EXISTS community_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      community_id INTEGER NOT NULL,
      user_id TEXT NOT NULL, -- username
      status TEXT DEFAULT 'joined', -- 'joined', 'invited'
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(community_id) REFERENCES communities(id)
    )
  `).run();

    console.log('Adding community_id to tests table...');
    try {
        db.prepare("ALTER TABLE tests ADD COLUMN community_id INTEGER").run();
    } catch (e) {
        if (!e.message.includes('duplicate column name')) {
            console.error(e); // Only log real errors
        } else {
            console.log('community_id already exists.');
        }
    }

    console.log('Migration successful!');
} catch (e) {
    console.error('Migration failed:', e);
}
