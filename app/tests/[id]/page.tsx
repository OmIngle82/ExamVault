import { cookies } from 'next/headers';
import db from '@/lib/db';
import { decrypt } from '@/lib/session';
import { notFound } from 'next/navigation';
import TestForm from './TestForm';
import styles from './test.module.css';

export default async function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const testResult = await db.query('SELECT * FROM tests WHERE id = $1', [id]);
  const test = testResult.rows[0];

  if (!test) {
    notFound();
  }

  // Get User Session
  const cookieStore = await cookies();
  const session = cookieStore.get('auth_session');
  let username = '';
  let fullName = '';
  let avatarUrl = '';

  if (session) {
    const sessionUser = await decrypt(session.value);
    if (sessionUser) {
      username = sessionUser.username;
      // Fetch latest profile data from DB
      const result = await db.query('SELECT full_name, avatar_url FROM users WHERE id = $1', [sessionUser.id]);
      const dbUser = result.rows[0];
      if (dbUser) {
        if (dbUser.full_name) fullName = dbUser.full_name;
        if (dbUser.avatar_url) avatarUrl = dbUser.avatar_url;
      }
    }
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

  // Fetch Questions
  const questionsResult = await db.query('SELECT * FROM questions WHERE test_id = $1', [id]);
  const questions = questionsResult.rows;
  const parsedQuestions = questions.map((q: any) => ({
    ...q,
    options: q.options ? ((typeof q.options === 'string') ? JSON.parse(q.options) : q.options) : null
  }));

  return (
    <div className={styles.container}>
      <TestForm test={test} questions={parsedQuestions} username={username} fullName={fullName} avatarUrl={avatarUrl} />
    </div>
  );
}
