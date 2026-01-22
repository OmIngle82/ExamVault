import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import db from '@/lib/db';
import { redirect } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';
import StudentCommunitiesClient from './StudentCommunitiesClient';

export default async function StudentCommunitiesPage() {
    const cookieStore = await cookies();
    const session = cookieStore.get('auth_session');

    if (!session) redirect('/login');

    const user = await decrypt(session.value);
    if (!user) redirect('/login');

    // Fetch full profile
    const result = await db.query('SELECT full_name, avatar_url FROM users WHERE id = $1', [user.id]);
    const dbUser = result.rows[0];
    const fullName = dbUser?.full_name || '';
    const avatarUrl = dbUser?.avatar_url || '';

    return (
        <DashboardLayout role="student" username={user.username} fullName={fullName} avatarUrl={avatarUrl}>
            <StudentCommunitiesClient />
        </DashboardLayout>
    );
}
