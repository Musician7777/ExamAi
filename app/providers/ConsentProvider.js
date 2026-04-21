'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

import { CONSENT_KEY } from '@/lib/constants';

const ConsentContext = createContext({
  consent: null, // 'granted' | 'denied' | null (not yet decided)
  accept: () => {},
  reject: () => {},
  resetConsent: () => {},
  showBanner: false,
});

export function ConsentProvider({ children }) {
  const [consent, setConsent] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (stored === 'granted' || stored === 'denied') {
        setConsent(stored);
      }
    } catch {
      // localStorage unavailable (SSR / private browsing)
    }
    setMounted(true);
  }, []);

  // Sync stored consent to gtag on mount (so returning users who already accepted get analytics)
  // Retries up to 5 times because the gtag script may not have loaded yet when this effect first runs.
  useEffect(() => {
    if (consent !== 'granted') return;

    let attempts = 0;
    const maxAttempts = 5;
    const delay = 500; // ms between retries

    function syncConsent() {
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('consent', 'update', {
          analytics_storage: 'granted',
          ad_storage: 'granted',
          ad_user_data: 'granted',
          ad_personalization: 'granted',
          ads_data_redaction: false,
        });
        return true;
      }
      return false;
    }

    if (syncConsent()) return;

    const interval = setInterval(() => {
      attempts++;
      if (syncConsent() || attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, delay);

    return () => clearInterval(interval);
  }, [consent]);

  const accept = useCallback(() => {
    try {
      localStorage.setItem(CONSENT_KEY, 'granted');
    } catch {
      /* ignore */
    }
    setConsent('granted');
    // Update Google Consent Mode
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
        ads_data_redaction: false,
      });
    }
  }, []);

  const reject = useCallback(() => {
    try {
      localStorage.setItem(CONSENT_KEY, 'denied');
    } catch {
      /* ignore */
    }
    setConsent('denied');
    // Explicitly deny — keeps GA from collecting even via Consent Mode modeling
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        ads_data_redaction: true,
      });
    }
  }, []);

  const resetConsent = useCallback(() => {
    try {
      localStorage.removeItem(CONSENT_KEY);
    } catch {
      /* ignore */
    }
    setConsent(null);
    // Reset Google Consent Mode to defaults
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        ads_data_redaction: true,
      });
    }
  }, []);

  // Don't render context value until mounted (avoids hydration mismatch)
  const value = {
    consent: mounted ? consent : null,
    accept,
    reject,
    resetConsent,
    showBanner: mounted && consent === null,
  };

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent() {
  return useContext(ConsentContext);
}
