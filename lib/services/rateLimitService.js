/**
 * Redis/Upstash Rate Limiting Service
 * 
 * Uses Upstash Redis for serverless-compatible rate limiting with
 * automatic fallback to in-memory for development.
 * 
 * Install: npm install @upstash/redis
 * 
 * Environment variables:
 * - UPSTASH_REDIS_REST_URL (required for Redis mode)
 * - UPSTASH_REDIS_REST_TOKEN (required for Redis mode)
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
      const { Redis } = await import('@upstash/redis');
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

// In-memory fallback (development mode)
const inMemoryStore = new Map();

/**
 * Clean up expired entries from in-memory store
 */
function cleanupInMemoryStore() {
  const now = Date.now();
  for (const [key, data] of inMemoryStore.entries()) {
    if (data.expiresAt <= now) {
      inMemoryStore.delete(key);
    }
  }
}

// Periodic cleanup every 5 minutes
if (process.env.NODE_ENV !== 'production') {
  setInterval(cleanupInMemoryStore, 5 * 60 * 1000);
}

/**
 * Sliding window rate limit check using Redis sorted sets
 */
export async function checkRateLimitRedis(redisClient, key, maxRequests, windowMs) {
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
 * Main rate limit function
 * 
 * @param {Request} request - The incoming request
 * @param {Object} options - Rate limit options
 * @param {number} options.maxRequests - Maximum requests allowed (default: 20)
 * @param {number} options.windowMs - Time window in milliseconds (default: 60000)
 * @param {string} options.keyPrefix - Prefix for the rate limit key (default: 'ratelimit')
 * @param {string} options.keySuffix - Suffix identifier (e.g., 'api', 'auth')
 * @returns {Object} Rate limit result with allowed, remaining, retryAfterMs, limit
 */
export async function rateLimit(request, options = {}) {
  const {
    maxRequests = 20,
    windowMs = 60000,
    keyPrefix = 'ratelimit',
    keySuffix = 'global',
  } = options;
  
  const ip = getClientIP(request);
  const key = `${keyPrefix}:${keySuffix}:${ip}`;
  
  // Try Redis first
  const redisClient = await getRedisClient();
  
  if (redisClient) {
    try {
      return await checkRateLimitRedis(redisClient, key, maxRequests, windowMs);
    } catch (error) {
      logger.error({ err: error, key }, 'Redis rate limit failed, falling back to in-memory');
    }
  }
  
  // Fallback to in-memory
  return checkRateLimitInMemory(key, maxRequests, windowMs);
}

/**
 * Create a rate limit response if limit exceeded
 */
export function createRateLimitResponse(result) {
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
 * Middleware helper for Next.js API routes
 * 
 * Usage:
 * const result = await apiRateLimit(request, { maxRequests: 10, windowMs: 60000 });
 * if (!result.allowed) return createRateLimitResponse(result);
 */
export async function apiRateLimit(request, options = {}) {
  const result = await rateLimit(request, {
    keyPrefix: 'api',
    keySuffix: 'general',
    ...options,
  });
  
  return result;
}

/**
 * Auth rate limiter (stricter limits for auth endpoints)
 */
export async function authRateLimit(request, options = {}) {
  return rateLimit(request, {
    maxRequests: 5,
    windowMs: 60000,
    keyPrefix: 'auth',
    keySuffix: 'attempt',
    ...options,
  });
}

/**
 * Code execution rate limiter
 */
export async function codeExecutionRateLimit(request, options = {}) {
  return rateLimit(request, {
    maxRequests: 10,
    windowMs: 60000,
    keyPrefix: 'code',
    keySuffix: 'execute',
    ...options,
  });
}

// Export the old API for backward compatibility
export function legacyRateLimit(request, maxRequests = 20, windowMs = 60000) {
  // Sync wrapper for backward compatibility
  const result = checkRateLimitInMemory(getClientIP(request), maxRequests, windowMs);
  if (!result.allowed) {
    return createRateLimitResponse(result);
  }
  return null;
}