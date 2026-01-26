import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { encrypt } from '@/lib/session';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const LoginSchema = z.object({
      username: z.string().min(3).max(50),
      password: z.string().min(1)
    });

    const zodResult = LoginSchema.safeParse(body);

    if (!zodResult.success) {
      return NextResponse.json({ error: 'Invalid input format' }, { status: 400 });
    }

    const { username, password } = zodResult.data;

    // Find user by username only first
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Compare Password
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // In a real app, use JWT or proper session ID.
    // We now use encrypted JWTs.
    const sessionData = await encrypt({ id: user.id, username: user.username, role: user.role });

    const response = NextResponse.json({ success: true, role: user.role });

    // Set HttpOnly Cookie
    response.cookies.set('auth_session', sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 // 1 day
    });

    return response;
  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
