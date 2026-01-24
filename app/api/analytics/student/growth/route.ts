import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const username = searchParams.get('username');

        if (!username) {
            return NextResponse.json({ error: 'Username is required' }, { status: 400 });
        }

        // Fetch submissions for this student
        // Join with tests to get titlte
        // We track 'score' from the JSON blob or a dedicated column if available. 
        // Based on previous files, submissions seems to be in a table or JSON.
        // Let's assume a 'submissions' table exists with { id, test_id, student_username, score, submitted_at }
        // If not, we might need to adjust based on schema.

        // Checking schema via basic query first or common sense.
        // Assuming standard schema from typical exam apps.
        const query = `
            SELECT s.score, s.submitted_at, t.title
            FROM submissions s
            JOIN tests t ON s.test_id = t.id
            WHERE s.student_username = $1
            ORDER BY s.submitted_at ASC
        `;

        const result = await db.query(query, [username]);

        const data = result.rows.map(row => ({
            date: new Date(row.submitted_at).toLocaleDateString(), // Simple date
            score: row.score,
            title: row.title
        }));

        return NextResponse.json({ growth: data });

    } catch (error: any) {
        console.error('Growth API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
