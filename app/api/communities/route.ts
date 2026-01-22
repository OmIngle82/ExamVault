import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import db from '@/lib/db';

export async function GET() {
    const cookieStore = await cookies();
    const session = cookieStore.get('auth_session');
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await decrypt(session.value);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // Debug
        // console.log('Fetching communities for user:', user.id, user.role);

        if (user.role === 'admin') {
            const result = await db.query(`
                SELECT c.*, (SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = c.id) as member_count
                FROM communities c
                WHERE c.owner_id = $1
                ORDER BY c.created_at DESC
            `, [user.id]);
            const communities = result.rows;

            return NextResponse.json({ communities });
        } else {
            // Fetch joined communities
            const result = await db.query(`
                SELECT c.* FROM communities c
                JOIN community_members m ON c.id = m.community_id
                WHERE m.user_id = $1
                ORDER BY m.joined_at DESC
            `, [user.id]);
            const joined = result.rows;
            return NextResponse.json({ communities: joined });
        }
    } catch (error: any) {
        console.error('Communities API Error:', error);
        return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const cookieStore = await cookies();
    const session = cookieStore.get('auth_session');
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await decrypt(session.value);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, description } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    // Generate 6-char Code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
        const result = await db.query(
            'INSERT INTO communities (name, description, code, owner_id) VALUES ($1, $2, $3, $4) RETURNING id',
            [name, description || '', code, user.id]
        );
        return NextResponse.json({ success: true, id: result.rows[0].id, code });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
    }
}
