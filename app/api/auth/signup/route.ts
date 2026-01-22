import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { encrypt } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const { username, password, role } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Check if user exists
    const existingCheck = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existingCheck.rows.length > 0) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    // Create user
    // User can now choose role ('admin' or 'student')
    const finalRole = (role === 'admin' || role === 'student') ? role : 'student';

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const insertResult = await db.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id',
      [username, hashedPassword, finalRole]
    );

    // Auto-login after signup
    const user = { id: insertResult.rows[0].id, username, role: finalRole };
    const sessionData = await encrypt(user);

    const response = NextResponse.json({ success: true, role: finalRole });

    response.cookies.set('auth_session', sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 // 1 day
    });

    return response;

  } catch (error) {
    console.error('Signup Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
