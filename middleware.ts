import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from './lib/session';

// Simple in-memory rate limiter (Map<IP, { count, expires }>)
// Note: In serverless (Vercel), this memory is not shared, so it's per-lambda instance. 
// For production, use Redis/Upstash. This is a basic deterrent.
const rateLimit = new Map<string, { count: number; expires: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // 100 requests per minute

export async function middleware(request: NextRequest) {
    const session = request.cookies.get('auth_session');
    const { pathname } = request.nextUrl;
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    // --- 0. Rate Limiting (API Only) ---
    if (pathname.startsWith('/api')) {
        const now = Date.now();
        const record = rateLimit.get(ip) || { count: 0, expires: now + RATE_LIMIT_WINDOW };

        if (now > record.expires) {
            record.count = 1;
            record.expires = now + RATE_LIMIT_WINDOW;
        } else {
            record.count++;
        }

        rateLimit.set(ip, record);

        if (record.count > MAX_REQUESTS) {
            return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
        }
    }

    // --- 1. Decrypt Session ---
    const user = session ? await decrypt(session.value) : null;

    let response = NextResponse.next();

    // Define public paths
    const isPublic = pathname.startsWith('/api/auth') || 
                     pathname === '/login' || 
                     pathname.startsWith('/_next') || 
                     pathname.startsWith('/static');

    // --- 2. Auth Protection ---
    if (!isPublic) {
        if (pathname === '/') {
            if (!user) {
                return NextResponse.redirect(new URL('/login', request.url));
            }
        } else if (pathname.startsWith('/admin')) {
            if (!user) {
                return NextResponse.redirect(new URL('/login', request.url));
            }
            if (user.role !== 'admin') {
                return NextResponse.redirect(new URL('/', request.url));
            }
        } else if (pathname.startsWith('/tests/')) {
            if (!user) {
                return NextResponse.redirect(new URL('/login', request.url));
            }
        } else if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
            if (!user) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }
    }

    // --- 3. Security Headers ---
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('X-Frame-Options', 'DENY'); // Prevent Clickjacking
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://api.dicebear.com blob:; connect-src 'self' https://api.piston.codes; media-src 'self' blob:;");
    response.headers.set('Permissions-Policy', "camera=(self), microphone=(self), geolocation=()");

    return response;
}

export const config = {
    matcher: ['/((?!favicon.ico).*)'],
};
