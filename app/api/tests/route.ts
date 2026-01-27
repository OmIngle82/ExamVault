import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// GET: Fetch tests (optional filter by communityId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get('communityId');

    let query = 'SELECT id, title, description, duration_minutes, questions, start_time FROM tests';
    const values: any[] = [];

    if (communityId) {
      query += ' WHERE community_id = $1';
      values.push(parseInt(communityId));
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, values);
    return NextResponse.json({ tests: result.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, duration, startTime, endTime, questions, communityId } = body;

    if (!title || !duration || !questions || questions.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Strict Question Validation
    for (const q of questions) {
      if (!q.prompt || q.prompt.trim() === '') {
        return NextResponse.json({ error: 'All questions must have a prompt' }, { status: 400 });
      }
      if (!q.correctAnswer || q.correctAnswer.trim() === '') {
        return NextResponse.json({ error: 'All questions must have a correct answer' }, { status: 400 });
      }
      if (q.type === 'mcq') {
        if (!Array.isArray(q.options) || q.options.length < 2 || q.options.some((o: string) => !o || o.trim() === '')) {
          return NextResponse.json({ error: 'MCQ questions must have at least 2 valid options' }, { status: 400 });
        }
      }
    }

    const client = await db.connect();

    try {
      await client.query('BEGIN');

      const insertTestQuery = `
        INSERT INTO tests (title, description, duration_minutes, time_limit, start_time, end_time, community_id, scheduled_at, questions, proctoring_settings, certificate_enabled, certificate_settings)
        VALUES ($1, $2, $3, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `;

      // Sanitize timestamps (Postgres doesn't accept empty strings for TIMESTAMP)
      const validStartTime = (startTime && startTime.trim() !== '') ? startTime : null;
      const validEndTime = (endTime && endTime.trim() !== '') ? endTime : null;

      const testResult = await client.query(insertTestQuery, [
        title,
        description,
        duration,
        validStartTime,
        validEndTime,
        communityId ? parseInt(communityId) : null,
        validStartTime,
        JSON.stringify(questions),
        body.proctoringSettings ? JSON.stringify(body.proctoringSettings) : '{}',
        body.certificateEnabled || false,
        body.certificateSettings ? JSON.stringify(body.certificateSettings) : '{}'
      ]);
      const testId = testResult.rows[0].id;

      const insertQuestionQuery = `
        INSERT INTO questions (test_id, type, prompt, options, correct_answer)
        VALUES ($1, $2, $3, $4, $5)
      `;

      for (const q of questions) {
        await client.query(insertQuestionQuery, [
          testId,
          q.type,
          q.prompt,
          q.options ? JSON.stringify(q.options) : null,
          q.correctAnswer
        ]);
      }

      await client.query('COMMIT');
      return NextResponse.json({ success: true, testId });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Create Test Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create test' }, { status: 500 });
  }
}
