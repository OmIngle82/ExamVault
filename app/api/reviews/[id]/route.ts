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

// GET: Fetch single review details
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const user = await getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const res = await db.query('SELECT * FROM peer_reviews WHERE id = $1', [id]);
        if (res.rowCount === 0) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

        return NextResponse.json(res.rows[0]);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// POST: Submit feedback (Fulfill Review)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const user = await getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { feedback } = await req.json();
        if (!feedback) return NextResponse.json({ error: 'Feedback required' }, { status: 400 });

        // Ensure user is not reviewing their own code (optional, but good practice)
        const check = await db.query('SELECT requester_username FROM peer_reviews WHERE id = $1', [id]);
        if ((check.rowCount ?? 0) > 0 && check.rows[0].requester_username === user.username) {
            return NextResponse.json({ error: 'Cannot review your own code' }, { status: 403 });
        }

        const res = await db.query(
            `UPDATE peer_reviews 
             SET feedback = $1, reviewer_username = $2, status = 'completed' 
             WHERE id = $3 RETURNING *`,
            [feedback, user.username || user.id, id]
        );

        if (res.rowCount === 0) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

        return NextResponse.json(res.rows[0]);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
