import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { cacheDelete } from '@/lib/services/cacheService';
import logger from '@/lib/logger';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB raw file limit
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_DIMENSION = 256; // Resize to max 256x256

/**
 * Resize an image buffer to fit within MAX_DIMENSION using sharp-less approach.
 * Since sharp may not be installed, we just validate and store the raw base64.
 * Client-side resizing handles the actual downscaling.
 */
export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    user.image = dataUri;
    await user.save();

    // Invalidate caches
    cacheDelete(`user:${session.user.email}`);
    cacheDelete(`dashboard:${session.user.email}`);
    cacheDelete(`gamification:${session.user.email}`);

    logger.info({ email: session.user.email }, 'Avatar updated');

    return NextResponse.json({
      image: dataUri,
      message: 'Avatar updated successfully',
    });
  } catch (error) {
    logger.error({ err: error }, 'Avatar upload error');
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
  }
}
