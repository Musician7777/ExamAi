import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import EmailVerification from '@/models/EmailVerification';
import { rateLimit } from '@/lib/services/rateLimitService';
import { sendRegistrationVerificationEmail } from '@/lib/services/emailService';
import { resendVerificationSchema, validateRequest } from '@/lib/validation';
import logger from '@/lib/logger';

export async function POST(request) {
  try {
    // Rate limit: 3 resend requests per 15 minutes per IP
    const rateLimitResult = await rateLimit(request, 3, 900000);
    if (rateLimitResult) return rateLimitResult;

    const body = await request.json();

    const validation = validateRequest(resendVerificationSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { email } = validation.data;

    await connectDB();

    const user = await User.findOne({ email });
    if (!user) {
      // Return same generic message to prevent email enumeration
      return NextResponse.json({
        message: 'If an unverified account exists with that email, a new verification link has been sent.',
      });
    }

    // Only resend for unverified credentials users
    if (user.emailVerified || user.authProvider !== 'credentials') {
      return NextResponse.json({
        message: 'If an unverified account exists with that email, a new verification link has been sent.',
      });
    }

    // Invalidate any previous registration verification tokens
    await EmailVerification.updateMany({ userId: email, type: 'registration', used: false }, { $set: { used: true } });

    // Generate a new verification token
    const token = crypto.randomBytes(32).toString('hex');
    await EmailVerification.create({
      userId: email,
      type: 'registration',
      currentEmail: email,
      newEmail: email,
      token,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
    });

    // Send verification email
    const emailResult = await sendRegistrationVerificationEmail({ to: email, token });

    if (emailResult.sent) {
      return NextResponse.json({
        message: 'Verification email sent! Please check your inbox.',
        verificationSent: true,
      });
    }

    // Email failed
    return NextResponse.json({
      message: 'Could not send verification email. Please try again later.',
      verificationSent: false,
      ...(process.env.NODE_ENV === 'development' && emailResult.verifyUrl ? { verifyUrl: emailResult.verifyUrl } : {}),
    });
  } catch (error) {
    logger.error({ err: error }, 'Resend verification error');
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
