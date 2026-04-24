/**
 * Redis Cache Service using Upstash Redis
 * Replaces in-memory LRU cache for serverless compatibility
 *
 * Install: npm install @upstash/redis
 *
 * Features:
 * - Automatic fallback to in-memory when Redis not configured
 * - JSON serialization for complex data
 * - TTL support with automatic expiration
 * - Cache invalidation by prefix
 * - Stats tracking
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
      logger.info('Upstash Redis cache initialized');
    } catch (error) {
      logger.error({ err: error }, 'Failed to initialize Upstash Redis cache');
      return null;
    }
  }

  return redis;
}

// In-memory fallback cache with LRU eviction and size limits
class InMemoryFallback {
  constructor(maxSize = 500) {
    this.maxSize = maxSize;
    this.cache = new Map(); // Map preserves insertion order → LRU via re-insert on access
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) {
      this.misses++;
      return null;
    }
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }
    // Promote to most-recently-used by re-inserting
    this.cache.delete(key);
    this.cache.set(key, item);
    this.hits++;
    return item.value;
  }

  set(key, value, ttl) {
    // If key already exists, delete first so re-insert moves it to end (MRU)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Lazy sweep: evict expired entries first, then LRU if still at capacity
      this._evictExpired();
      if (this.cache.size >= this.maxSize) {
        const oldestKey = this.cache.keys().next().value;
        this.cache.delete(oldestKey);
        this.evictions++;
      }
    }
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  /** Remove expired entries (lazy GC to prevent stale entries from crowding out fresh ones) */
  _evictExpired() {
    const now = Date.now();
    for (const [key, item] of this.cache) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
      // Note: Map iterates in insertion order so expired entries tend to cluster
      // at the front. Could break early on first non-expired for performance.
    }
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  async deletePrefix(prefix) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.cache.delete(key));
    return keysToDelete.length;
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? ((this.hits / total) * 100).toFixed(1) + '%' : '0%',
      size: this.cache.size,
      maxSize: this.maxSize,
      evictions: this.evictions,
    };
  }
}

const inMemoryCache = new InMemoryFallback();

// In-flight request tracking for stampede prevention
const inFlightRequests = new Map();

// TTL presets (in seconds)
export const CACHE_TTL = {
  SHORT: 60, // 1 minute - for frequently changing data
  MEDIUM: 300, // 5 minutes - for standard cache
  LONG: 900, // 15 minutes - for stable data
  EXTENDED: 1800, // 30 minutes - for AI responses
  DAY: 86400, // 1 day - for leaderboard, presets
};

// Cache key prefixes
export const CACHE_KEYS = {
  EXAM_PRESET: 'exam:preset:',
  INTERVIEW_CONFIG: 'interview:config:',
  LEADERBOARD: 'leaderboard:',
  USER_PROFILE: 'user:profile:',
  AI_RESPONSE: 'ai:response:',
  ACTIVITIES: 'activities:',
  DASHBOARD: 'dashboard:',
};

/**
 * Serialize value for storage (handles complex objects)
 */
function serialize(value) {
  return JSON.stringify(value);
}

/**
 * Deserialize value from storage
 */
function deserialize(value) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/**
 * Get a cached value
 * @param {string} key - Cache key
 * @returns {*} Cached value or null
 */
export async function cacheGet(key) {
  const redisClient = await getRedisClient();

  if (redisClient) {
    try {
      const value = await redisClient.get(key);
      if (value !== null) {
        logger.debug({ key }, '[Redis Cache] HIT');
        return deserialize(value);
      }
      logger.debug({ key }, '[Redis Cache] MISS');
      return null;
    } catch (error) {
      logger.error({ err: error, key }, '[Redis Cache] GET error, falling back to in-memory');
    }
  }

  return inMemoryCache.get(key);
}

/**
 * Set a cached value
 * @param {string} key - Cache key
 * @param {*} value - Value to cache
 * @param {number} ttlSeconds - TTL in seconds (default: 5 minutes)
 */
export async function cacheSet(key, value, ttlSeconds = CACHE_TTL.MEDIUM) {
  const redisClient = await getRedisClient();
  const serialized = serialize(value);

  if (redisClient) {
    try {
      await redisClient.set(key, serialized, { ex: ttlSeconds });
      logger.debug({ key, ttl: ttlSeconds }, '[Redis Cache] SET');
      return true;
    } catch (error) {
      logger.error({ err: error, key }, '[Redis Cache] SET error, falling back to in-memory');
    }
  }

  inMemoryCache.set(key, value, ttlSeconds * 1000);
  return true;
}

/**
 * Delete a cached value
 * @param {string} key - Cache key
 */
export async function cacheDelete(key) {
  const redisClient = await getRedisClient();

  if (redisClient) {
    try {
      await redisClient.del(key);
      logger.debug({ key }, '[Redis Cache] DELETE');
      return true;
    } catch (error) {
      logger.error({ err: error, key }, '[Redis Cache] DEL error');
    }
  }

  return inMemoryCache.delete(key);
}

/**
 * Invalidate cache entries by prefix
 * @param {string} prefix - Cache key prefix
 */
export async function cacheInvalidatePrefix(prefix) {
  const redisClient = await getRedisClient();

  if (redisClient) {
    try {
      // Use SCAN to find keys matching pattern
      const pattern = `${prefix}*`;
      let cursor = 0;
      let deletedCount = 0;

      do {
        const [newCursor, keys] = await redisClient.scan(cursor, { match: pattern, count: 100 });
        cursor = newCursor;

        if (keys.length > 0) {
          await redisClient.del(...keys);
          deletedCount += keys.length;
        }
      } while (cursor !== '0');

      logger.info({ prefix, deletedCount }, '[Redis Cache] Invalidated by prefix');
      return deletedCount;
    } catch (error) {
      logger.error({ err: error, prefix }, '[Redis Cache] Invalidate prefix error');
    }
  }

  return await inMemoryCache.deletePrefix(prefix);
}

/**
 * Clear all cache
 */
export async function cacheClear() {
  const redisClient = await getRedisClient();

  if (redisClient) {
    try {
      // Only clear our prefixed keys, not everything
      const prefixes = Object.values(CACHE_KEYS);
      let totalDeleted = 0;

      for (const prefix of prefixes) {
        totalDeleted += await cacheInvalidatePrefix(prefix);
      }

      logger.info({ totalDeleted }, '[Redis Cache] CLEAR');
      return totalDeleted;
    } catch (error) {
      logger.error({ err: error }, '[Redis Cache] CLEAR error');
    }
  }

  inMemoryCache.clear();
  return true;
}

/**
 * Cache wrapper for async functions with stampede prevention
 * If multiple concurrent requests miss the cache for the same key,
 * only the first one calls the underlying function; the rest await the same promise.
 * @param {string} key - Cache key
 * @param {Function} fn - Async function to call on cache miss
 * @param {number} ttlSeconds - Cache TTL in seconds
 * @returns {*} Cached or fresh value
 */
export async function cacheWrap(key, fn, ttlSeconds = CACHE_TTL.MEDIUM) {
  const cached = await cacheGet(key);
  if (cached !== null) {
    return cached;
  }

  // Stampede prevention: reuse in-flight promise for the same key
  const existing = inFlightRequests.get(key);
  if (existing) {
    return existing;
  }

  const promise = fn()
    .then((value) => {
      if (value !== null && value !== undefined) {
        // Fire-and-forget cache set — don't block the response
        cacheSet(key, value, ttlSeconds).catch((err) =>
          logger.error({ err, key }, '[Cache] Failed to set value after stampede-protected fetch')
        );
      }
      return value;
    })
    .finally(() => {
      inFlightRequests.delete(key);
    });

  inFlightRequests.set(key, promise);
  return promise;
}

/**
 * Get cache stats
 */
export async function getCacheStats() {
  const redisClient = await getRedisClient();

  if (redisClient) {
    try {
      const info = await redisClient.info('memory');
      return {
        backend: 'redis',
        info: info.split('\\r\\n').slice(0, 10).join(', '),
      };
    } catch (error) {
      logger.error({ err: error }, '[Redis Cache] Stats error');
    }
  }

  return {
    backend: 'in-memory',
    ...inMemoryCache.getStats(),
  };
}
