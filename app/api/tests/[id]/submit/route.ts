import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import db from '@/lib/db';
import { gradeAnswer } from '@/lib/gradingUtils';
import { processGamification } from '@/lib/gamification';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { studentName, answers, startTime, violationCount } = body;

  if (!studentName || !answers) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // 0. Security Check: Verify Session
  const cookieStore = await cookies();
  const session = cookieStore.get('auth_session');
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await decrypt(session.value);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Ensure submitting for self
  if (user.username !== studentName && user.role !== 'admin') {
    return NextResponse.json({ error: 'Identity Mismatch' }, { status: 403 });
  }

  // Fetch Test and Questions (to access correct answers)
  const testResult = await db.query('SELECT * FROM tests WHERE id = $1', [id]);
  const test = testResult.rows[0];

  const questionsResult = await db.query('SELECT id, type, correct_answer FROM questions WHERE test_id = $1', [id]);
  const questions = questionsResult.rows;

  if (!test) {
    return NextResponse.json({ error: 'Test not found' }, { status: 404 });
  }

  // --- GRADING LOGIC ---
  let score = 0;
  const detailedFeedback: Record<string, { correct: boolean; correctAnswer: string; confidence?: number; reason?: string }> = {};

  questions.forEach((q: any) => {
    const studentAnswer = answers[q.id];
    let isCorrect = false;

    if (q.type === 'mcq') {
      // Exact string match
      if (studentAnswer === q.correct_answer) {
        isCorrect = true;
      }

      detailedFeedback[q.id] = {
        correct: isCorrect,
        correctAnswer: q.correct_answer || 'Manual Review'
      };
    } else {
      // AI Grading for Text
      const result = gradeAnswer(studentAnswer, q.correct_answer);
      isCorrect = result.isCorrect;

      detailedFeedback[q.id] = {
        correct: isCorrect,
        correctAnswer: q.correct_answer || 'Manual Review',
        confidence: result.confidence,
        reason: result.reason
      };
    }

    if (isCorrect) score++;
  });

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // 1. Re-check for duplicates INSIDE transaction (Double-Check Locking)
    const existingResult = await client.query('SELECT id FROM submissions WHERE test_id = $1 AND student_id = $2', [id, user.id]);
    if (existingResult.rows.length > 0) {
      throw new Error('DUPLICATE_SUBMISSION');
    }

    // 2. Insert Submission
    const insertQuery = `
      INSERT INTO submissions (test_id, student_id, start_time, submitted_at, answers, score, violation_count, feedback)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `;

    const submissionResult = await client.query(insertQuery, [
      id,
      user.id,
      startTime,
      new Date(), // submitted_at
      JSON.stringify(answers),
      score,
      violationCount || 0,
      JSON.stringify(detailedFeedback)
    ]);

    const submissionId = submissionResult.rows[0].id;

    await client.query('COMMIT');

    // Release client before Gamification (which uses standard db pool)
    client.release();

    revalidatePath('/'); // Clear dashboard cache

    // --- GAMIFICATION ---
    // Calculate duration
    const end = new Date();
    const start = new Date(startTime);
    const durationSeconds = (end.getTime() - start.getTime()) / 1000;

    // Process XP and Badges
    const gamificationResult = await processGamification(
      user.id, // Use ID now
      parseInt(id),
      score,
      questions.length,
      durationSeconds,
      test.duration_minutes * 60
    );

    return NextResponse.json({
      success: true,
      submissionId,
      score: score,
      total: questions.length,
      feedback: detailedFeedback,
      gamification: gamificationResult // Return XP and Badges
    });

  } catch (error: any) {
    // If client is still connected/locked (not released inside try), rollback.
    // However, if we released client, this catch handles non-db errors too.
    // If error happened within transaction block before release:
    try { await client.query('ROLLBACK'); } catch (e) { }
    try { client.release(); } catch (e) { }

    if (error.message === 'DUPLICATE_SUBMISSION') {
      return NextResponse.json({ error: 'You have already submitted this test.' }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }
}
