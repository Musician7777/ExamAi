import { NextResponse } from 'next/server';
import User from '@/models/User';
import { cacheDelete } from '@/lib/services/redisCacheService';
import { apiRoute } from '@/lib/apiHandler';
import logger from '@/lib/logger';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB raw file limit
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const POST = apiRoute(
  {
    requireAuth: true,
    requireCsrf: true,
    connectDB: true,
    formData: true,
    errorMessage: 'Failed to upload avatar',
  },
  async (request, { session }) => {
    const formData = await request.formData();
    const file = formData.get('avatar');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 2MB.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Build data URI
    const base64 = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;

    // Validate final data URI length (should be under ~3MB in MongoDB)
    if (dataUri.length > 3 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image too large after encoding. Please use a smaller image.' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    user.image = dataUri;
    await user.save();

    // Invalidate caches
    await cacheDelete(`user:${session.user.email}`);
    await cacheDelete(`dashboard:${session.user.email}`);
    await cacheDelete(`gamification:${session.user.email}`);

    logger.info({ email: session.user.email }, 'Avatar updated');

    return NextResponse.json({
      image: dataUri,
      message: 'Avatar updated successfully',
    });
  }
);
