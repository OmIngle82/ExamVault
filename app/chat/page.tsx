import ChatClient from './ChatClient';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import db from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function ChatPage() {
    const cookieStore = await cookies();
    const session = cookieStore.get('auth_session');

    if (!session) redirect('/login');

    const user = await decrypt(session.value);
    if (!user) redirect('/login');

    const result = await db.query('SELECT full_name, avatar_url FROM users WHERE id = $1', [user.id]);
    const dbUser = result.rows[0];
    const userWithProfile = {
        ...user,
        full_name: dbUser?.full_name || '',
        avatar_url: dbUser?.avatar_url || ''
    };

    return (
        <ChatClient currentUser={userWithProfile} />
    );
}
