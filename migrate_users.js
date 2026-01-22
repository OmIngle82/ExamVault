const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'timed-forms.db');
const db = new Database(dbPath);

console.log('Migrating database...');

try {
    // Check/Add full_name
    try {
        db.prepare('ALTER TABLE users ADD COLUMN full_name TEXT').run();
        console.log('Added full_name column.');
    } catch (err) {
        if (err.message.includes('duplicate column')) {
            console.log('full_name column already exists.');
        } else {
            throw err;
        }
    }

    // Check/Add avatar_url
    try {
        db.prepare('ALTER TABLE users ADD COLUMN avatar_url TEXT').run();
        console.log('Added avatar_url column.');
    } catch (err) {
        if (err.message.includes('duplicate column')) {
            console.log('avatar_url column already exists.');
        } else {
            throw err;
        }
    }

    console.log('Migration complete.');
} catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
}
