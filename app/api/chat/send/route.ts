import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { decrypt } from '@/lib/session';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
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

        const { to, content } = await req.json();

        if (!to || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify recipient exists
        const recipientResult = await db.query('SELECT id FROM users WHERE username = $1', [to]);
        const recipient = recipientResult.rows[0];

        if (!recipient) {
            return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
        }

        // Insert message
        // Insert message
        const insertResult = await db.query(
            'INSERT INTO chat_messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING id',
            [user.id, recipient.id, content]
        );

        return NextResponse.json({ success: true, id: insertResult.rows[0].id });

    } catch (error) {
        console.error('Send message error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
