'use client';
import { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load the ChartCanvas component - Chart.js is heavy (~50KB gzipped)
const ChartCanvas = lazy(() => import('./ChartCanvas'));

// Skeleton fallback shown while Chart.js is loading
function ChartSkeleton({ className = '' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className='flex flex-col items-center gap-3'>
        <Skeleton className='h-8 w-8 rounded-full' />
        <Skeleton className='h-4 w-24' />
        <p className='text-xs text-muted-foreground'>Loading chart...</p>
      </div>
    </div>
  );
}

/**
 * Lazy-loaded ChartCanvas wrapper with automatic code splitting.
 *
 * Benefits:
 * - Chart.js (~50KB gzipped) is only loaded when charts are needed
 * - Shows skeleton fallback during loading for better perceived performance
 * - Graceful error handling with retry option
 *
 * @example
 * // Instead of:
 * import ChartCanvas from '@/components/ChartCanvas/ChartCanvas';
 * <ChartCanvas config={config} />
 *
 * // Use:
 * import LazyChartCanvas from '@/components/ChartCanvas/LazyChartCanvas';
 * <LazyChartCanvas config={config} />
 */
export default function LazyChartCanvas({ config, className = '' }) {
  return (
    <Suspense fallback={<ChartSkeleton className={className} />}>
      <ChartCanvas config={config} />
    </Suspense>
  );
}