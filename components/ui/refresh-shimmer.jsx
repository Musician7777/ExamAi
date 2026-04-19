'use client';

import { cn } from '@/lib/utils';

/**
 * RefreshShimmer — a thin animated gradient bar shown during background
 * stale-while-revalidate data refreshes.
 *
 * Place it at the top of a card/section. It slides in when `active` is true
 * and fades out when the fresh data arrives.
 *
 * Props:
 * - active: boolean — show the shimmer while background revalidation is in progress
 * - className: string — optional extra classes
 */
export function RefreshShimmer({ active, className }) {
  return (
    <div
      className={cn(
        'h-0.5 w-full overflow-hidden rounded-t-lg transition-opacity duration-300',
        active ? 'opacity-100' : 'opacity-0 pointer-events-none',
        className
      )}
      role="status"
      aria-label={active ? 'Refreshing data' : undefined}
    >
      <div
        className="h-full w-1/3 rounded-full animate-[shimmer-slide_1.5s_ease-in-out_infinite]"
        style={{
          background:
            'linear-gradient(90deg, transparent, hsl(var(--brand) / 0.6), hsl(var(--brand)), hsl(var(--brand) / 0.6), transparent)',
          backgroundSize: '200% 100%',
        }}
      />
    </div>
  );
}
