import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get('auth_session');
  
  if (!cookie) {
    return NextResponse.json({ user: null });
  }

  try {
    const user = JSON.parse(cookie.value);
    return NextResponse.json({ user });
  } catch (e) {
    return NextResponse.json({ user: null });
  }
}
