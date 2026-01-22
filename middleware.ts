import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from './lib/session';

export async function middleware(request: NextRequest) {
    const session = request.cookies.get('auth_session');
    const { pathname } = request.nextUrl;

    // 1. Decrypt Session
    const user = session ? await decrypt(session.value) : null;

    // Define public paths that anyone can access (Auth API, Login page, Next.js assets)
    // Be careful not to block API calls needed for login!
    if (
        pathname.startsWith('/api/auth') ||
        pathname === '/login' ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static')
    ) {
        return NextResponse.next();
    }

    // 2. Protect Root Route (Redirect unauthenticated to Login)
    if (pathname === '/') {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // 3. Protect Admin Routes (Admin role only)
    if (pathname.startsWith('/admin')) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        if (user.role !== 'admin') {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // 4. Protect Test Routes (Any logged in user)
    if (pathname.startsWith('/tests/')) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // 5. Protect API Routes (Return 401 JSON, don't redirect to HTML login)
    if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!favicon.ico).*)'], // Match everything except favicon
};
