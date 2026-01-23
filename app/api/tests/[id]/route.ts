import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await db.query('SELECT * FROM tests WHERE id = $1', [id]);
  const test = result.rows[0];

  if (!test) {
    return NextResponse.json({ error: 'Test not found' }, { status: 404 });
  }

  // Check if active
  const now = new Date();
  const startTime = (test as any).start_time ? new Date((test as any).start_time) : null;
  const endTime = (test as any).end_time ? new Date((test as any).end_time) : null;

  let isActive = true;
  if ((startTime && now < startTime) || (endTime && now > endTime)) {
    isActive = false;
  }

  // Ensure questions are parsed
  const questions = typeof test.questions === 'string' ? JSON.parse(test.questions) : test.questions;

  return NextResponse.json({ ...test, questions, isActive });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Check Auth (Simple implementation: Check for admin role in cookie)
  // ideally this logic is centralized or middleware handles it, but for API routes we often double check
  const session = request.cookies.get('auth_session');
  let isAdmin = false;
  if (session) {
    try {
      const user = JSON.parse(session.value);
      if (user.role === 'admin') isAdmin = true;
    } catch (e) { }
  }

  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM submissions WHERE test_id = $1', [id]);
      await client.query('DELETE FROM questions WHERE test_id = $1', [id]);
      await client.query('DELETE FROM tests WHERE id = $1', [id]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete Test Error:', error);
    return NextResponse.json({ error: 'Failed to delete test' }, { status: 500 });
  }
}
