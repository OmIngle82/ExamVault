import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';
import { decrypt } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('auth_session');

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await decrypt(session.value);
    if (!user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Fetch submissions for this user
    const result = await db.query(`
        SELECT 
            s.id, 
            s.test_id, 
            t.title as test_title, 
            s.score, 
            jsonb_array_length(t.questions) as total_questions,
            s.submitted_at as submit_time 
        FROM submissions s
        JOIN tests t ON s.test_id = t.id
        WHERE s.student_id = $1
        ORDER BY s.submitted_at DESC
    `, [user.id]);

    return NextResponse.json({ history: result.rows });

  } catch (error) {
    console.error('History Fetch Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
