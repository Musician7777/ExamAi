'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { setUserId, clearUserId, setUserProperties } from '@/lib/ga';

/**
 * Syncs the authenticated user's identity to GA4.
 *
 * When a session exists, it sets:
 *   • user_id   — the MongoDB ObjectId from the JWT token (non-PII)
 *   • user_properties — auth_provider, plus level/streak/total_exams if available
 *
 * When the session ends (logout), it clears both so subsequent anonymous
 * events are not tied to the old identity.
 *
 * Placed inside <AuthProvider> so `useSession()` always has a provider.
 * Uses a ref to avoid redundant gtag calls on re-renders.
 */
export default function UserIdTracker() {
  const { data: session, status } = useSession();
  const lastSyncedId = useRef(null);

  useEffect(() => {
    // Still loading — do nothing
    if (status === 'loading') return;

    const userId = session?.user?.id || null;

    // Same user as last sync — skip
    if (userId === lastSyncedId.current) return;
    lastSyncedId.current = userId;

    if (!userId) {
      // User logged out or is anonymous
      clearUserId();
      return;
    }

    // ── Set user_id (non-PII: MongoDB ObjectId) ──
    setUserId(userId);

    // ── Set user_properties for audience segmentation ──
    // authProvider is persisted in the JWT token via the NextAuth callback,
    // so it's always available without an extra DB query.
    // Richer properties (level, streak) are augmented by downstream pages
    // (e.g. dashboard) via setUserProperties() when they have the data loaded.
    const authProvider = session?.user?.authProvider || undefined;

    setUserProperties({
      auth_provider: authProvider,
    });
  }, [session, status]);

  return null; // renders nothing
}
