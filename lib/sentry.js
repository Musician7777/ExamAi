/**
 * Sentry Integration for Next.js
 * 
 * Provides comprehensive error tracking and monitoring for production.
 * 
 * Setup:
 * 1. npm install @sentry/nextjs
 * 2. Set SENTRY_DSN environment variable
 * 3. Optionally configure SENTRY_AUTH_TOKEN and SENTRY_PROJECT for automatic releases
 */

import * as Sentry from '@sentry/nextjs';

// Only initialize Sentry on the server side
const isServer = typeof window === 'undefined';

// Sentry configuration
const sentryConfig = {
  // Ensure this env variable exists - get from https://sentry.io/settings/projects
  dsn: process.env.SENTRY_DSN,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Release version (from git or custom)
  release: process.env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA,
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Sample rate for profiling (production only)
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  
  // Enable debug mode in development
  debug: process.env.NODE_ENV !== 'production',
  
  // Allowlist of events to send (reduce noise in development)
  allowUrls: [
    'localhost',
    process.env.NEXTAUTH_URL?.replace(/^https?:\/\//, '') || 'localhost:3000',
  ],
  
  // Ignore common non-actionable errors
  ignoreErrors: [
    // Network errors (expected in development)
    'TypeError: Failed to fetch',
    'TypeError: NetworkError when attempting to fetch resource',
    // Chrome extensions
    'Extension context invalidated',
    // Browser extensions
    'Cannot access a chrome-extension:// URL',
  ],
  
  // Before send hook - filter out non-critical errors
  beforeSend(event, hint) {
    // Don't send errors from development
    if (process.env.NODE_ENV !== 'production') {
      return null;
    }
    
    // Filter out rate limit errors (expected behavior)
    const error = hint?.originalException;
    if (error?.message?.includes('Too many requests')) {
      return null;
    }
    
    // Filter out auth errors (expected user behavior)
    if (error?.message?.includes('Unauthorized') || error?.message?.includes('Invalid password')) {
      return null;
    }
    
    return event;
  },
  
  // Maximum breadcrumbs to capture
  maxBreadcrumbs: 50,
  
  // Enable React error boundaries
  integrations: [
    // HTTP client breadcrumbs
    new Sentry.Integrations.Http({ tracing: true }),
    // React DOM breadcrumbs
    new Sentry.Integrations.Breadcrumbs({ console: true }),
  ],
};

// Initialize Sentry only if DSN is provided
if (isServer && process.env.SENTRY_DSN) {
  Sentry.init(sentryConfig);
  // eslint-disable-next-line no-console
  console.log('[Sentry] Error tracking initialized');
}

/**
 * Capture an error with additional context
 */
export async function captureError(error, context = {}) {
  if (!process.env.SENTRY_DSN) {
    console.warn('[Error]', error, context);
    return;
  }
  
  Sentry.withScope((scope) => {
    // Add custom context
    Object.entries(context).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });
    
    // Add user context if available
    if (context.userId) {
      scope.setUser({
        id: context.userId,
        email: context.email,
      });
    }
    
    Sentry.captureException(error);
  });
}

/**
 * Capture a message (non-error)
 */
export function captureMessage(message, level = 'info') {
  if (!process.env.SENTRY_DSN) {
    console.log(`[${level}]`, message);
    return;
  }
  
  Sentry.captureMessage(message, level);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message, data = {}, level = 'info') {
  if (!process.env.SENTRY_DSN) return;
  
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

export default Sentry;