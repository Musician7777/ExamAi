import { NextResponse } from 'next/server';
import { generateCSRFToken } from '@/lib/security/csrf';

/**
 * GET /api/csrf
 *
 * Returns a new CSRF token and sets it as a cookie (csrf-token).
 * The client should read the cookie value and send it in the
 * x-csrf-token header on every POST/PATCH/PUT/DELETE request.
 *
 * The double-submit cookie pattern works alongside the Origin-header
 * check that csrfProtect() performs — either check passing is sufficient.
 */
export async function GET() {
  const token = generateCSRFToken();

  const response = NextResponse.json({ token });
  response.cookies.set('csrf-token', token, {
    httpOnly: false, // Must be readable by JavaScript for double-submit
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/',
  });

  return response;
}
