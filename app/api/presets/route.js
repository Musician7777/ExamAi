import { NextResponse } from 'next/server';
import SharedPreset from '@/models/SharedPreset';
import { v4 as uuidv4 } from 'uuid';
import { apiRoute } from '@/lib/apiHandler';
import { sharePresetSchema } from '@/lib/validation';

// GET — Get a preset by short code (public, no auth)
export const GET = apiRoute(
  {
    connectDB: true,
    errorMessage: 'Failed to fetch preset',
  },
  async (request) => {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Short code is required' }, { status: 400 });
    }

    const preset = await SharedPreset.findOne({ shortCode: code });

    if (!preset) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 });
    }

    // Increment use count
    preset.useCount += 1;
    await preset.save();

    return NextResponse.json({
      preset: {
        title: preset.title,
        description: preset.description,
        emoji: preset.emoji,
        presetType: preset.presetType,
        config: preset.config,
        useCount: preset.useCount,
        createdAt: preset.createdAt,
      },
    });
  }
);

// POST — Share a preset (create a short code)
export const POST = apiRoute(
  {
    requireAuth: true,
    requireCsrf: true,
    schema: sharePresetSchema,
    connectDB: true,
    errorMessage: 'Failed to share preset',
  },
  async (request, { session, body }) => {
    const { presetType, config, title, description, emoji } = body;

    const shortCode = uuidv4().substring(0, 8);

    const preset = await SharedPreset.create({
      shortCode,
      creatorId: session.user.email,
      presetType,
      config,
      title,
      description: description || '',
      emoji: emoji || '📄',
    });

    const shareUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/preset/${shortCode}`;

    return NextResponse.json(
      {
        shortCode: preset.shortCode,
        shareUrl,
        message: 'Preset shared successfully',
      },
      { status: 201 }
    );
  }
);
