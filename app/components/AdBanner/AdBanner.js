'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useAds } from '@/app/providers/AdsProvider';

export default function AdBanner({ className, slot, format = 'auto', style }) {
  const { adsVisible } = useAds();
  const adRef = useRef(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    if (!adsVisible) {
      // Reset so push fires again when ads are re-enabled
      pushedRef.current = false;
      return;
    }
    if (!slot || pushedRef.current) return;
    // AdSense requires this push to render the ad unit
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushedRef.current = true;
    } catch {
      /* ignore — ad blocker may be active */
    }
  }, [adsVisible, slot]);

  if (!adsVisible || !slot) return null;

  return (
    <div className={cn('ad-container overflow-hidden rounded-lg relative', className)} style={style}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
      {/* Subtle "Ad" label — required for transparency and ad policy compliance */}
      <span className="absolute top-1 right-1 text-[9px] text-muted-foreground/50 bg-background/60 px-1 rounded pointer-events-none select-none">
        Ad
      </span>
    </div>
  );
}
