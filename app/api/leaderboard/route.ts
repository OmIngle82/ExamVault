import { NextResponse } from 'next/server';
import db from '@/lib/db';

interface Question {
  id: string;
  correct_answer: string;
}

interface Submission {
  id: string;
  student_name: string; // From JOIN
  answers: any;
  start_time: string;
  submitted_at: string;
}

export async function GET() {
  try {
    const testsResult = await db.query('SELECT id, title FROM tests');
    const tests = testsResult.rows;

    const leaderboardData = await Promise.all(tests.map(async (test) => {
      // 1. Get correct answers for key
      const questionsResult = await db.query('SELECT id, correct_answer FROM questions WHERE test_id = $1', [test.id]);
      const questions = questionsResult.rows as Question[];

      // 2. Map correct answers for O(1) lookup
      const answerKey: Record<string, string> = {};
      questions.forEach(q => {
        if (q.correct_answer) {
          answerKey[q.id] = q.correct_answer;
        }
      });

      // 3. Get all submissions (Join with users to get name)
      // Note: We use submitted_at in PG vs submit_time in old SQLite
      const subResult = await db.query(`
          SELECT s.id, u.username as student_name, s.answers, s.start_time, s.submitted_at 
          FROM submissions s
          JOIN users u ON s.student_id = u.id
          WHERE s.test_id = $1
      `, [test.id]);

      const submissions = subResult.rows as Submission[];

      const scoredSubs = submissions.map(sub => {
        let answers: Record<string, string> = {};
        try {
          answers = (typeof sub.answers === 'string') ? JSON.parse(sub.answers) : sub.answers;
        } catch (e) { console.error('Error parsing answers', e); }

        let correct = 0;
        let incorrect = 0;
        let attempted = 0;

        // Iterate through ALL questions in the test
        questions.forEach(q => {
          const studentAns = answers[q.id];
          const correctAns = answerKey[q.id];

          if (studentAns !== undefined && studentAns !== null && studentAns !== '') {
            attempted++;
            if (correctAns) {
              if (studentAns === correctAns) {
                correct++;
              } else {
                incorrect++;
              }
            } else {
              correct++;
            }
          }
        });

        // Calculate Time Taken
        // start_time might be null for old records if we didn't backfill, handle gracefully
        let durationMs = 0;
        if (sub.start_time) {
          const start = new Date(sub.start_time);
          const end = new Date(sub.submitted_at);
          durationMs = end.getTime() - start.getTime();
        }

        const minutes = Math.floor(durationMs / 60000);
        const seconds = Math.floor((durationMs % 60000) / 1000);
        const timeTaken = `${minutes}m ${seconds}s`;

        return {
          id: sub.id,
          name: sub.student_name,
          score: correct,
          attempted,
          total: questions.length,
          correct,
          incorrect,
          timeTaken,
          rawDuration: durationMs
        };
      });

      // 4. Sort: Highest Score, then Fastest Time
      scoredSubs.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.rawDuration - b.rawDuration;
      });

      return {
        testTitle: test.title,
        topScorers: scoredSubs
      };
    }));

    return NextResponse.json(leaderboardData);
  } catch (error) {
    console.error('Leaderboard Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
