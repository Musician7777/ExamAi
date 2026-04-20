'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Cookie } from 'lucide-react';
import { useConsent } from '@/app/providers/ConsentProvider';
import { cn } from '@/lib/utils';

const EXIT_DURATION = 200; // ms — matches scaleOut animation duration
const EXPAND_TIMEOUT = 3000; // ms — auto-collapse after 3s

export default function FloatingCookieButton() {
  const { consent, showBanner, resetConsent } = useConsent();
  const { data: session } = useSession();
  const router = useRouter();
  const [exiting, setExiting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const collapseTimerRef = useRef(null);

  // Auto-collapse after timeout
  const resetCollapseTimer = useCallback(() => {
    if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    collapseTimerRef.current = setTimeout(() => setExpanded(false), EXPAND_TIMEOUT);
  }, []);

  // Cleanup on unmount
  // Note: expanded resets naturally when the exit animation completes
  // (handleClick sets expanded=false before triggering the exit),
  // and when the component re-mounts after the banner is dismissed.
  useEffect(() => {
    return () => {
      if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    };
  }, []);

  // Don't render while the consent banner is showing or consent is undecided
  // (unless we're mid-exit-animation, in which case keep mounted for the animation)
  if ((showBanner && !exiting) || (consent === null && !exiting)) return null;

  function handleClick() {
    if (exiting) return;

    // First tap: expand to show label
    if (!expanded) {
      setExpanded(true);
      resetCollapseTimer();
      return;
    }

    // Second tap while expanded: trigger action
    if (!session) {
      // Clear orphaned collapse timer
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
        collapseTimerRef.current = null;
      }
      // Play exit animation first, then reset consent to show the banner
      setExiting(true);
      setTimeout(() => {
        resetConsent();
        setExiting(false);
        setExpanded(false); // reset after unmount cycle
      }, EXIT_DURATION);
    } else {
      // Clear collapse timer and collapse before navigating
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
        collapseTimerRef.current = null;
      }
      setExpanded(false);
      router.push('/dashboard/profile#cookie-preferences');
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'fixed bottom-4 left-4 z-30 md:hidden',
        'flex items-center rounded-full',
        'h-9',
        expanded ? 'px-3 gap-1.5' : 'px-0 min-w-9 justify-center',
        'bg-card/90 border border-border/50 shadow-lg backdrop-blur-sm',
        'text-muted-foreground hover:text-foreground',
        'hover:bg-secondary hover:border-border',
        'active:scale-95',
        'transition-[padding,gap,transform,background-color,border-color,box-shadow,color] duration-200',
        exiting ? 'animate-[scaleOut_0.2s_ease-in_forwards]' : 'animate-[scaleIn_0.3s_ease-out_0.6s_backwards]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2'
      )}
      aria-label="Manage cookie preferences"
    >
      <Cookie className="h-4 w-4 shrink-0" />
      <span
        className={cn(
          'text-xs font-medium leading-none whitespace-nowrap overflow-hidden',
          'transition-[max-width,opacity,margin] duration-200',
          expanded ? 'max-w-[60px] opacity-100' : 'max-w-0 opacity-0'
        )}
      >
        Cookies
      </span>
    </button>
  );
}
