'use client';

import { cn } from '@/lib/utils';

/**
 * Response — styled response bubble for message content.
 * Handles word-wrapping and pre-wrap formatting.
 */
function Response({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl px-4 py-3 text-sm leading-relaxed',
        '[overflow-wrap:anywhere] whitespace-pre-wrap',
        // Role-based styling is inferred from the parent Message's data-role
        // Use CSS to select based on parent context
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { Response };
