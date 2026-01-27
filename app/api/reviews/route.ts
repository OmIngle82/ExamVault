import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';

async function getUser() {
    const cookieStore = await cookies();
    const session = cookieStore.get('auth_session')?.value;
    if (!session) return null;
    return await decrypt(session);
}

export async function POST(req: Request) {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { test_id, question_id, code_snippet, language, message } = body;

        if (!code_snippet) {
            return NextResponse.json({ error: 'Code snippet is required' }, { status: 400 });
        }

        const res = await db.query(
            `INSERT INTO peer_reviews 
       (test_id, question_id, requester_username, code_snippet, language, status) 
       VALUES ($1, $2, $3, $4, $5, 'pending') 
       RETURNING *`,
            [test_id || null, question_id, user.username || user.id, code_snippet, language || 'python']
        );

        return NextResponse.json(res.rows[0]);
    } catch (error: any) {
        console.error('Create Review Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Get query param 'type'
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');

        let query = '';
        let params: any[] = [];

        if (type === 'mine') {
            query = `SELECT * FROM peer_reviews WHERE requester_username = $1 ORDER BY created_at DESC`;
            params = [user.username || user.id];
        } else {
            // Available reviews (not mine, pending)
            query = `SELECT * FROM peer_reviews WHERE status = 'pending' AND requester_username != $1 ORDER BY created_at DESC LIMIT 50`;
            params = [user.username || user.id];
        }

        const res = await db.query(query, params);

        return NextResponse.json(res.rows);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
