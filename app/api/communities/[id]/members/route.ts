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
        SELECT u.id as user_id, u.username, u.full_name, u.avatar_url, m.joined_at 
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

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const cookieStore = await cookies();
    const session = cookieStore.get('auth_session');
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await decrypt(session.value);
    // Only Admin can remove members
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { userIdToRemove } = await req.json();

        // Verify ownership (optional but good extra check, though role=admin is handled above)
        // We assume the caller checks logical ownership, but strict check:
        const commRes = await db.query('SELECT owner_id FROM communities WHERE id = $1', [id]);
        if (commRes.rows.length === 0) return NextResponse.json({ error: 'Community not found' }, { status: 404 });

        if (commRes.rows[0].owner_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden: Not the owner' }, { status: 403 });
        }

        await db.query(`
            DELETE FROM community_members 
            WHERE community_id = $1 AND user_id = $2
        `, [id, userIdToRemove]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
    }
}
