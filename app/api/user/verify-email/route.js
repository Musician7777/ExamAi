import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EmailVerification from '@/models/EmailVerification';
import User from '@/models/User';
import UserProfile from '@/models/UserProfile';
import Activity from '@/models/Activity';
import { cacheDelete } from '@/lib/services/cacheService';
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
    await Promise.all([
      UserProfile.updateOne({ userId: oldEmail }, { $set: { userId: verification.newEmail } }),
      Activity.updateMany({ userId: oldEmail }, { $set: { userId: verification.newEmail } }),
      EmailVerification.updateMany({ userId: oldEmail }, { $set: { userId: verification.newEmail } }),
    ]);

    // Invalidate caches for both old and new emails
    cacheDelete(`user:${oldEmail}`);
    cacheDelete(`dashboard:${oldEmail}`);
    cacheDelete(`gamification:${oldEmail}`);
    cacheDelete(`user:${verification.newEmail}`);
    cacheDelete(`dashboard:${verification.newEmail}`);
    cacheDelete(`gamification:${verification.newEmail}`);

    logger.info({ oldEmail, newEmail: verification.newEmail }, 'Email changed successfully');

    // Redirect to profile with success message
    return NextResponse.redirect(new URL('/dashboard/profile?emailChanged=1', request.url));
  } catch (error) {
    logger.error({ err: error }, 'Verify email error');
    return NextResponse.redirect(new URL('/login?error=verification-failed', request.url));
  }
}
