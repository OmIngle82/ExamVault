import db from '@/lib/db';

export async function getUserProfile(userId: number) {
    try {
        const result = await db.query('SELECT full_name, avatar_url FROM users WHERE id = $1', [userId]);
        return result.rows[0] || {};
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return {};
    }
}
