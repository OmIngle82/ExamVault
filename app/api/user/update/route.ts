import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { decrypt, encrypt } from '@/lib/session';

export async function POST(request: NextRequest) {
    try {
        const sessionCookie = request.cookies.get('auth_session');
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const sessionUser = await decrypt(sessionCookie.value);
        if (!sessionUser) {
            return NextResponse.json({ error: 'Invalid Session' }, { status: 401 });
        }

        const { full_name, avatar_url } = await request.json();

        // Update User
        await db.query('UPDATE users SET full_name = $1, avatar_url = $2 WHERE username = $3',
            [full_name, avatar_url, sessionUser.username]
        );

        // Update Session with new details (optional, but good for consistency if we store them in token)
        // We currently store { id, username, role }. Let's keep it minimal or add full_name if needed.
        // For now, we won't rotate the token just for profile data unless it's critical. 
        // The client will fetch profile data from an API or we relies on the DB for profile info.
        // Ideally, we should create a 'me' endpoint or re-encrypt the session.

        // Let's update the session so the new name/avatar is available immediately if we use it from session.
        // Re-fetching from DB to get latest state
        const result = await db.query('SELECT * FROM users WHERE username = $1', [sessionUser.username]);
        const updatedUser = result.rows[0];

        const newPayload = {
            id: updatedUser.id,
            username: updatedUser.username,
            role: updatedUser.role,
            full_name: updatedUser.full_name,
            avatar_url: updatedUser.avatar_url
        };

        const newSessionToken = await encrypt(newPayload);

        const response = NextResponse.json({ success: true, user: newPayload });
        response.cookies.set('auth_session', newSessionToken, {
            httpOnly: true, // simplified options for update
            path: '/'
        });

        return response;

    } catch (error) {
        console.error('Update Profile Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
