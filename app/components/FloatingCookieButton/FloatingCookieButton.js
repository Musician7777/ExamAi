'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Cookie } from 'lucide-react';
import { useConsent } from '@/app/providers/ConsentProvider';
import { cn } from '@/lib/utils';

export default function FloatingCookieButton() {
  const { consent, showBanner, resetConsent } = useConsent();
  const { data: session } = useSession();
  const router = useRouter();

  // Don't show while the consent banner is visible or before mount
  if (showBanner || consent === null) return null;

  function handleClick() {
    if (!session) {
      resetConsent(); // Re-show the cookie consent banner
    } else {
      router.push('/dashboard/profile#cookie-preferences');
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'fixed bottom-4 left-4 z-30 md:hidden',
        'flex items-center gap-1.5',
        'h-9 px-3 rounded-full',
        'bg-card/90 border border-border/50 shadow-lg backdrop-blur-sm',
        'text-muted-foreground hover:text-foreground',
        'hover:bg-secondary hover:border-border',
        'active:scale-95',
        'transition-[transform,background-color,border-color,box-shadow,color] duration-200',
        // scaleIn from globals.css with 0.6s delay; fill-mode backwards
        // keeps element invisible (opacity:0, scale:0.95) during the delay
        'animate-[scaleIn_0.3s_ease-out_0.6s_backwards]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2'
      )}
      aria-label="Manage cookie preferences"
    >
      <Cookie className="h-4 w-4 shrink-0" />
      <span className="text-xs font-medium leading-none">Cookies</span>
    </button>
  );
}
