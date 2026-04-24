/**
 * Unified Rate Limiting Service
 *
 * Uses Upstash Redis for serverless-compatible rate limiting with
 * automatic fallback to in-memory for development.
 *
 * Install: npm install @upstash/redis
 *
 * Environment variables:
 * - UPSTASH_REDIS_REST_URL (required for Redis mode)
 * - UPSTASH_REDIS_REST_TOKEN (required for Redis mode)
 *
 * Exports:
 * - rateLimit(request, maxRequests?, windowMs?) — Async rate limiter.
 *   Returns a 429 Response if rate-limited, or null if allowed.
 */

import logger from '@/lib/logger';

// Check if Upstash Redis is configured
const isRedisConfigured = () => {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
};

let redis = null;

// Lazy load Redis client
async function getRedisClient() {
  if (!isRedisConfigured()) {
    return null;
  }

  if (!redis) {
    try {
      const { Redis } = await import(/* webpackIgnore: true */ '@upstash/redis');
      redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      logger.info('Upstash Redis rate limiter initialized');
    } catch (error) {
      logger.error({ err: error }, 'Failed to initialize Upstash Redis');
      return null;
    }
  }

  return redis;
}

/**
 * Get client IP from request headers
 */
function getClientIP(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';
}

// In-memory fallback store (used when Redis is not configured)
const inMemoryStore = new Map();

/**
 * Clean up expired entries from in-memory store to prevent memory leaks.
 */
function cleanupInMemoryStore() {
  const now = Date.now();
  for (const [key, data] of inMemoryStore.entries()) {
    if (data.expiresAt <= now) {
      inMemoryStore.delete(key);
    }
  }
}

// Periodic cleanup every 5 minutes (only in dev; Redis handles expiry in prod)
if (process.env.NODE_ENV !== 'production') {
  setInterval(cleanupInMemoryStore, 5 * 60 * 1000);
}

/**
 * Sliding window rate limit check using Redis sorted sets
 */
async function checkRateLimitRedis(redisClient, key, maxRequests, windowMs) {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Remove old entries outside the window
  await redisClient.zremrangebyscore(key, 0, windowStart);

  // Count current requests in window
  const count = await redisClient.zcard(key);

  if (count >= maxRequests) {
    // Get oldest entry to calculate retry time
    const oldest = await redisClient.zrange(key, 0, 0, { withScores: true });
    const retryAfterMs = oldest.length >= 2 ? Math.ceil(oldest[1] + windowMs - now) : windowMs;

    return {
      allowed: false,
      remaining: 0,
      retryAfterMs,
      limit: maxRequests,
    };
  }

  // Add new request
  await redisClient.zadd(key, { score: now, member: now + Math.random() });
  await redisClient.expire(key, Math.ceil(windowMs / 1000) + 1);

  return {
    allowed: true,
    remaining: maxRequests - count - 1,
    retryAfterMs: 0,
    limit: maxRequests,
  };
}

/**
 * Sliding window rate limit check using in-memory store
 */
function checkRateLimitInMemory(key, maxRequests, windowMs) {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Get or create record
  let record = inMemoryStore.get(key);
  if (!record) {
    record = { timestamps: [], expiresAt: now + windowMs + 60000 };
    inMemoryStore.set(key, record);
  }

  // Filter out timestamps outside the window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= maxRequests) {
    const retryAfterMs = record.timestamps[0] + windowMs - now;
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs,
      limit: maxRequests,
    };
  }

  record.timestamps.push(now);

  return {
    allowed: true,
    remaining: maxRequests - record.timestamps.length - 1,
    retryAfterMs: 0,
    limit: maxRequests,
  };
}

/**
 * Create a rate limit response if limit exceeded
 */
function createRateLimitResponse(result) {
  return new Response(
    JSON.stringify({
      error: 'Too many requests. Please wait a moment before trying again.',
      retryAfterMs: result.retryAfterMs,
      limit: result.limit,
      remaining: 0,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil(result.retryAfterMs / 1000)),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Date.now() + result.retryAfterMs),
      },
    }
  );
}

/**
 * Rate limit check for API routes.
 *
 * Positional API: rateLimit(request, maxRequests, windowMs)
 * Returns a 429 Response if rate-limited, or null if allowed.
 *
 * @param {Request} request — The incoming request
 * @param {number} maxRequests — Max requests in window (default 20)
 * @param {number} windowMs — Time window in ms (default 60000 = 1 min)
 * @returns {Promise<Response|null>} — 429 response if limited, null if allowed
 */
export async function rateLimit(request, maxRequests = 20, windowMs = 60000) {
  const ip = getClientIP(request);
  const key = `ratelimit:api:${ip}`;

  // Try Redis first
  const redisClient = await getRedisClient();

  if (redisClient) {
    try {
      const result = await checkRateLimitRedis(redisClient, key, maxRequests, windowMs);
      if (!result.allowed) {
        return createRateLimitResponse(result);
      }
      return null;
    } catch (error) {
      logger.error({ err: error, key }, 'Redis rate limit failed, falling back to in-memory');
    }
  }

  // Fallback to in-memory
  const result = checkRateLimitInMemory(key, maxRequests, windowMs);
  if (!result.allowed) {
    return createRateLimitResponse(result);
  }
  return null;
}
