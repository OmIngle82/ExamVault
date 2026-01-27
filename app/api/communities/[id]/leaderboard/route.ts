import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';

// GET: Fetch XP leaderboard for community members
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const cookieStore = await cookies();
    const session = cookieStore.get('auth_session');

    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await decrypt(session.value);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const communityId = parseInt(id);

    try {
        // Members ranked by Global XP
        const result = await db.query(
            `SELECT u.id, u.username, u.full_name, u.avatar_url, u.xp
             FROM community_members cm
             JOIN users u ON cm.user_id = u.id
             WHERE cm.community_id = $1
             ORDER BY u.xp DESC NULLS LAST
             LIMIT 50`,
            [communityId]
        );

        return NextResponse.json({ leaderboard: result.rows });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
