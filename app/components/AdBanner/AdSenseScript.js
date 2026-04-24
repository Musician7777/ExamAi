'use client';

import Script from 'next/script';
import { useConsent } from '@/app/providers/ConsentProvider';
import { useAds } from '@/app/providers/AdsProvider';

export default function AdSenseScript() {
  const { consent } = useConsent();
  const { adsVisible } = useAds();

  // Only load the AdSense script when ads are visible and consent is granted
  if (!adsVisible || consent !== 'granted' || !process.env.NEXT_PUBLIC_ADSENSE_ID) return null;

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_ID}`}
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  );
}
