/**
 * Composable API Route Handler
 *
 * Eliminates boilerplate across all API routes by composing common middleware:
 * - CSRF protection (mutation routes)
 * - Authentication check
 * - Rate limiting
 * - Request body validation (Zod)
 * - Database connection
 * - Error handling with logging
 *
 * @example
 * // POST with all middleware
 * export const POST = apiRoute({
 *   requireAuth: true,
 *   requireCsrf: true,
 *   rateLimit: { max: 30, windowMs: 60000 },
 *   schema: activityCreateSchema,
 *   connectDB: true,
 * }, async (request, { session, body }) => {
 *   const activity = await Activity.create({ userId: session.user.email, ...body });
 *   return NextResponse.json({ activity }, { status: 201 });
 * });
 *
 * @example
 * // GET with auth only
 * export const GET = apiRoute({
 *   requireAuth: true,
 *   connectDB: true,
 * }, async (request, { session }) => {
 *   const data = await Something.find({ userId: session.user.email });
 *   return NextResponse.json({ data });
 * });
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import { rateLimit } from '@/lib/services/rateLimitService';
import { csrfProtect } from '@/lib/security/csrf';
import { validateRequest } from '@/lib/validation';
import { sanitizeErrorResponse } from '@/lib/sanitize';
import logger from '@/lib/logger';

/**
 * Create a route handler with composed middleware
 *
 * @param {Object} options - Middleware configuration
 * @param {boolean} [options.requireAuth=false] - Require authenticated session
 * @param {boolean} [options.requireCsrf=false] - Enforce CSRF protection (mutations)
 * @param {Object} [options.rateLimit] - Rate limit config { max, windowMs }
 * @param {import('zod').ZodSchema} [options.schema] - Zod schema for request body validation
 * @param {boolean} [options.connectDB=false] - Connect to MongoDB before handler
 * @param {boolean} [options.sanitizeErrors=false] - Use sanitizeErrorResponse for 500 errors
 * @param {boolean} [options.formData=false] - Skip JSON body parsing; handler reads formData itself
 * @param {string} [options.errorMessage='Request failed'] - Default error message for 500 responses
 * @param {Function} handler - Route handler(req, ctx) where ctx has { session, body, request }
 * @returns {Function} Next.js route handler
 */
export function apiRoute(options, handler) {
  const {
    requireAuth = false,
    requireCsrf = false,
    rateLimit: rateLimitConfig = null,
    schema = null,
    connectDB: shouldConnectDB = false,
    sanitizeErrors = false,
    formData: isFormData = false,
    errorMessage = 'Request failed',
  } = options;

  return async function routeHandler(request) {
    try {
      // 1. CSRF protection (mutations)
      if (requireCsrf) {
        const csrfError = await csrfProtect(request);
        if (csrfError) return csrfError;
      }

      // 2. Authentication
      let session = null;
      if (requireAuth) {
        session = await getServerSession();
        if (!session?.user?.email) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
      }

      // 3. Rate limiting
      if (rateLimitConfig) {
        const rateLimitResult = await rateLimit(request, rateLimitConfig.max, rateLimitConfig.windowMs);
        if (rateLimitResult) return rateLimitResult;
      }

      // 4. Parse & validate request body
      let body = null;
      if (schema) {
        let parsed;
        try {
          parsed = await request.json();
        } catch {
          // Empty body — validate against schema (which may have all-optional fields)
          parsed = {};
        }
        const validation = validateRequest(schema, parsed);
        if (!validation.success) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }
        body = validation.data;
      } else if (!isFormData && (requireCsrf || request.method !== 'GET')) {
        // Auto-parse JSON for mutation routes without schema
        // Skip when isFormData=true so handler can call request.formData() itself
        try {
          body = await request.json();
        } catch {
          // Body may be empty — handler can parse it themselves
          body = null;
        }
      }

      // 5. Database connection
      if (shouldConnectDB) {
        await connectDB();
      }

      // 6. Execute handler with context
      return await handler(request, { session, body });
    } catch (error) {
      logger.error({ err: error }, errorMessage);
      const errorPayload = sanitizeErrors
        ? sanitizeErrorResponse({ error: errorMessage, details: error?.message })
        : { error: errorMessage };
      return NextResponse.json(errorPayload, { status: 500 });
    }
  };
}
