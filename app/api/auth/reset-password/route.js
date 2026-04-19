import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import PasswordReset from '@/models/PasswordReset';
import logger from '@/lib/logger';

export async function POST(request) {
  try {
    await connectDB();
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Find valid token
    const resetRecord = await PasswordReset.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!resetRecord) {
      return NextResponse.json({ error: 'Invalid or expired reset token. Please request a new one.' }, { status: 400 });
    }

    // Find user
    const user = await User.findOne({ email: resetRecord.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update password
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    // Mark token as used
    resetRecord.used = true;
    await resetRecord.save();

    return NextResponse.json({
      message: 'Password reset successfully. You can now sign in with your new password.',
    });
  } catch (error) {
    logger.error({ err: error }, 'Reset password error');
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
