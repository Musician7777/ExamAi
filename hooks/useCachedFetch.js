'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { cacheGet, cacheSet, cacheInvalidate, cacheDelete, buildCacheKey } from '@/lib/clientCache';

/**
 * useCachedFetch — stale-while-revalidate data fetching hook.
 *
 * 1. If fresh data exists in the client cache → return it instantly (no loading flash).
 * 2. If data is stale (past TTL) → still return it, but kick off a background re-fetch.
 * 3. If no data at all → show loading, fetch from server.
 *
 * @param {string}   url          - API URL to fetch
 * @param {Object}   options
 * @param {any[]}    options.deps           - Dependencies array (re-fetch when changed). Default []
 * @param {number}   options.ttl            - Cache TTL in ms. Default 60000 (60s)
 * @param {boolean}  options.enabled        - Set false to skip fetching. Default true
 * @param {string[]} options.invalidateOn   - Cache prefixes to invalidate before fetching
 * @param {Function} options.onSuccess      - Callback(data) after successful fetch
 * @param {Function} options.selector       - Extract the relevant piece from the JSON response
 * @param {boolean}  options.dedup          - Deduplicate concurrent fetches to same URL. Default true
 *
 * @returns {{ data: any, loading: boolean, error: Error|null, refetch: Function }}
 */
export function useCachedFetch(url, options = {}) {
  const { deps = [], ttl = 60_000, enabled = true, invalidateOn = [], onSuccess, selector, dedup = true } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const [revalidating, setRevalidating] = useState(false);

  // Stable refs for callbacks/arrays to avoid re-triggering fetches
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const selectorRef = useRef(selector);
  selectorRef.current = selector;
  const invalidateOnRef = useRef(invalidateOn);
  invalidateOnRef.current = invalidateOn;

  // Dedup map shared across hook instances on the same URL
  const inflightRef = useRef(
    typeof window !== 'undefined'
      ? window.__cachedFetchInflight || (window.__cachedFetchInflight = new Map())
      : new Map()
  );

  // AbortController ref for cleanup on unmount / re-render
  const abortRef = useRef(null);

  const fetchData = useCallback(
    async (signal) => {
      if (!url || !enabled) return;

      const cacheKey = buildCacheKey(url);

      // Invalidate any specified prefixes before fetching
      const inv = invalidateOnRef.current;
      if (inv.length > 0) {
        inv.forEach((prefix) => cacheInvalidate(prefix));
      }

      // Check cache first
      const cached = cacheGet(cacheKey);
      if (cached) {
        // Serve cached data immediately
        const selectedData = selectorRef.current ? selectorRef.current(cached.data) : cached.data;
        setData(selectedData);
        setError(null);
        setLoading(false);

        if (!cached.isStale) {
          // Fresh — no need to re-fetch
          setRevalidating(false);
          return;
        }

        // Stale — serve it but revalidate in background (fire-and-forget)
        setRevalidating(true);
        try {
          const res = await fetch(url, { signal });
          if (!signal?.aborted && res.ok) {
            const json = await res.json();
            cacheSet(cacheKey, json, ttl);
            const freshData = selectorRef.current ? selectorRef.current(json) : json;
            setData(freshData);
            setError(null);
            setRevalidating(false);
            onSuccessRef.current?.(freshData);
          } else if (!signal?.aborted) {
            setRevalidating(false);
          }
        } catch {
          // Background revalidation failed silently — stale data still shown
          if (!signal?.aborted) setRevalidating(false);
        }
        return;
      }

      // --- No cached data at all, must fetch ---
      setRevalidating(false);

      // Dedup: if a fetch to this URL is already in flight, piggyback on it
      if (dedup && inflightRef.current.has(cacheKey)) {
        try {
          const result = await inflightRef.current.get(cacheKey);
          if (!signal?.aborted) {
            const selectedData = selectorRef.current ? selectorRef.current(result) : result;
            setData(selectedData);
            setLoading(false);
          }
        } catch (err) {
          if (!signal?.aborted) {
            setError(err);
            setLoading(false);
          }
        }
        return;
      }

      if (!signal?.aborted) setLoading(true);

      const fetchPromise = (async () => {
        try {
          const res = await fetch(url, { signal });
          if (!res.ok) {
            throw new Error(`Fetch error: ${res.status}`);
          }
          const json = await res.json();
          // Store raw response in cache
          cacheSet(cacheKey, json, ttl);
          return json;
        } catch (err) {
          if (signal?.aborted) throw err;
          setError(err);
          throw err;
        } finally {
          inflightRef.current.delete(cacheKey);
        }
      })();

      if (dedup) inflightRef.current.set(cacheKey, fetchPromise);

      try {
        const json = await fetchPromise;
        if (!signal?.aborted) {
          const selectedData = selectorRef.current ? selectorRef.current(json) : json;
          setData(selectedData);
          setError(null);
          setLoading(false);
          onSuccessRef.current?.(selectedData);
        }
      } catch {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [url, enabled, ttl, ...deps]
  );

  useEffect(() => {
    if (enabled) {
      // Create a new AbortController for each effect run
      const controller = new AbortController();
      abortRef.current = controller;
      fetchData(controller.signal);
      return () => controller.abort();
    }
    setLoading(false);
    setRevalidating(false);
  }, [fetchData, enabled]);

  const refetch = useCallback(() => {
    // Abort any in-flight fetch from the effect
    abortRef.current?.abort();
    const cacheKey = buildCacheKey(url);
    cacheDelete(cacheKey);
    const controller = new AbortController();
    abortRef.current = controller;
    const result = fetchData(controller.signal);
    return result;
  }, [fetchData, url]);

  return { data, loading, error, revalidating, refetch };
}
