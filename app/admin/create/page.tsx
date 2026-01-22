import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/app/components/DashboardLayout';
import CreateForm from './CreateForm';

import { getUserProfile } from '@/lib/user';

export default async function CreateTestPage() {
    const cookieStore = await cookies();
    const session = cookieStore.get('auth_session');

    if (!session) redirect('/login');

    const user = await decrypt(session.value);
    if (!user || user.role !== 'admin') redirect('/login');

    const profile = await getUserProfile(user.id);

    return (
        <DashboardLayout
            role="admin"
            username={user.username}
            fullName={profile.full_name}
            avatarUrl={profile.avatar_url}
        >
            <CreateForm />
        </DashboardLayout>
    );
}
