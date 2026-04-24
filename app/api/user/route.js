import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '@/models/User';
import UserProfile from '@/models/UserProfile';
import Activity from '@/models/Activity';
import EmailVerification from '@/models/EmailVerification';
import ExamSession from '@/models/ExamSession';
import StudyPlan from '@/models/StudyPlan';
import SharedPreset from '@/models/SharedPreset';
import SharedResult from '@/models/SharedResult';
import AnalyticsEvent from '@/models/AnalyticsEvent';
import PasswordReset from '@/models/PasswordReset';
import { cacheWrap, cacheDelete } from '@/lib/services/redisCacheService';
import { sendEmail } from '@/lib/services/emailService';
import { sanitizePromptInput } from '@/lib/sanitize';
import { apiRoute } from '@/lib/apiHandler';
import { userUpdateSchema, userDeleteSchema } from '@/lib/validation';
import logger from '@/lib/logger';

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const APP_NAME = 'ExamAI';

export const GET = apiRoute(
  {
    requireAuth: true,
    connectDB: true,
    errorMessage: 'Failed to fetch user',
  },
  async (request, { session }) => {
    const cacheKey = `user:${session.user.email}`;
    const data = await cacheWrap(
      cacheKey,
      async () => {
        const user = await User.findOne({ email: session.user.email })
          .select('name email image authProvider createdAt')
          .lean();
        const profile = await UserProfile.findOne({ userId: session.user.email }).select('showAds').lean();
        if (!user) return null;
        return { user: { ...user, showAds: profile?.showAds ?? true } };
      },
      60
    );

    if (!data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=30' },
    });
  }
);

export const PATCH = apiRoute(
  {
    requireAuth: true,
    requireCsrf: true,
    rateLimit: { max: 10, windowMs: 60000 },
    schema: userUpdateSchema,
    connectDB: true,
    errorMessage: 'Failed to update profile',
  },
  async (request, { session, body }) => {
    const { name, image, currentPassword, newPassword, newEmail, showAds } = body;

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update name
    if (name !== undefined && name.trim() !== user.name) {
      const sanitized = sanitizePromptInput(name.trim(), 100);
      if (!sanitized) {
        return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
      }
      user.name = sanitized;
    }

    // Update image
    if (image !== undefined) {
      user.image = image;
    }

    // Update showAds preference
    if (showAds !== undefined) {
      await UserProfile.updateOne({ userId: session.user.email }, { $set: { showAds: Boolean(showAds) } });
    }

    // Change password
    if (currentPassword && newPassword) {
      if (user.authProvider === 'google') {
        return NextResponse.json(
          { error: 'Google accounts cannot change password here. Use Google settings.' },
          { status: 400 }
        );
      }
      if (!user.password) {
        return NextResponse.json({ error: 'No password set for this account.' }, { status: 400 });
      }
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }
      user.password = await bcrypt.hash(newPassword, 12);
    }

    // Request email change — sends verification to new email
    if (newEmail && newEmail !== user.email) {
      // Prevent email change spam: reject if user already has a pending verification
      const pendingVerification = await EmailVerification.findOne({
        userId: user.email,
        used: false,
        expiresAt: { $gt: new Date() },
      });
      if (pendingVerification) {
        return NextResponse.json(
          { error: 'You already have a pending email change. Please check your inbox or wait for it to expire.' },
          { status: 409 }
        );
      }

      const existing = await User.findOne({ email: newEmail });
      if (existing) {
        return NextResponse.json({ error: 'This email is already in use by another account' }, { status: 409 });
      }

      const token = crypto.randomBytes(32).toString('hex');
      await EmailVerification.create({
        userId: user.email,
        currentEmail: user.email,
        newEmail,
        token,
        expiresAt: new Date(Date.now() + 3600000),
      });

      const verifyUrl = `${BASE_URL}/api/user/verify-email?token=${token}`;

      const escHtml = (s) =>
        s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      const safeEmail = escHtml(newEmail);
      const safeApp = escHtml(APP_NAME);

      const emailResult = await sendEmail({
        to: newEmail,
        subject: `${APP_NAME} — Verify your new email`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 0;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="font-size: 24px; font-weight: 700; margin: 0;">${safeApp}</h1>
              <p style="color: #6b7280; margin-top: 4px;">Email Change Verification</p>
            </div>
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px;">
              <p style="margin: 0 0 16px;">You requested to change your email to <strong>${safeEmail}</strong>.</p>
              <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px;">Click the button below to confirm this change. This link expires in 1 hour.</p>
              <a href="${verifyUrl}"
                 style="display: inline-block; background: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Verify Email
              </a>
              <p style="margin: 24px 0 0; font-size: 13px; color: #9ca3af;">
                If the button doesn't work, copy this link:<br/>
                <span style="word-break: break-all; color: #6366f1;">${verifyUrl}</span>
              </p>
            </div>
            <p style="text-align: center; font-size: 13px; color: #9ca3af; margin-top: 24px;">
              If you didn't request this change, you can safely ignore this email.<br/>
              Your email won't be changed until you click the link above.
            </p>
          </div>
        `,
      });

      await user.save();

      const msg = emailResult.sent
        ? 'Verification email sent to your new address. Please check your inbox.'
        : 'Email change requested. In development mode — check server logs for the verification link.';

      return NextResponse.json({
        emailChangeRequested: true,
        newEmail,
        message: msg,
        ...(process.env.NODE_ENV === 'development' && !emailResult.sent ? { verifyUrl } : {}),
      });
    }

    await user.save();

    // Invalidate caches after mutation
    await cacheDelete(`user:${session.user.email}`);
    await cacheDelete(`dashboard:${session.user.email}`);
    await cacheDelete(`gamification:${session.user.email}`);

    return NextResponse.json({
      user: { name: user.name, email: user.email, image: user.image, authProvider: user.authProvider },
      message: 'Profile updated successfully',
    });
  }
);

export const DELETE = apiRoute(
  {
    requireAuth: true,
    requireCsrf: true,
    schema: userDeleteSchema,
    connectDB: true,
    errorMessage: 'Failed to delete account',
  },
  async (request, { session, body }) => {
    const { password } = body;

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Require password confirmation for credentials users
    if (user.authProvider !== 'google') {
      if (!password) {
        return NextResponse.json({ error: 'Password confirmation is required' }, { status: 400 });
      }
      if (!user.password) {
        return NextResponse.json({ error: 'No password set for this account' }, { status: 400 });
      }
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return NextResponse.json({ error: 'Password is incorrect' }, { status: 400 });
      }
    }

    // Cascade delete all user data
    const email = session.user.email;
    await Promise.all([
      User.deleteOne({ email }),
      UserProfile.deleteOne({ userId: email }),
      Activity.deleteMany({ userId: email }),
      EmailVerification.deleteMany({ userId: email }),
      ExamSession.deleteMany({ userId: email }),
      StudyPlan.deleteMany({ userId: email }),
      SharedPreset.deleteMany({ creatorId: email }),
      SharedResult.deleteMany({ creatorId: email }),
      AnalyticsEvent.deleteMany({ userId: email }),
      PasswordReset.deleteMany({ email }),
    ]);

    // Invalidate all caches
    await cacheDelete(`user:${email}`);
    await cacheDelete(`dashboard:${email}`);
    await cacheDelete(`gamification:${email}`);

    logger.info({ email }, 'Account deleted');

    return NextResponse.json({ message: 'Account deleted successfully' });
  }
);
