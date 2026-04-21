'use client';

import { useState, useRef, useEffect } from 'react';
import { Shield, Check, Info, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useConsent } from '@/app/providers/ConsentProvider';
import { trackConsentDecision } from '@/lib/ga';

export default function CookiePreferences() {
  const { consent, accept, reject, resetConsent } = useConsent();
  const [confirmReset, setConfirmReset] = useState(false);
  const confirmTimerRef = useRef(null);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, []);

  const isGranted = consent === 'granted';
  const isDenied = consent === 'denied';

  function handleAccept() {
    trackConsentDecision({ decision: 'accepted' });
    accept();
    setConfirmReset(false);
  }

  function handleReject() {
    trackConsentDecision({ decision: 'rejected' });
    reject();
    setConfirmReset(false);
  }

  function handleReset() {
    if (confirmReset) {
      trackConsentDecision({ decision: 'reset' });
      resetConsent(); // Clears localStorage, sets consent to null, re-shows banner
      setConfirmReset(false);
    } else {
      setConfirmReset(true);
      confirmTimerRef.current = setTimeout(() => setConfirmReset(false), 4000);
    }
  }

  return (
    <div className="space-y-4">
      {/* Current status indicator */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
            isGranted
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : isDenied
                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                : 'bg-muted/50 text-muted-foreground border border-border/50'
          )}
        >
          <span
            className={cn(
              'w-2 h-2 rounded-full',
              isGranted ? 'bg-emerald-400' : isDenied ? 'bg-orange-400' : 'bg-muted-foreground/50'
            )}
          />
          {isGranted ? 'Analytics Enabled' : isDenied ? 'Analytics Disabled' : 'Not Yet Decided'}
        </div>
      </div>

      {/* Cookie categories */}
      <div className="space-y-2">
        {/* Essential cookies */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Essential cookies</p>
              <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Always active
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Required for authentication, session management, and core functionality. Cannot be disabled.
            </p>
          </div>
        </div>

        {/* Analytics cookies */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
          <div className="w-7 h-7 rounded-full bg-brand/20 flex items-center justify-center shrink-0 mt-0.5">
            <Shield className="h-3.5 w-3.5 text-brand" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Analytics cookies</p>
              {isGranted ? (
                <span className="text-[10px] font-medium uppercase tracking-wider text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                  Enabled
                </span>
              ) : (
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                  Disabled
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Help us understand how you use ExamAI so we can improve. Powered by Google Analytics 4. No personal data
              is collected.
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={isGranted ? 'outline' : 'brand'}
          size="sm"
          className={cn('text-xs gap-1.5', isGranted && 'opacity-50')}
          onClick={handleAccept}
          disabled={isGranted}
        >
          <Check className="h-3.5 w-3.5" />
          Accept Analytics
        </Button>
        <Button
          variant={isDenied ? 'outline' : 'ghost'}
          size="sm"
          className={cn('text-xs gap-1.5', isDenied ? 'opacity-50 text-muted-foreground' : 'text-muted-foreground')}
          onClick={handleReject}
          disabled={isDenied}
        >
          Decline
        </Button>
      </div>

      {/* Info notice + reset */}
      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/20 border border-border/30">
        <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Your choice is stored locally and remembered across sessions. You can reset your preference to show the
            consent banner again on your next visit.
          </p>
          <Button
            variant="link"
            size="sm"
            className={cn(
              'text-[11px] h-auto p-0 mt-1 gap-1 text-muted-foreground hover:text-foreground',
              confirmReset && 'text-destructive hover:text-destructive'
            )}
            onClick={handleReset}
          >
            <RotateCcw className="h-3 w-3" />
            {confirmReset ? 'Click again to confirm reset' : 'Reset cookie preference'}
          </Button>
        </div>
      </div>
    </div>
  );
}
