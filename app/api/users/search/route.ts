import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');

    if (!q || q.length < 2) return NextResponse.json({ users: [] });

    try {
        const result = await db.query(`
        SELECT username, full_name, avatar_url FROM users 
        WHERE (username ILIKE $1 OR full_name ILIKE $1)
        LIMIT 5
      `, [`%${q}%`]);

        return NextResponse.json({ users: result.rows });
    } catch (error) {
        return NextResponse.json({ users: [] });
    }
}
