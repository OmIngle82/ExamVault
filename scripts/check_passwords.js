const Database = require('better-sqlite3');
const db = new Database('timed-forms.db');

const users = db.prepare('SELECT id, username, password FROM users').all();

console.log(`Found ${users.length} users.`);

users.forEach(u => {
    const isHash = u.password.startsWith('$2') && u.password.length === 60;
    console.log(`User: ${u.username} | Password format: ${isHash ? 'HASHED' : 'PLAIN TEXT'} | Length: ${u.password.length}`);
});
