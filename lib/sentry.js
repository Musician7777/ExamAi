/**
 * Sentry Integration for Next.js
 *
 * Provides comprehensive error tracking and monitoring for production.
 *
 * Setup:
 * 1. npm install @sentry/nextjs
 * 2. Set SENTRY_DSN environment variable
 * 3. Optionally configure SENTRY_AUTH_TOKEN and SENTRY_PROJECT for automatic releases
 *
 * NOTE: Uses dynamic import so the app builds even if @sentry/nextjs is not installed.
 */

// Lazy-loaded Sentry module — only imported when SENTRY_DSN is set
let _sentry = null;

async function getSentry() {
  if (_sentry !== null) return _sentry;
  if (!process.env.SENTRY_DSN) {
    _sentry = false;
    return false;
  }
  try {
    _sentry = await import('@sentry/nextjs');
  } catch {
    // @sentry/nextjs not installed — gracefully degrade
    _sentry = false;
  }
  return _sentry;
}

// Only initialize Sentry on the server side
const isServer = typeof window === 'undefined';

// Initialize Sentry eagerly on server when DSN is available
if (isServer && process.env.SENTRY_DSN) {
  getSentry()
    .then((Sentry) => {
      if (!Sentry) return;
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        release: process.env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA,
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
        debug: process.env.NODE_ENV !== 'production',
        ignoreErrors: [
          'TypeError: Failed to fetch',
          'TypeError: NetworkError when attempting to fetch resource',
          'Extension context invalidated',
          'Cannot access a chrome-extension:// URL',
        ],
        beforeSend(event, hint) {
          if (process.env.NODE_ENV !== 'production') return null;
          const error = hint?.originalException;
          if (error?.message?.includes('Too many requests')) return null;
          if (error?.message?.includes('Unauthorized') || error?.message?.includes('Invalid password')) return null;
          return event;
        },
        maxBreadcrumbs: 50,
      });
      // eslint-disable-next-line no-console
      console.log('[Sentry] Error tracking initialized');
    })
    .catch(() => {
      // Silently fail — Sentry is optional
    });
}

/**
 * Capture an error with additional context
 */
export async function captureError(error, context = {}) {
  if (!process.env.SENTRY_DSN) {
    console.warn('[Error]', error, context);
    return;
  }

  const Sentry = await getSentry();
  if (!Sentry) {
    console.warn('[Error]', error, context);
    return;
  }

  Sentry.withScope((scope) => {
    Object.entries(context).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });
    if (context.userId) {
      scope.setUser({ id: context.userId, email: context.email });
    }
    Sentry.captureException(error);
  });
}

/**
 * Capture a message (non-error)
 */
export async function captureMessage(message, level = 'info') {
  if (!process.env.SENTRY_DSN) {
    // eslint-disable-next-line no-console -- intentional logging when Sentry is not configured
    console.log(`[${level}]`, message);
    return;
  }

  const Sentry = await getSentry();
  if (!Sentry) {
    // eslint-disable-next-line no-console
    console.log(`[${level}]`, message);
    return;
  }

  Sentry.captureMessage(message, level);
}

/**
 * Add breadcrumb for debugging
 */
export async function addBreadcrumb(message, data = {}, level = 'info') {
  if (!process.env.SENTRY_DSN) return;

  const Sentry = await getSentry();
  if (!Sentry) return;

  Sentry.addBreadcrumb({
    message,
    data,
    level,
    timestamp: Date.now(),
  });
}

/**
 * Wrap an async function with error capturing
 */
export async function withErrorTracking(fn, context = {}) {
  try {
    return await fn();
  } catch (error) {
    await captureError(error, context);
    throw error;
  }
}

/**
 * Server-side wrapper for API routes
 */
export function withSentryHandler(handler) {
  return async (request, ...args) => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      await captureError(error, {
        path: request.url,
        method: request.method,
        userAgent: request.headers.get('user-agent'),
      });
      throw error;
    }
  };
}
