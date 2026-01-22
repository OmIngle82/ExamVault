import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
    const cookieStore = await cookies();
    const session = cookieStore.get('auth_session');
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await decrypt(session.value);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: 'Code is required' }, { status: 400 });

    try {
        // Check if community exists
        const comResult = await db.query('SELECT id FROM communities WHERE code = $1', [code.toUpperCase()]);
        const community = comResult.rows[0];

        if (!community) {
            return NextResponse.json({ error: 'Invalid code' }, { status: 404 });
        }

        // Check if already member
        const memResult = await db.query(
            'SELECT * FROM community_members WHERE community_id = $1 AND user_id = $2',
            [community.id, user.id]
        );

        if (memResult.rows.length > 0) {
            return NextResponse.json({ error: 'Already a member' }, { status: 409 });
        }

        await db.query(
            'INSERT INTO community_members (community_id, user_id) VALUES ($1, $2)',
            [community.id, user.id]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to join' }, { status: 500 });
    }
}
