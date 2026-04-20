'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Shield, Cookie, X, Settings, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useConsent } from '@/app/providers/ConsentProvider';

export default function CookieConsent() {
  const { showBanner, accept, reject, resetConsent } = useConsent();
  const { data: session } = useSession();
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);
  const [exiting, setExiting] = useState(false);

  if (!showBanner) return null;

  function handleAccept() {
    setExiting(true);
    setTimeout(() => accept(), 300);
  }

  function handleReject() {
    setExiting(true);
    setTimeout(() => reject(), 300);
  }

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-[100] flex justify-center p-4 sm:p-6 transition-all duration-300',
        exiting ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
      )}
      role="dialog"
      aria-label="Cookie consent"
    >
      <div
        className={cn(
          'w-full max-w-2xl rounded-2xl border-2 shadow-2xl backdrop-blur-xl overflow-hidden',
          'bg-card/90 border-border/50',
          'animate-[slideDown_0.4s_ease-out]'
        )}
      >
        {/* Header */}
        <div className="flex items-start gap-4 p-5 pb-0">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand/10 shrink-0">
            <Cookie className="h-5 w-5 text-brand" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              We value your privacy
              <Shield className="h-4 w-4 text-muted-foreground" />
            </h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              We use cookies to analyze site traffic and improve your experience. Your data is never sold to third
              parties.{' '}
              <button
                type="button"
                className="text-brand hover:underline focus-visible:outline-none focus-visible:underline cursor-pointer"
                onClick={() => {
                  if (session) {
                    router.push('/dashboard/profile#cookie-preferences');
                  } else {
                    resetConsent();
                  }
                }}
              >
                Manage cookies
              </button>
            </p>
          </div>
          <button
            onClick={handleReject}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary/50"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Expandable details */}
        {showDetails && (
          <div className="px-5 pt-3 pb-1 space-y-2">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Essential cookies</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Required for the app to function (authentication, session state). Always active.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
              <div className="w-6 h-6 rounded-full bg-brand/20 flex items-center justify-center shrink-0 mt-0.5">
                <Shield className="h-3.5 w-3.5 text-brand" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Analytics cookies</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Help us understand how you use ExamAI so we can improve. Powered by Google Analytics 4. No personal
                  data is collected.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 p-5 pt-3 flex-wrap">
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => setShowDetails((v) => !v)}>
            <Settings className="h-3 w-3" />
            {showDetails ? 'Hide details' : 'Learn more'}
          </Button>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={handleReject}
          >
            Decline
          </Button>
          <Button variant="brand" size="sm" className="text-xs gap-1.5" onClick={handleAccept}>
            <Check className="h-3.5 w-3.5" />
            Accept analytics
          </Button>
        </div>
      </div>
    </div>
  );
}
