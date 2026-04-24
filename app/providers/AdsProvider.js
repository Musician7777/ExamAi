'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useConsent } from './ConsentProvider';
import { secureFetch } from '@/lib/client-csrf';

const AdsContext = createContext({
  adsVisible: false,
  loading: true,
  toggleAds: async () => {},
});

export function AdsProvider({ children }) {
  const { consent } = useConsent();
  const { data: session } = useSession();
  const [showAds, setShowAds] = useState(true); // default: show ads
  const [loading, setLoading] = useState(true);

  // Fetch user preference on mount (logged-in users only)
  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/user')
        .then((r) => r.json())
        .then((data) => {
          if (data?.user?.showAds !== undefined) {
            setShowAds(data.user.showAds);
          }
        })
        .catch(() => {
          /* ignore — keep default */
        })
        .finally(() => setLoading(false));
    } else {
      // Guest users always see ads (showAds defaults to true)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- initial loading state for guest users
      setLoading(false);
    }
  }, [session?.user?.email]);

  // Ads are visible when: user consent is granted AND user hasn't opted out
  const adsVisible = consent === 'granted' && showAds && !!process.env.NEXT_PUBLIC_ADSENSE_ID;

  const toggleAds = useCallback(
    async (value) => {
      const newValue = value ?? !showAds;
      setShowAds(newValue);

      if (session?.user?.email) {
        try {
          await secureFetch('/api/user', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ showAds: newValue }),
          });
        } catch {
          /* non-critical — preference saved locally */
        }
      }
    },
    [showAds, session?.user?.email]
  );

  return <AdsContext.Provider value={{ adsVisible, loading, showAds, toggleAds }}>{children}</AdsContext.Provider>;
}

export function useAds() {
  return useContext(AdsContext);
}
