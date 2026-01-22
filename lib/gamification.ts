import db from '@/lib/db';

export type BadgeId = 'first_steps' | 'on_fire' | 'speedster' | 'perfectionist';

export interface Badge {
    id: BadgeId;
    name: string;
    description: string;
    icon: string;
}

export const BADGES: Record<BadgeId, Badge> = {
    first_steps: {
        id: 'first_steps',
        name: 'First Steps',
        description: 'Completed your first test',
        icon: '🥇'
    },
    on_fire: {
        id: 'on_fire',
        name: 'On Fire',
        description: 'Scored 100% on 3 tests in a row',
        icon: '🔥'
    },
    speedster: {
        id: 'speedster',
        name: 'Speedster',
        description: 'Completed a test in less than 50% of the time',
        icon: '⚡'
    },
    perfectionist: {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Scored 100% on a test',
        icon: '💎'
    }
};

interface GameResult {
    xpEarned: number;
    badgesUnlocked: Badge[];
    newTotalXp: number;
}

export async function processGamification(
    userId: number,
    testId: number,
    score: number,
    totalQuestions: number,
    timeTakenSeconds: number,
    totalDurationSeconds: number
): Promise<GameResult> {

    // 1. Calculate XP
    // +10 per correct answer
    // +50 for passing (>50%)
    // +100 for perfect score
    // +20 for "Speed Bonus" if time < 50%

    let xp = score * 10;
    const isPass = (score / totalQuestions) >= 0.5;
    const isPerfect = score === totalQuestions;
    const isFast = timeTakenSeconds < (totalDurationSeconds * 0.5);

    if (isPass) xp += 50;
    if (isPerfect) xp += 100;
    if (isFast && isPass) xp += 20;

    // 2. Commit XP to DB
    const userResult = await db.query('SELECT xp FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user) {
        return { xpEarned: 0, badgesUnlocked: [], newTotalXp: 0 };
    }

    const newTotalXp = (user.xp || 0) + xp;
    await db.query('UPDATE users SET xp = $1 WHERE id = $2', [newTotalXp, userId]);

    // 3. check Badges
    const badgesUnlocked: Badge[] = [];
    const existingBadgesResult = await db.query('SELECT badge_id FROM user_badges WHERE user_id = $1', [userId]);
    const existingBadges = new Set(existingBadgesResult.rows.map(b => b.badge_id));

    // Helper to award
    const award = async (id: BadgeId) => {
        if (!existingBadges.has(id)) {
            await db.query('INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2)', [userId, id]);
            badgesUnlocked.push(BADGES[id]);
        }
    };

    // Rule: First Steps
    const totalSubmissionsResult = await db.query('SELECT COUNT(*) as count FROM submissions WHERE student_id = $1', [userId]);
    const count = parseInt(totalSubmissionsResult.rows[0].count);

    if (count >= 1) await award('first_steps');

    // Rule: Perfectionist
    if (isPerfect) await award('perfectionist');

    // Rule: Speedster
    if (isFast && isPass) await award('speedster');

    // Rule: On Fire (3 Perfect in a row)
    // Get last 3 submissions scores
    const last3Result = await db.query(`
        SELECT score, (SELECT jsonb_array_length(questions) FROM tests WHERE id = submissions.test_id) as total_questions 
        FROM submissions 
        WHERE student_id = $1 
        ORDER BY submitted_at DESC 
        LIMIT 3
    `, [userId]);

    const last3 = last3Result.rows;

    if (last3.length === 3 && last3.every(s => s.score === parseInt(s.total_questions))) {
        await award('on_fire');
    }

    return { xpEarned: xp, badgesUnlocked, newTotalXp };
}
