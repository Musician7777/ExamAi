import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import SharedPreset from '@/models/SharedPreset';
import { v4 as uuidv4 } from 'uuid';

// GET — Get a preset by short code
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Short code is required' }, { status: 400 });
    }

    await connectDB();
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
  } catch (error) {
    console.error('Presets GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch preset' }, { status: 500 });
  }
}

// POST — Share a preset (create a short code)
export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { presetType, config, title, description, emoji } = await request.json();

    if (!presetType || !config || !title) {
      return NextResponse.json({ error: 'presetType, config, and title are required' }, { status: 400 });
    }

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
  } catch (error) {
    console.error('Presets POST error:', error);
    return NextResponse.json({ error: 'Failed to share preset' }, { status: 500 });
  }
}
