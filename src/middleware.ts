import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const authToken = request.cookies.get('auth_token');
    const { pathname } = request.nextUrl;

    // Allow access to login page and auth API
    if (pathname === '/login' || pathname.startsWith('/api/auth')) {
        return NextResponse.next();
    }

    // Protect all other routes
    const expectedToken = btoa((process.env.APP_PASSWORD || "admin") + "sms-suite-salt").substring(0, 32);

    if (!authToken || authToken.value !== expectedToken) {
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public (public files)
         */
        '/((?!_next/static|_next/image|favicon.ico|public).*)',
    ],
};
