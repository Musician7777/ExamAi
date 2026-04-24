/**
 * Client-Side CSRF Helper
 *
 * Reads the csrf-token cookie set by /api/csrf and attaches it
 * as the x-csrf-token header on mutation requests (POST/PATCH/PUT/DELETE).
 *
 * Usage:
 *   import { secureFetch } from '@/lib/client-csrf';
 *   const res = await secureFetch('/api/activities', { method: 'POST', body: ... });
 *
 * Or just read the token manually:
 *   import { getCSRFToken } from '@/lib/client-csrf';
 *   headers: { 'x-csrf-token': getCSRFToken() }
 *
 * NOTE: Existing client-side fetch() calls still work without secureFetch
 * because csrfProtect() has an Origin-header fallback that allows
 * same-origin requests. For new code, prefer using secureFetch() to
 * get the full double-submit cookie protection.
 */

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/** Whether we've ensured the CSRF cookie exists on this page load */
let csrfInitialized = false;

/**
 * Read the CSRF token from the cookie.
 * Returns empty string if the cookie is not set.
 */
export function getCSRFToken() {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${CSRF_COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

/**
 * Ensure the CSRF cookie is set by fetching /api/csrf once.
 * Safe to call multiple times — only fetches on the first call.
 */
export async function ensureCSRFToken() {
  // Only skip if we already initialized AND the cookie is still present
  if (csrfInitialized && getCSRFToken()) return;
  try {
    await fetch('/api/csrf');
    csrfInitialized = true;
  } catch {
    // Non-critical — the Origin-header fallback in csrfProtect()
    // will handle same-origin requests even without the cookie.
  }
}

/**
 * Drop-in replacement for fetch() that automatically injects the
 * CSRF token header on mutation requests.
 *
 * @param {string} url
 * @param {RequestInit} options — standard fetch options
 * @returns {Promise<Response>}
 */
export async function secureFetch(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const mutationMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  if (mutationMethods.includes(method)) {
    // Ensure we have a CSRF cookie before reading it
    if (!getCSRFToken()) {
      await ensureCSRFToken();
    }

    const token = getCSRFToken();
    if (token) {
      const headers = new Headers(options.headers || {});
      headers.set(CSRF_HEADER_NAME, token);
      options = { ...options, headers };
    }
  }

  return fetch(url, options);
}
