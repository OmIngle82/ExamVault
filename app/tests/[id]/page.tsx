import { cookies } from 'next/headers';
import db from '@/lib/db';
import { decrypt } from '@/lib/session';
import { notFound } from 'next/navigation';
import TestForm from './TestForm';
import styles from './test.module.css';

export default async function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Parallelize Data Fetching
  const testPromise = db.query('SELECT * FROM tests WHERE id = $1', [id]);
  const questionsPromise = db.query('SELECT * FROM questions WHERE test_id = $1', [id]);

  const userPromise = (async () => {
    const cookieStore = await cookies();
    const session = cookieStore.get('auth_session');
    if (!session) return null;

    const sessionUser = await decrypt(session.value);
    if (!sessionUser) return null;

    const result = await db.query('SELECT full_name, avatar_url FROM users WHERE id = $1', [sessionUser.id]);
    const dbUser = result.rows[0];

    return {
      username: sessionUser.username,
      fullName: dbUser?.full_name || '',
      avatarUrl: dbUser?.avatar_url || ''
    };
  })();

  const [testResult, questionsResult, userData] = await Promise.all([
    testPromise,
    questionsPromise,
    userPromise
  ]);

  const test = testResult.rows[0];
  const questions = questionsResult.rows;

  if (!test) {
    notFound();
  }

  // Server-side Schedule Check
  const now = new Date();
  if (test.scheduled_at) {
    const scheduledTime = new Date(test.scheduled_at);
    if (now < scheduledTime) {
      return (
        <div className={styles.container}>
          <div className={styles.errorCard} style={{ textAlign: 'center', background: 'white', padding: '3rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', maxWidth: '500px', margin: '4rem auto' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem', color: '#1F2937' }}>Test Locked</h1>
            <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>
              This test is scheduled for <strong>{scheduledTime.toLocaleString()}</strong>.
              <br />
              Please come back then.
            </p>
            <a href="/" style={{ display: 'inline-block', background: '#2563EB', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', textDecoration: 'none', fontWeight: '600' }}>
              Return Home
            </a>
          </div>
        </div>
      );
    }
  }

  const parsedQuestions = questions.map((q: any) => ({
    ...q,
    options: q.options ? ((typeof q.options === 'string') ? JSON.parse(q.options) : q.options) : null
  }));

  return (
    <div className={styles.container}>
      <TestForm
        test={test}
        questions={parsedQuestions}
        username={userData?.username || ''}
        fullName={userData?.fullName || ''}
        avatarUrl={userData?.avatarUrl || ''}
      />
    </div>
  );
}
