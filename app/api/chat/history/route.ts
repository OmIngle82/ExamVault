import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';
import { decrypt } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get('auth_session');

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await decrypt(session.value);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const otherUser = searchParams.get('other_user');

        if (!otherUser) {
            return NextResponse.json({ error: 'Missing other_user param' }, { status: 400 });
        }

        // Resolve other user ID
        const otherUserResult = await db.query('SELECT id FROM users WHERE username = $1', [otherUser]);
        const otherUserData = otherUserResult.rows[0];

        if (!otherUserData) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Fetch messages between current user and other user
        const result = await db.query(`
            SELECT m.*, u1.username as sender, u2.username as receiver
            FROM chat_messages m
            JOIN users u1 ON m.sender_id = u1.id
            JOIN users u2 ON m.receiver_id = u2.id
            WHERE (m.sender_id = $1 AND m.receiver_id = $2)
               OR (m.sender_id = $2 AND m.receiver_id = $1)
            ORDER BY m.created_at ASC
        `, [user.id, otherUserData.id]);

        const messages = result.rows;

        return NextResponse.json({ messages });

    } catch (error) {
        console.error('Fetch history error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
