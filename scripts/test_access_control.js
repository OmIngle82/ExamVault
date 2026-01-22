const Database = require('better-sqlite3');
const db = new Database('timed-forms.db');

try {
    console.log('--- Testing Access Control Queries ---');

    // MOCK USER: Student (Joined Community 1)
    const student = 'student1';
    const memberships = db.prepare('SELECT community_id FROM community_members WHERE user_id = ? AND status = ?').all(student, 'joined');
    const userCommunityIds = memberships.map(m => m.community_id);
    console.log('Student Community IDs:', userCommunityIds);

    const placeholders = userCommunityIds.length > 0 ? userCommunityIds.map(() => '?').join(',') : null;
    let query = `
    SELECT id, title, community_id
    FROM tests
    WHERE community_id IS NULL
  `;
    const params = [];

    if (placeholders) {
        query += ` OR community_id IN (${placeholders})`;
        params.push(...userCommunityIds);
    } else {
        console.log('Student has no communities.');
    }

    const tests = db.prepare(query).all(...params);
    console.log('Visible Tests for Student:', tests);

} catch (e) {
    console.error(e);
}
