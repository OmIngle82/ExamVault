import db from '@/lib/db';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/app/components/DashboardLayout';
import { getUserProfile } from '@/lib/user';

export default async function LeaderboardPage() {
    const cookieStore = await cookies();
    const session = cookieStore.get('auth_session');

    if (!session) redirect('/login');
    const user = await decrypt(session.value);
    if (!user) redirect('/login');

    const profile = await getUserProfile(user.id);

    const result = await db.query(`
    SELECT username, full_name, xp,
    (SELECT COUNT(*) FROM user_badges WHERE user_id = users.id) as badge_count
    FROM users 
    WHERE role = 'student'
    ORDER BY xp DESC 
    LIMIT 10
  `);
    const leaders = result.rows;

    return (
        <DashboardLayout role={user.role as 'admin' | 'student'} username={user.username} fullName={profile.full_name} avatarUrl={profile.avatar_url}>
            <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
                <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏆 Hall of Fame</h1>
                    <p style={{ color: '#666' }}>Top students ranked by XP</p>
                </div>

                <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8fafc' }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b' }}>Rank</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b' }}>Student</th>
                                <th style={{ padding: '1rem', textAlign: 'right', color: '#64748b' }}>Badges</th>
                                <th style={{ padding: '1rem', textAlign: 'right', color: '#64748b' }}>XP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaders.map((leader, idx) => (
                                <tr key={leader.username} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '1rem', fontWeight: 'bold', fontSize: '1.1rem', color: idx < 3 ? '#d97706' : '#334155' }}>
                                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <img
                                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${leader.username}`}
                                                alt="avatar"
                                                style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                                            />
                                            <div>
                                                <div style={{ fontWeight: '600' }}>{leader.full_name || leader.username}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>@{leader.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        {leader.badge_count > 0 && (
                                            <span style={{ background: '#e0f2fe', color: '#0284c7', padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                                {leader.badge_count} 🏅
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '800', color: '#0f172a' }}>
                                        {parseInt(leader.xp).toLocaleString()} XP
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <Link href="/" style={{ textDecoration: 'none', color: '#64748b', fontWeight: '600' }}>
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    );
}
