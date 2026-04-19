/**
 * Client-Side Data Cache
 *
 * Module-level Map that survives SPA navigations within the same browser tab.
 * When the user navigates between dashboard pages, cached data is returned
 * instantly from memory instead of re-fetching from the server.
 *
 * Stale-while-revalidate pattern:
 *  - Return cached data immediately if available (even if stale)
 *  - Kick off a background re-fetch if the TTL has expired
 *  - Update the state when fresh data arrives
 */

const cache = new Map();

/** Default TTL: 60 seconds for read-heavy data */
const DEFAULT_TTL = 60_000;

/**
 * Get a cached value.
 * @param {string} key
 * @returns {{ data: any, isStale: boolean } | null}
 */
export function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;

  const isStale = Date.now() > entry.expiresAt;
  return { data: entry.data, isStale };
}

/**
 * Set a cached value.
 * @param {string} key
 * @param {*} data
 * @param {number} [ttlMs] - Time to live in ms (default 60s)
 */
export function cacheSet(key, data, ttlMs = DEFAULT_TTL) {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
    ttl: ttlMs,
  });
}

/**
 * Invalidate one or more cache entries by prefix.
 * E.g. invalidate('dashboard') will remove 'dashboard' and 'dashboard:gamification'
 * @param {string} prefix
 */
export function cacheInvalidate(prefix) {
  for (const key of cache.keys()) {
    if (key === prefix || key.startsWith(prefix + ':') || key.startsWith(prefix + '?')) {
      cache.delete(key);
    }
  }
}

/**
 * Delete a specific key.
 * @param {string} key
 */
export function cacheDelete(key) {
  cache.delete(key);
}

/**
 * Clear all cache entries.
 */
export function cacheClear() {
  cache.clear();
}

/**
 * Build a cache key from a URL string.
 * Strips trailing slashes for consistency.
 * @param {string} url
 * @returns {string}
 */
export function buildCacheKey(url) {
  return url.replace(/\/+$/, '');
}
