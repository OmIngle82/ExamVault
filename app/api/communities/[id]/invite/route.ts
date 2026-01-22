import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import db from '@/lib/db';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const cookieStore = await cookies();
    const session = cookieStore.get('auth_session');
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await decrypt(session.value);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { username } = await req.json();
    if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });

    try {
        // 1. Check if user exists
        const studentResult = await db.query('SELECT id FROM users WHERE username = $1 AND role = $2', [username, 'student']);
        const student = studentResult.rows[0];

        if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

        // 2. Check overlap
        const existingResult = await db.query('SELECT community_id FROM community_members WHERE community_id = $1 AND user_id = $2', [id, student.id]);

        if (existingResult.rows.length > 0) return NextResponse.json({ error: 'Already a member' }, { status: 409 });

        // 3. Add member
        await db.query('INSERT INTO community_members (community_id, user_id) VALUES ($1, $2)', [id, student.id]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to invite' }, { status: 500 });
    }
}
