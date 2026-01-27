import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    try {
        await db.query(`
      CREATE TABLE IF NOT EXISTS peer_reviews (
        id SERIAL PRIMARY KEY,
        test_id INTEGER REFERENCES tests(id),
        question_id VARCHAR(255) NOT NULL,
        requester_username VARCHAR(255) NOT NULL,
        reviewer_username VARCHAR(255),
        code_snippet TEXT NOT NULL,
        language VARCHAR(50) DEFAULT 'python',
        feedback TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
        return NextResponse.json({ success: true, message: 'Peer reviews table created' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
