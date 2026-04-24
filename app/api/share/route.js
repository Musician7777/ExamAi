import { NextResponse } from 'next/server';
import SharedResult from '@/models/SharedResult';
import { v4 as uuidv4 } from 'uuid';
import { apiRoute } from '@/lib/apiHandler';
import { shareResultSchema } from '@/lib/validation';

// GET — Fetch a shared result by short code (public, no auth)
export const GET = apiRoute(
  {
    connectDB: true,
    errorMessage: 'Failed to fetch shared result',
  },
  async (request) => {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Short code is required' }, { status: 400 });
    }

    const shared = await SharedResult.findOne({ shortCode: code });

    if (!shared) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    // Increment view count
    shared.viewCount += 1;
    await shared.save();

    return NextResponse.json({
      result: {
        resultType: shared.resultType,
        title: shared.title,
        data: shared.data,
        viewCount: shared.viewCount,
        createdAt: shared.createdAt,
      },
    });
  }
);

// POST — Create a shared result link
export const POST = apiRoute(
  {
    requireAuth: true,
    requireCsrf: true,
    schema: shareResultSchema,
    connectDB: true,
    errorMessage: 'Failed to share result',
  },
  async (request, { session, body }) => {
    const { type, title, data } = body;

    const shortCode = uuidv4().substring(0, 8);

    const shared = await SharedResult.create({
      shortCode,
      creatorId: session.user.email,
      resultType: type,
      title,
      data,
    });

    const shareUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/shared/${shortCode}`;

    return NextResponse.json(
      {
        shortCode: shared.shortCode,
        shareUrl,
        message: 'Result shared successfully',
      },
      { status: 201 }
    );
  }
);
