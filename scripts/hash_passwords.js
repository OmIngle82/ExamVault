const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const db = new Database('timed-forms.db');

async function migrate() {
    console.log('Starting Password Migration...');
    const users = db.prepare('SELECT id, username, password FROM users').all();
    let migratedCount = 0;

    for (const user of users) {
        // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$ and are 60 chars)
        const isHashed = user.password.length === 60 && user.password.startsWith('$2');

        if (!isHashed) {
            console.log(`Hashing password for user: ${user.username}...`);
            const hashedPassword = await bcrypt.hash(user.password, 10);

            db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, user.id);
            migratedCount++;
        }
    }

    console.log(`Migration Complete. ${migratedCount} users updated.`);
}

migrate();
