'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, ArrowLeft, CheckCircle2, Copy } from 'lucide-react';
import clientLogger from '@/lib/client-logger';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [resetUrl, setResetUrl] = useState(null);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setMessage(null);
    setResetUrl(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        setEmailSent(data.emailSent || false);
        if (data.resetUrl) {
          setResetUrl(data.resetUrl);
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Something went wrong' });
      }
    } catch (err) {
      clientLogger.error('Forgot password error:', err);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-4">🔑</div>
          <h1 className="text-2xl font-bold">Forgot Password?</h1>
          <p className="text-muted-foreground mt-2">No worries, we&apos;ll help you reset it.</p>
        </div>

        <Card className="p-6 md:p-8">
          {message?.type === 'success' ? (
            <div className="space-y-4">
              {emailSent ? (
                <>
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">Check your email!</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We&apos;ve sent a password reset link to <strong>{email}</strong>. Click the link in the email to
                    set a new password. The link expires in 1 hour.
                  </p>
                  <div className="p-3 rounded-lg bg-secondary/50 border text-xs text-muted-foreground">
                    💡 Didn&apos;t receive the email? Check your spam folder or{' '}
                    <button
                      type="button"
                      className="text-indigo-400 hover:text-indigo-300 underline"
                      onClick={() => {
                        setMessage(null);
                        setEmailSent(false);
                        setResetUrl(null);
                      }}
                    >
                      try again
                    </button>{' '}
                    with a different email.
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">Reset link generated!</span>
                  </div>

                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
                    {message.text.includes('Email delivery failed')
                      ? `⚠️ Resend Error: ${message.text} Are you using onboarding@resend.dev? You can only send to your registered email address.`
                      : '⚠️ Dev mode: Email sending is not configured (RESEND_API_KEY not set). Use the link below:'}
                  </div>
                  {resetUrl && (
                    <div className="p-3 rounded-lg bg-secondary/50 border text-xs font-mono break-all">{resetUrl}</div>
                  )}
                  {resetUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 w-full"
                      onClick={() => navigator.clipboard.writeText(resetUrl)}
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy Reset Link
                    </Button>
                  )}
                </>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    aria-label="Email address for password reset"
                    autoFocus
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

              <Button type="submit" disabled={loading || !email.trim()} className="w-full">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          )}
        </Card>

        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
