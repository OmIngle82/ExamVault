import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import db from '@/lib/db';
import { redirect } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import CommunityDetailsClient from './CommunityDetailsClient';

export default async function CommunityDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const cookieStore = await cookies();
    const session = cookieStore.get('auth_session');

    if (!session) redirect('/login');
    const user = await decrypt(session.value);
    if (!user) redirect('/login');

    const communityId = parseInt(id);

    // Fetch Community Info
    const commRes = await db.query('SELECT * FROM communities WHERE id = $1', [communityId]);
    const community = commRes.rows[0];

    if (!community) {
        return <div>Community not found</div>;
    }

    // Verify Membership (or if admin/owner)
    // For now, let client handle strict data fetching, but page load check is good.

    // Fetch User Profile for Layout
    const userRes = await db.query('SELECT full_name, avatar_url FROM users WHERE id = $1', [user.id]);
    const dbUser = userRes.rows[0];

    return (
        <DashboardLayout role="student" username={user.username} fullName={dbUser?.full_name} avatarUrl={dbUser?.avatar_url}>
            <CommunityDetailsClient community={community} userId={user.id} username={user.username} />
        </DashboardLayout>
    );
}
