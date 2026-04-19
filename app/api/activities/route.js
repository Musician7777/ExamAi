import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Activity from '@/models/Activity';
import { awardXP } from '@/lib/services/gamificationService';
import { rateLimit } from '@/lib/rateLimit';

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const minScore = searchParams.get('minScore');
    const maxScore = searchParams.get('maxScore');
    const difficulty = searchParams.get('difficulty');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const query = { userId: session.user.email };

    // Filters
    if (type) query.type = type;
    if (difficulty) query.difficulty = difficulty;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }
    if (minScore || maxScore) {
      query.score = {};
      if (minScore) query.score.$gte = parseInt(minScore);
      if (maxScore) query.score.$lte = parseInt(maxScore);
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [activities, total] = await Promise.all([
      Activity.find(query).sort(sort).skip(skip).limit(limit).lean(),
      Activity.countDocuments(query),
    ]);

    return NextResponse.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Activities GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Rate limit: 30 activity saves per minute
    const rateLimitResult = rateLimit(request, 30, 60000);
    if (rateLimitResult) return rateLimitResult;

    const { type, title, score, totalMarks, details, difficulty, duration, tags } = await request.json();

    if (!type || !title) {
      return NextResponse.json({ error: 'Type and title are required' }, { status: 400 });
    }

    const activity = await Activity.create({
      userId: session.user.email,
      type,
      title,
      score: score || 0,
      totalMarks: totalMarks || 100,
      details: details || {},
      difficulty: difficulty || null,
      duration: duration || null,
      tags: tags || [],
    });

    // Award XP automatically
    let xpResult = null;
    try {
      xpResult = await awardXP(session.user.email, type, {
        score: score || 0,
        totalMarks: totalMarks || 100,
      });
    } catch (xpError) {
      console.error('XP award failed (non-critical):', xpError);
    }

    return NextResponse.json(
      {
        activity,
        xp: xpResult,
        message: 'Activity saved',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Activities POST error:', error);
    return NextResponse.json({ error: 'Failed to save activity' }, { status: 500 });
  }
}
