'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, CheckCircle2, XCircle, Check, X } from 'lucide-react';
import clientLogger from '@/lib/client-logger';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const passwordRules = [
    { label: 'At least 8 characters', met: newPassword.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(newPassword) },
    { label: 'One lowercase letter', met: /[a-z]/.test(newPassword) },
    { label: 'One number', met: /[0-9]/.test(newPassword) },
  ];
  const allPasswordRulesMet = passwordRules.every((r) => r.met);

  const [message, setMessage] = useState(() =>
    token ? null : { type: 'error', text: 'Invalid or missing reset token. Please request a new password reset.' }
  );
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!token) return;

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (!allPasswordRulesMet) {
      setMessage({ type: 'error', text: 'Password does not meet all requirements' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setMessage({ type: 'success', text: data.message });
        setTimeout(() => router.push('/login'), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to reset password' });
      }
    } catch (err) {
      clientLogger.error('Reset password error:', err);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-4">{success ? '✅' : '🔒'}</div>
          <h1 className="text-2xl font-bold">{success ? 'Password Reset!' : 'Reset Password'}</h1>
          <p className="text-muted-foreground mt-2">
            {success ? 'Redirecting to sign in...' : 'Enter your new password below.'}
          </p>
        </div>

        <Card className="p-6 md:p-8">
          {success ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
              <p className="text-success font-semibold">Password changed successfully!</p>
              <Link href="/login">
                <Button variant="brand" className="w-full">
                  Sign In Now
                </Button>
              </Link>
            </div>
          ) : !token ? (
            <div className="text-center space-y-4">
              <XCircle className="h-12 w-12 text-destructive mx-auto" />
              <p className="text-destructive font-semibold">Invalid reset link</p>
              <Link href="/forgot-password">
                <Button variant="outline" className="w-full">
                  Request New Link
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    className="pl-10"
                    required
                    minLength={8}
                    aria-label="New password"
                    autoFocus
                  />
                </div>
                {newPassword && (!allPasswordRulesMet || passwordFocused) && (
                  <div className="space-y-1 pt-1">
                    {passwordRules.map((rule) => (
                      <div
                        key={rule.label}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${rule.met ? 'text-emerald-500' : 'text-muted-foreground'}`}
                      >
                        {rule.met ? <Check className="h-3 w-3 shrink-0" /> : <X className="h-3 w-3 shrink-0" />}
                        <span>{rule.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={8}
                    aria-label="Confirm new password"
                  />
                </div>
              </div>

              {message && (
                <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                  <AlertDescription className={message.type === 'success' ? 'text-success' : ''}>
                    {message.text}
                  </AlertDescription>
                </Alert>
              )}

              <Button type="submit" disabled={loading || !newPassword || !confirmPassword} className="w-full">
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          )}
        </Card>

        <div className="text-center">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p>Loading...</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
