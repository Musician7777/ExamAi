import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Next.js Middleware — Server-side route protection.
 *
 * - Unauthenticated users trying to access /dashboard/* are redirected to /login
 *   with a callbackUrl so they return after signing in.
 * - Authenticated users visiting /login or /register are redirected to /dashboard.
 *
 * Uses getToken() (JWT-only, no DB call) for fast edge-compatible checks.
 */
export async function middleware(request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = request.nextUrl;

  // Protect dashboard routes — redirect to login if no session
  if (pathname.startsWith('/dashboard') && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect logged-in users away from auth pages
  if ((pathname === '/login' || pathname === '/register') && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
