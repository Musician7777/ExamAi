import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import SharedResult from '@/models/SharedResult';
import { v4 as uuidv4 } from 'uuid';

// GET — Fetch a shared result by short code
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Short code is required' }, { status: 400 });
    }

    await connectDB();
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
  } catch (error) {
    console.error('Share GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch shared result' }, { status: 500 });
  }
}

// POST — Create a shared result link
export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { type, title, data } = await request.json();

    if (!type || !title || !data) {
      return NextResponse.json({ error: 'Type, title, and data are required' }, { status: 400 });
    }

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
  } catch (error) {
    console.error('Share POST error:', error);
    return NextResponse.json({ error: 'Failed to share result' }, { status: 500 });
  }
}
