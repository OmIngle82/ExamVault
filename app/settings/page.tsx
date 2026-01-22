import db from '@/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import { redirect } from 'next/navigation';
import SettingsClient from './SettingsClient';
import { BADGES, BadgeId } from '@/lib/gamification';

export const revalidate = 0;

export default async function SettingsPage() {
    const cookieStore = await cookies();
    const session = cookieStore.get('auth_session');

    if (!session) {
        redirect('/login');
    }

    const user = await decrypt(session.value);
    if (!user) {
        redirect('/login');
    }

    // Fetch Full Profile
    const userResult = await db.query('SELECT full_name, avatar_url, xp FROM users WHERE id = $1', [user.id]);
    const dbUser = userResult.rows[0];

    // Fetch Badges
    // user_badges uses user_id (integer), not username (string)
    const badgesResult = await db.query('SELECT badge_id, earned_at as awarded_at FROM user_badges WHERE user_id = $1', [user.id]);
    const userBadges = badgesResult.rows as { badge_id: string, awarded_at: string }[];

    const enrichedBadges = userBadges.map(ub => {
        const badgeDef = BADGES[ub.badge_id as BadgeId];
        return {
            ...badgeDef,
            awardedAt: ub.awarded_at
        };
    }).filter(b => b.id); // Filter out unknown badges if any

    return (
        <SettingsClient
            initialFullName={dbUser?.full_name || ''}
            initialAvatar={dbUser?.avatar_url || ''}
            role={user.role}
            username={user.username}
            xp={dbUser?.xp || 0}
            badges={enrichedBadges}
        />
    );
}
