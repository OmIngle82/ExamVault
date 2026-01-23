import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        // 1. Fetch Test Details
        const testResult = await db.query('SELECT title, questions FROM tests WHERE id = $1', [id]);
        const test = testResult.rows[0];
        if (!test) return NextResponse.json({ error: 'Test not found' }, { status: 404 });

        const questions = (typeof test.questions === 'string' ? JSON.parse(test.questions) : test.questions) || [];

        // 2. Fetch All Results
        const resultsQuery = await db.query(
            'SELECT id, student_name, score, total_questions, answers, created_at FROM results WHERE test_id = $1 ORDER BY score DESC',
            [id]
        );
        const submissions = resultsQuery.rows;

        if (submissions.length === 0) {
            return NextResponse.json({
                stats: { average: 0, median: 0, highest: 0, lowest: 0, total: 0 },
                chartData: [],
                questionAnalysis: [],
                submissions: []
            });
        }

        // 3. Calculate Stats
        const scores = submissions.map(s => s.score);
        const total = scores.length;
        const average = scores.reduce((a, b) => a + b, 0) / total;
        const highest = Math.max(...scores);
        const lowest = Math.min(...scores);

        // Median
        scores.sort((a, b) => a - b);
        const mid = Math.floor(scores.length / 2);
        const median = scores.length % 2 !== 0 ? scores[mid] : (scores[mid - 1] + scores[mid]) / 2;

        // 4. Score Distribution for Chart
        // Groups: 0-20%, 21-40%, 41-60%, 61-80%, 81-100%
        const distribution = [
            { name: '0-20%', count: 0 },
            { name: '21-40%', count: 0 },
            { name: '41-60%', count: 0 },
            { name: '61-80%', count: 0 },
            { name: '81-100%', count: 0 },
        ];

        submissions.forEach(s => {
            const percentage = (s.score / s.total_questions) * 100;
            if (percentage <= 20) distribution[0].count++;
            else if (percentage <= 40) distribution[1].count++;
            else if (percentage <= 60) distribution[2].count++;
            else if (percentage <= 80) distribution[3].count++;
            else distribution[4].count++;
        });

        // 5. Question Analysis (Hardest/Easiest)
        // We need to parse answers for each submission and check against correct answer
        // Note: This relies on 'answers' being stored as JSON { "qId": "value" }
        // and questions having 'id' and 'correctAnswer'.

        const questionStats = questions.map((q: any, idx: number) => {
            let correctCount = 0;
            submissions.forEach(sub => {
                const studentAns = typeof sub.answers === 'string' ? JSON.parse(sub.answers) : sub.answers;
                // Assuming question ID matches or using index if ID not stable. 
                // In CreateForm, we didn't explicitly set IDs, only in TestForm we mapped them.
                // Let's assume index-based keying if IDs are missing, or ID if present.
                // Actually, CreateForm saves questions with IDs generated? No, usually typical JSON array.
                // But TestForm uses `q.id` which might be index if not generated. 
                // Let's assume questions have IDs or we use index string.

                const key = q.id || idx;
                const val = studentAns[key];
                if (val === q.correctAnswer) correctCount++;
            });

            return {
                id: q.id || idx,
                prompt: q.prompt.substring(0, 30) + '...',
                correctCount,
                totalSubmissions: total,
                accuracy: Math.round((correctCount / total) * 100)
            };
        });

        return NextResponse.json({
            testTitle: test.title,
            stats: {
                average: parseFloat(average.toFixed(1)),
                median,
                highest,
                lowest,
                totalAttempts: total
            },
            chartData: distribution,
            questionAnalysis: questionStats,
            submissions: submissions.map(s => ({
                id: s.id,
                name: s.student_name,
                score: s.score,
                total: s.total_questions,
                date: s.created_at
            }))
        });

    } catch (error: any) {
        console.error('Analytics API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
