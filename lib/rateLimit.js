/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window counter per IP address.
 *
 * ⚠️ NOTE: This is an in-memory rate limiter. It works for local dev and
 * long-running servers, but in serverless environments (Vercel, AWS Lambda)
 * the Map resets on every cold start, providing no real protection.
 * For production, consider Vercel Edge Middleware with @vercel/edge-config,
 * Upstash Redis rate limiting, or a similar persistent store.
 */

const requestCounts = new Map();

/**
 * Check if the current request exceeds the rate limit.
 * @param {Request} request — The incoming request
 * @param {number} maxRequests — Maximum requests allowed in the window (default 20)
 * @param {number} windowMs — Time window in milliseconds (default 60000 = 1 min)
 * @returns {NextResponse|null} — Returns a 429 response if rate limited, null otherwise
 */
export function rateLimit(request, maxRequests = 20, windowMs = 60000) {
    // Get client IP (works with Vercel, proxies, and local dev)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : (request.headers.get('x-real-ip') || 'unknown');

    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create record for this IP
    let record = requestCounts.get(ip);
    if (!record) {
        record = { timestamps: [] };
        requestCounts.set(ip, record);
    }

    // Filter out timestamps outside the current window
    record.timestamps = record.timestamps.filter(ts => ts > windowStart);

    // Check if limit exceeded
    if (record.timestamps.length >= maxRequests) {
        return new Response(
            JSON.stringify({
                error: 'Too many requests. Please wait a moment before trying again.',
                retryAfterMs: record.timestamps[0] + windowMs - now,
            }),
            {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': String(Math.ceil((record.timestamps[0] + windowMs - now) / 1000)),
                },
            }
        );
    }

    // Record this request
    record.timestamps.push(now);

    // Cleanup old entries periodically (prevent memory leak)
    if (requestCounts.size > 1000) {
        for (const [key, val] of requestCounts) {
            if (val.timestamps.length === 0 || val.timestamps.every(ts => ts <= windowStart)) {
                requestCounts.delete(key);
            }
        }
    }

    return null; // Not rate limited
}
