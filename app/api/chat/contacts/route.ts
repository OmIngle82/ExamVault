import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { decrypt } from '@/lib/session';
import { cookies } from 'next/headers';

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

        // Find custom list of users interacted with
        // We group by the 'other' user and find the most recent timestamp
        const result = await db.query(`
      SELECT 
        u.username, 
        u.full_name, 
        u.avatar_url,
        MAX(m.created_at) as last_interaction
      FROM chat_messages m
      JOIN users u ON u.id = (CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END)
      WHERE m.sender_id = $1 OR m.receiver_id = $1
      GROUP BY u.id, u.username, u.full_name, u.avatar_url
      ORDER BY last_interaction DESC
    `, [user.id]);

        return NextResponse.json({ contacts: result.rows });

    } catch (error) {
        console.error('Fetch contacts error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
