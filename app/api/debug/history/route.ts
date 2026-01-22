import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        // Bypass auth for debugging
        const messagesResult = await db.query("SELECT * FROM chat_messages");
        const usersResult = await db.query("SELECT username FROM users");

        return NextResponse.json({
            success: true,
            all_messages: messagesResult.rows,
            all_users: usersResult.rows
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
