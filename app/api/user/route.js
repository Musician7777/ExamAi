import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import UserProfile from '@/models/UserProfile';
import Activity from '@/models/Activity';
import EmailVerification from '@/models/EmailVerification';
import { cacheWrap, cacheDelete } from '@/lib/services/cacheService';
import { sendEmail } from '@/lib/services/emailService';
import logger from '@/lib/logger';
import { sanitizePromptInput } from '@/lib/sanitize';

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const APP_NAME = 'ExamAI';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cacheKey = `user:${session.user.email}`;
    const data = await cacheWrap(
      cacheKey,
      async () => {
        await connectDB();
        const user = await User.findOne({ email: session.user.email })
          .select('name email image authProvider createdAt')
          .lean();
        if (!user) return null;
        return { user };
      },
      60_000
    );

    if (!data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=30' },
    });
  } catch (error) {
    logger.error({ err: error }, 'User GET error');
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { name, image, currentPassword, newPassword, newEmail } = body;

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
      if (newPassword.length < 8) {
        return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
      }
      user.password = await bcrypt.hash(newPassword, 12);
    }

    // Request email change — sends verification to new email
    if (newEmail && newEmail !== user.email) {
      const sanitizedEmail = sanitizePromptInput(newEmail.trim().toLowerCase(), 254);
      if (!sanitizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
        return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
      }
      // Check if new email is already taken
      const existing = await User.findOne({ email: sanitizedEmail });
      if (existing) {
        return NextResponse.json({ error: 'This email is already in use by another account' }, { status: 409 });
      }

      const token = crypto.randomBytes(32).toString('hex');
      await EmailVerification.create({
        userId: user.email,
        currentEmail: user.email,
        newEmail: sanitizedEmail,
        token,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
      });

      const verifyUrl = `${BASE_URL}/api/user/verify-email?token=${token}`;

      // HTML-encode values to prevent XSS in email templates
      const escHtml = (s) =>
        s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      const safeEmail = escHtml(sanitizedEmail);
      const safeApp = escHtml(APP_NAME);

      // Send verification email to the NEW address
      const emailResult = await sendEmail({
        to: sanitizedEmail,
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

      // Don't save the user email yet — it changes only after verification
      await user.save();

      const msg = emailResult.sent
        ? 'Verification email sent to your new address. Please check your inbox.'
        : 'Email change requested. In development mode — check server logs for the verification link.';

      return NextResponse.json({
        emailChangeRequested: true,
        newEmail: sanitizedEmail,
        message: msg,
        ...(process.env.NODE_ENV === 'development' && !emailResult.sent ? { verifyUrl } : {}),
      });
    }

    await user.save();

    // Invalidate caches after mutation
    cacheDelete(`user:${session.user.email}`);
    cacheDelete(`dashboard:${session.user.email}`);
    cacheDelete(`gamification:${session.user.email}`);

    return NextResponse.json({
      user: { name: user.name, email: user.email, image: user.image, authProvider: user.authProvider },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    logger.error({ err: error }, 'User PATCH error');
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { password } = await request.json();

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
    ]);

    // Invalidate all caches
    cacheDelete(`user:${email}`);
    cacheDelete(`dashboard:${email}`);
    cacheDelete(`gamification:${email}`);

    logger.info({ email }, 'Account deleted');

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error) {
    logger.error({ err: error }, 'User DELETE error');
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
