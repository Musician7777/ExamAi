'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/lib/ga';

/**
 * Fires a GA4 page_view event on every client-side route change.
 *
 * Next.js App Router navigates without a full page reload, so the
 * automatic `send_page_view: true` in the gtag config only covers the
 * initial hard load. This component hooks into `usePathname` to emit
 * virtual pageviews for every subsequent navigation.
 *
 * The first render is skipped because `send_page_view: true` in the
 * gtag config already handles the initial pageview on hard load —
 * this avoids double-counting.
 *
 * Note: Consent Mode v2 handles the consent gating automatically —
 * when consent is denied, GA4 sends cookieless pings for behavioral
 * modeling; when granted, full hits are sent. No manual consent check
 * needed here.
 */
export default function PageViewTracker() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return; // gtag config's send_page_view: true handles the initial pageview
    }
    trackPageView(pathname);
  }, [pathname]);

  return null; // renders nothing
}
