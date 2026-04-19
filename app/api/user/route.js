import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { cacheWrap, cacheDelete } from '@/lib/services/cacheService';
import logger from '@/lib/logger';

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
    const { name, image, currentPassword, newPassword } = body;

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update name
    if (name && name.trim() !== user.name) {
      user.name = name.trim();
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
