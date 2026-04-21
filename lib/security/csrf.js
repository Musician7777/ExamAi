/**
 * CSRF Protection Middleware for Next.js API Routes
 * 
 * Implements double-submit cookie pattern for CSRF protection.
 * Tokens are generated per session and verified on mutation requests.
 */

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.NEXTAUTH_SECRET || 'csrf-secret-fallback-change-me';
const COOKIE_NAME = 'csrf-token';
const HEADER_NAME = 'x-csrf-token';

/**
 * Generate a secure CSRF token
 */
export function generateCSRFToken() {
  const timestamp = Date.now().toString(36);
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const signature = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(`${timestamp}.${randomBytes}`)
    .digest('hex');
  
  return `${timestamp}.${randomBytes}.${signature}`;
}

/**
 * Verify a CSRF token
 */
export function verifyCSRFToken(token) {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }
  
  const [timestamp, randomBytes, signature] = parts;
  
  // Check timestamp is recent (within 24 hours)
  const tokenTime = parseInt(timestamp, 36);
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  if (now - tokenTime > maxAge) {
    return false;
  }
  
  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(`${timestamp}.${randomBytes}`)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Get CSRF token from cookies (server-side)
 */
export async function getCSRFFromCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME);
  return token?.value || null;
}

/**
 * Set CSRF cookie in response
 */
export function setCSRFCookie(response) {
  const token = generateCSRFToken();
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by JavaScript for double-submit
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/',
  });
  return token;
}

/**
 * CSRF protection middleware for API routes
 * Call this at the start of POST/PUT/PATCH/DELETE handlers
 */
export async function csrfProtect(request) {
  // Only protect mutation methods
  const mutationMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!mutationMethods.includes(request.method)) {
    return null; // Allow GET requests
  }
  
  // Check for CSRF token in header
  const tokenFromHeader = request.headers.get(HEADER_NAME);
  const tokenFromCookie = request.cookies.get(COOKIE_NAME)?.value;
  
  // For API routes without cookies (e.g., server actions), 
  // we use the origin header as a fallback using proper URL parsing
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    process.env.NEXTAUTH_URL || 'http://localhost:3000',
  ];
  
  // Allow requests with matching origin using proper URL parsing
  if (origin) {
    try {
      const originUrl = new URL(origin);
      const isAllowed = allowedOrigins.some((allowed) => {
        try {
          const allowedUrl = new URL(allowed);
          return originUrl.origin === allowedUrl.origin;
        } catch {
          return false;
        }
      });
      if (isAllowed) {
        return null;
      }
    } catch {
      // Invalid origin, fall through to CSRF token check
    }
  }
  
  // If not from allowed origin, verify CSRF token
  if (!tokenFromHeader || !tokenFromCookie) {
    return new NextResponse(
      JSON.stringify({
        error: 'CSRF token missing',
        message: 'Missing CSRF token. Please ensure cookies are enabled.',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  if (!verifyCSRFToken(tokenFromHeader) || tokenFromHeader !== tokenFromCookie) {
    return new NextResponse(
      JSON.stringify({
        error: 'Invalid CSRF token',
        message: 'Your session may have expired. Please refresh the page and try again.',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  return null; // CSRF check passed
}

/**
 * Create a CSRF error response
 */
export function createCSRFErrorResponse(message = 'CSRF validation failed') {
  return NextResponse.json(
    { error: 'csrf_error', message },
    { status: 403 }
  );
}

/**
 * Helper to add CSRF token to client-side requests
 */
export function getCSRFTokenConfig() {
  return {
    headers: {
      [HEADER_NAME]: '', // Token will be set by client
    },
  };
}