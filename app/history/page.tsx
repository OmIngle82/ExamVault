import { cookies } from 'next/headers';
import db from '@/lib/db';
import { decrypt } from '@/lib/session';
import { getUserProfile } from '@/lib/user';
import { redirect } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';
import styles from '../components/dashboard.module.css';

export const revalidate = 0;

export default async function HistoryPage() {
    const cookieStore = await cookies();
    const session = cookieStore.get('auth_session');

    if (!session) redirect('/login');

    const user = await decrypt(session.value);
    if (!user) redirect('/login');

    // Fetch full profile
    const profile = await getUserProfile(user.id);
    const fullName = profile.full_name || '';
    const avatarUrl = profile.avatar_url || '';

    // Fetch Submissions with Test Details
    // Use submitted_at (Postgres) instead of submit_time (SQLite schema)
    const submissionsResult = await db.query(`
    SELECT s.*, t.title, t.description 
    FROM submissions s 
    JOIN tests t ON s.test_id = t.id 
    WHERE s.student_id = $1
    ORDER BY s.submitted_at DESC
  `, [user.id]);

    const submissions = submissionsResult.rows;

    // Fetch all questions to calculate "Areas of Improvement"
    const testIds = [...new Set(submissions.map(s => s.test_id))];
    let questionsMap: Record<number, any[]> = {};

    if (testIds.length > 0) {
        // Postgres ANY operator for cleaner array IN queries
        const questionsResult = await db.query(`SELECT * FROM questions WHERE test_id = ANY($1::int[])`, [testIds]);
        const allQuestions = questionsResult.rows;

        allQuestions.forEach(q => {
            if (!questionsMap[q.test_id]) questionsMap[q.test_id] = [];
            questionsMap[q.test_id].push(q);
        });
    }

    // Calculate Improvement Areas
    const historyData = submissions.map(sub => {
        const testQuestions = questionsMap[sub.test_id] || [];
        const userAnswers = (typeof sub.answers === 'string') ? JSON.parse(sub.answers) : sub.answers;
        const incorrectQuestions: string[] = [];

        testQuestions.forEach((q, idx) => {
            // Simple string match check, same as submission logic
            const ans = userAnswers[q.id];
            if (ans !== q.correct_answer) {
                incorrectQuestions.push(`Q${idx + 1}`);
            }
        });

        // Map column name mismatch if needed
        return {
            ...sub,
            submit_time: sub.submitted_at,
            incorrect: incorrectQuestions
        };
    });

    return (
        <DashboardLayout role={user.role} username={user.username} fullName={fullName} avatarUrl={avatarUrl}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Performance History</h1>
                <p style={{ color: 'var(--text-muted)' }}>Track your progress and areas for improvement.</p>
            </div>

            <div className={styles.cardGrid}>
                {historyData.map((item) => (
                    <div key={item.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{item.title}</h3>
                                <p style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                                    {new Date(item.submit_time).toLocaleDateString()} • {new Date(item.submit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            <div style={{
                                background: item.score === item.total_questions ? '#DCFCE7' : (item.score / item.total_questions > 0.5 ? '#FEF3C7' : '#FEE2E2'),
                                color: item.score === item.total_questions ? '#15803D' : (item.score / item.total_questions > 0.5 ? '#B45309' : '#B91C1C'),
                                padding: '0.25rem 0.75rem',
                                borderRadius: '20px',
                                fontWeight: 'bold',
                                fontSize: '0.9rem'
                            }}>
                                {item.score}/{item.total_questions}
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '1rem' }}>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>Areas of Improvement</h4>
                            {item.incorrect.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {item.incorrect.slice(0, 5).map((qLabel: string, i: number) => (
                                        <span key={i} style={{
                                            background: '#FFF1F2',
                                            color: '#B91C1C',
                                            fontSize: '0.8rem',
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '8px',
                                            fontWeight: '600'
                                        }}>
                                            {qLabel}
                                        </span>
                                    ))}
                                    {item.incorrect.length > 5 && <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>+{item.incorrect.length - 5} more</span>}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#15803D', fontSize: '0.9rem', fontWeight: '600' }}>
                                    <span>🌟 Perfect Score! Great job.</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {historyData.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: '#9CA3AF' }}>
                        No history found. Attempt a test to see your results here.
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
