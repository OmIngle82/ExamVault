import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// GET: Fetch current live state (Student Polling)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const result = await db.query('SELECT mode, status, current_question_index FROM tests WHERE id = $1', [id]);
        const test = result.rows[0];

        if (!test) {
            return NextResponse.json({ error: 'Test not found' }, { status: 404 });
        }

        return NextResponse.json(test);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Update live state (Teacher Controls)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const body = await request.json();
        const { action, index } = body;
        // action: 'start', 'next', 'end', 'reset'

        let updateQuery = '';
        let values: any[] = [];

        if (action === 'start') {
            updateQuery = 'UPDATE tests SET mode = $1, status = $2, current_question_index = $3 WHERE id = $4';
            values = ['live', 'active', 0, id];
        } else if (action === 'next') {
            updateQuery = 'UPDATE tests SET current_question_index = $1 WHERE id = $2';
            values = [index, id]; // Teacher passes the new index
        } else if (action === 'end') {
            updateQuery = 'UPDATE tests SET status = $1 WHERE id = $2';
            values = ['ended', id];
        } else if (action === 'reset') {
            updateQuery = 'UPDATE tests SET mode = $1, status = $2, current_question_index = $3 WHERE id = $4';
            values = ['self_paced', 'draft', -1, id];
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        await db.query(updateQuery, values);
        return NextResponse.json({ success: true, action });

    } catch (error: any) {
        console.error('Live Update Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
