import db from '@/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import DashboardClient from './components/DashboardClient';
import { redirect } from 'next/navigation';

export const revalidate = 0;

export default async function Home() {
  const cookieStore = await cookies();
  const session = cookieStore.get('auth_session');

  if (!session) {
    redirect('/login');
  }

  const user = await decrypt(session.value);
  if (!user) {
    redirect('/login');
  }

  // Parallelize fetches for performance
  const [dbUserResult, membershipsResult, ownedResult, submissionsResult] = await Promise.all([
    db.query('SELECT full_name, avatar_url FROM users WHERE id = $1', [user.id]),
    user.role === 'student' ? db.query('SELECT community_id FROM community_members WHERE user_id = $1', [user.id]) : Promise.resolve({ rows: [] }),
    user.role === 'admin' ? db.query('SELECT id FROM communities WHERE owner_id = $1', [user.id]) : Promise.resolve({ rows: [] }),
    db.query('SELECT test_id FROM submissions WHERE student_id = $1', [user.id])
  ]);

  const dbUser = dbUserResult.rows[0];
  const fullName = dbUser?.full_name || '';
  const avatarUrl = dbUser?.avatar_url || '';

  // Get User's Community IDs
  let userCommunityIds: number[] = [];
  if (user.role === 'student') {
    userCommunityIds = membershipsResult.rows.map((m: any) => m.community_id);
  } else if (user.role === 'admin') {
    userCommunityIds = ownedResult.rows.map((c: any) => c.id);
  }

  // Fetch Tests (Global OR in User's Communities)
  let query = `
    SELECT t.*, c.name as community_name 
    FROM tests t
    LEFT JOIN communities c ON t.community_id = c.id
    WHERE t.community_id IS NULL
  `;

  const params: any[] = [];

  if (userCommunityIds.length > 0) {
    query += ` OR t.community_id = ANY($1::int[])`;
    params.push(userCommunityIds);
  }

  query += ` ORDER BY t.created_at DESC`;

  const testsResult = await db.query(query, params);
  const tests = testsResult.rows;
  const completedTestIds = submissionsResult.rows.map(s => s.test_id);

  return (
    <DashboardClient
      initialTests={tests}
      completedTestIds={completedTestIds}
      role={user.role as 'admin' | 'student'}
      username={user.username}
      fullName={fullName}
      avatarUrl={avatarUrl}
    />
  );
}
