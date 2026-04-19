/**
 * In-Memory LRU Cache Service
 * Can be swapped for Redis/Upstash later via environment variable
 */

class LRUCache {
    constructor(maxSize = 100, defaultTTL = 300000) { // 5 min default TTL
        this.cache = new Map();
        this.maxSize = maxSize;
        this.defaultTTL = defaultTTL;
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        // Move to end (most recently used)
        this.cache.delete(key);
        this.cache.set(key, item);
        return item.value;
    }

    set(key, value, ttl) {
        // Evict oldest if at capacity
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            value,
            expiresAt: Date.now() + (ttl || this.defaultTTL),
        });
    }

    delete(key) {
        return this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }

    has(key) {
        return this.get(key) !== null;
    }

    get size() {
        return this.cache.size;
    }
}

// Singleton instance
let cacheInstance = null;

function getCache() {
    if (!cacheInstance) {
        cacheInstance = new LRUCache(200, 5 * 60 * 1000); // 200 items, 5 min TTL
    }
    return cacheInstance;
}

/**
 * Get a cached value
 * @param {string} key
 * @returns {*} The cached value or null
 */
export function cacheGet(key) {
    return getCache().get(key);
}

/**
 * Set a cached value
 * @param {string} key
 * @param {*} value
 * @param {number} ttlMs - Time to live in milliseconds
 */
export function cacheSet(key, value, ttlMs) {
    getCache().set(key, value, ttlMs);
}

/**
 * Delete a cached value
 * @param {string} key
 */
export function cacheDelete(key) {
    getCache().delete(key);
}

/**
 * Clear all cache
 */
export function cacheClear() {
    getCache().clear();
}

/**
 * Cache wrapper for async functions
 * @param {string} key - Cache key
 * @param {Function} fn - Async function to call on cache miss
 * @param {number} ttlMs - Cache TTL
 * @returns {*} Cached or fresh value
 */
export async function cacheWrap(key, fn, ttlMs = 300000) {
    const cached = cacheGet(key);
    if (cached) {
        console.debug(`[Cache] HIT: ${key}`);
        return cached;
    }
    console.debug(`[Cache] MISS: ${key}`);
    const value = await fn();
    cacheSet(key, value, ttlMs);
    return value;
}

// Pre-defined cache keys
export const CACHE_KEYS = {
    examPreset: (type) => `exam:preset:${type}`,
    interviewConfig: (type) => `interview:config:${type}`,
    leaderboard: (page) => `leaderboard:page:${page}`,
    userProfile: (userId) => `user:profile:${userId}`,
};
