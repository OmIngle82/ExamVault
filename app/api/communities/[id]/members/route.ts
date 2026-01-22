import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import db from '@/lib/db';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const cookieStore = await cookies();
    const session = cookieStore.get('auth_session');
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await decrypt(session.value);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const result = await db.query(`
        SELECT u.username, u.full_name, u.avatar_url, m.joined_at 
        FROM community_members m
        JOIN users u ON m.user_id = u.id
        WHERE m.community_id = $1
        ORDER BY m.joined_at DESC
    `, [id]);

        return NextResponse.json({ members: result.rows });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
    }
}
