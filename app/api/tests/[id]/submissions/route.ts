import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Verify test exists
    const testResult = await db.query('SELECT * FROM tests WHERE id = $1', [id]);
    const test = testResult.rows[0];

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    const submissionsResult = await db.query(`
      SELECT s.*, 
             COALESCE(u.full_name, u.username) as student_name 
      FROM submissions s
      LEFT JOIN users u ON s.student_id = u.id
      WHERE s.test_id = $1 
      ORDER BY s.submitted_at DESC
    `, [id]);
    const submissions = submissionsResult.rows;

    // Fetch questions to analyze performance
    const questionsResult = await db.query('SELECT id, prompt, correct_answer, type FROM questions WHERE test_id = $1', [id]);
    const questions = questionsResult.rows as any[];

    // Analytics Logic
    const analytics: Record<string, { prompt: string, correct: number, total: number, percentage: number }> = {};

    questions.forEach(q => {
      analytics[q.id] = {
        prompt: q.prompt,
        correct: 0,
        total: 0,
        percentage: 0
      };
    });

    const parsedSubmissions = submissions.map((sub: any) => {
      let answers: any = {};
      let feedback: any = {};

      try {
        answers = (typeof sub.answers === 'string') ? JSON.parse(sub.answers) : sub.answers;
        feedback = sub.feedback ? ((typeof sub.feedback === 'string') ? JSON.parse(sub.feedback) : sub.feedback) : {};
      } catch (e) { }

      // Update Question Stats
      questions.forEach(q => {
        if (analytics[q.id]) {
          analytics[q.id].total++;

          // Check correctness: Use stored feedback if available (AI/Strict), else fallback to simple match
          let isCorrect = false;

          if (feedback[q.id]) {
            isCorrect = feedback[q.id].correct;
          } else {
            if (answers[q.id] === q.correct_answer) {
              isCorrect = true;
            }
          }

          if (isCorrect) {
            analytics[q.id].correct++;
          }
        }
      });

      return {
        ...sub,
        answers,
        feedback, // Return parsed feedback to client
        total_questions: questions.length // Inject total questions count for analytics
      };
    });

    // Calculate Percentages
    Object.keys(analytics).forEach(qid => {
      const item = analytics[qid];
      if (item.total > 0) {
        item.percentage = Math.round((item.correct / item.total) * 100);
      }
    });

    return NextResponse.json({ submissions: parsedSubmissions, analytics });
  } catch (error: any) {
    console.error('Fetch Submissions Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
