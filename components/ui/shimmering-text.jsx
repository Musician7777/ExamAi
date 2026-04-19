'use client';

import { cn } from '@/lib/utils';

/**
 * ShimmeringText — animated text with gradient shimmer effect.
 * Props:
 * - text: string — the text to display
 * - className: string
 */
function ShimmeringText({ text, className, ...props }) {
  return (
    <span
      className={cn('inline-block', className)}
      style={{
        background:
          'linear-gradient(90deg, hsl(var(--muted-foreground)) 0%, hsl(var(--foreground)) 50%, hsl(var(--muted-foreground)) 100%)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        animation: 'shimmer 2s linear infinite',
      }}
      {...props}
    >
      {text}
    </span>
  );
}

export { ShimmeringText };
