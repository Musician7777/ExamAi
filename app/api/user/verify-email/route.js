import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EmailVerification from '@/models/EmailVerification';
import User from '@/models/User';
import UserProfile from '@/models/UserProfile';
import Activity from '@/models/Activity';
import ExamSession from '@/models/ExamSession';
import StudyPlan from '@/models/StudyPlan';
import SharedPreset from '@/models/SharedPreset';
import SharedResult from '@/models/SharedResult';
import AnalyticsEvent from '@/models/AnalyticsEvent';
import PasswordReset from '@/models/PasswordReset';
import { cacheDelete } from '@/lib/services/redisCacheService';
import logger from '@/lib/logger';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=invalid-token', request.url));
    }

    await connectDB();

    // Atomically claim the token to prevent race conditions
    const verification = await EmailVerification.findOneAndUpdate(
      { token, used: false, expiresAt: { $gt: new Date() } },
      { $set: { used: true } },
      { new: true }
    );

    if (!verification) {
      return NextResponse.redirect(new URL('/login?error=expired-token', request.url));
    }

    // Handle registration verification — just mark email as verified
    if (verification.type === 'registration') {
      const user = await User.findOne({ email: verification.userId });
      if (!user) {
        return NextResponse.redirect(new URL('/login?error=user-not-found', request.url));
      }

      user.emailVerified = true;
      await user.save();

      // Invalidate caches
      await cacheDelete(`user:${user.email}`);
      await cacheDelete(`dashboard:${user.email}`);
      await cacheDelete(`gamification:${user.email}`);

      logger.info({ email: user.email }, 'Email verified (registration)');

      return NextResponse.redirect(new URL('/login?verified=1', request.url));
    }

    // Handle email change verification
    // Double-check new email isn't taken (race condition guard)
    const existingUser = await User.findOne({ email: verification.newEmail });
    if (existingUser) {
      return NextResponse.redirect(new URL('/dashboard/profile?error=email-taken', request.url));
    }

    // Update the user's email
    const user = await User.findOne({ email: verification.currentEmail });
    if (!user) {
      return NextResponse.redirect(new URL('/login?error=user-not-found', request.url));
    }

    const oldEmail = user.email;
    user.email = verification.newEmail;
    await user.save();

    // Migrate related data to new email
    const newEmail = verification.newEmail;
    await Promise.all([
      UserProfile.updateOne({ userId: oldEmail }, { $set: { userId: newEmail } }),
      Activity.updateMany({ userId: oldEmail }, { $set: { userId: newEmail } }),
      EmailVerification.updateMany({ userId: oldEmail }, { $set: { userId: newEmail } }),
      ExamSession.updateMany({ userId: oldEmail }, { $set: { userId: newEmail } }),
      StudyPlan.updateMany({ userId: oldEmail }, { $set: { userId: newEmail } }),
      SharedPreset.updateMany({ creatorId: oldEmail }, { $set: { creatorId: newEmail } }),
      SharedResult.updateMany({ creatorId: oldEmail }, { $set: { creatorId: newEmail } }),
      AnalyticsEvent.updateMany({ userId: oldEmail }, { $set: { userId: newEmail } }),
      PasswordReset.updateMany({ email: oldEmail }, { $set: { email: newEmail } }),
    ]);

    // Invalidate caches for both old and new emails
    await cacheDelete(`user:${oldEmail}`);
    await cacheDelete(`dashboard:${oldEmail}`);
    await cacheDelete(`gamification:${oldEmail}`);
    await cacheDelete(`user:${newEmail}`);
    await cacheDelete(`dashboard:${newEmail}`);
    await cacheDelete(`gamification:${newEmail}`);

    logger.info({ oldEmail, newEmail }, 'Email changed successfully');

    // Redirect to profile with success message
    return NextResponse.redirect(new URL('/dashboard/profile?emailChanged=1', request.url));
  } catch (error) {
    logger.error({ err: error }, 'Verify email error');
    return NextResponse.redirect(new URL('/login?error=verification-failed', request.url));
  }
}
