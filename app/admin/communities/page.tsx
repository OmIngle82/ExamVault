import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import { getUserProfile } from '@/lib/user';
import db from '@/lib/db';
import { redirect } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import CommunitiesClient from './CommunitiesClient';

export default async function AdminCommunitiesPage() {
    const cookieStore = await cookies();
    const session = cookieStore.get('auth_session');

    if (!session) redirect('/login');

    const user = await decrypt(session.value);
    if (!user || user.role !== 'admin') redirect('/login');

    // Fetch full profile
    const profile = await getUserProfile(user.id);
    const fullName = profile.full_name || '';
    const avatarUrl = profile.avatar_url || '';

    return (
        <DashboardLayout role="admin" username={user.username} fullName={fullName} avatarUrl={avatarUrl}>
            <CommunitiesClient />
        </DashboardLayout>
    );
}
