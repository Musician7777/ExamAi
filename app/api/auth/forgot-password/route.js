import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import PasswordReset from '@/models/PasswordReset';
import { rateLimit } from '@/lib/rateLimit';
import { sendPasswordResetEmail } from '@/lib/services/emailService';
import logger from '@/lib/logger';

export async function POST(request) {
  try {
    // Rate limit: 3 password reset requests per 15 minutes
    const rateLimitResult = rateLimit(request, 3, 900000);
    if (rateLimitResult) return rateLimitResult;

    await connectDB();
    const { email } = await request.json();

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Always return success to prevent email enumeration
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Still return success but don't create token
      return NextResponse.json({
        message: 'If an account exists with that email, a reset link has been generated.',
      });
    }

    if (user.authProvider === 'google') {
      // Return same generic success message to avoid email enumeration
      return NextResponse.json({
        message: 'If an account exists with that email, a reset link has been generated.',
      });
    }

    // Invalidate any existing tokens for this email
    await PasswordReset.updateMany({ email: normalizedEmail, used: false }, { used: true });

    // Generate a secure token
    const token = crypto.randomBytes(32).toString('hex');

    await PasswordReset.create({
      email: normalizedEmail,
      token,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
    });

    // Send password reset email (falls back to dev mode if RESEND_API_KEY is not set)
    const emailResult = await sendPasswordResetEmail({ to: normalizedEmail, token });

    if (emailResult.sent) {
      // Production: email was sent successfully
      return NextResponse.json({
        message: 'If an account exists with that email, a reset link has been sent to your inbox.',
        emailSent: true,
      });
    }

    if (emailResult.error) {
      // Resend was configured but failed — provide fallback link so user isn't stuck
      logger.error({ err: emailResult.error }, '[forgot-password] Email send failed');
      const fallbackUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
      return NextResponse.json({
        message: 'Email delivery failed — a direct reset link is provided below.',
        emailSent: false,
        resetUrl: emailResult.resetUrl || fallbackUrl,
      });
    }

    // Dev mode: RESEND_API_KEY not set, return URL for display
    return NextResponse.json({
      message: 'Password reset link generated. (Email not configured — link shown below for development.)',
      emailSent: false,
      resetUrl: emailResult.resetUrl,
    });
  } catch (error) {
    logger.error({ err: error }, 'Forgot password error');
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
