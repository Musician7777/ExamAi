import { NextResponse } from 'next/server';
import Activity from '@/models/Activity';
import { awardXP } from '@/lib/services/gamificationService';
import { updateStudyPlanProgress } from '@/lib/studyPlanService';
import { cacheWrap, cacheDelete, cacheInvalidatePrefix } from '@/lib/services/redisCacheService';
import { apiRoute } from '@/lib/apiHandler';
import { activityCreateSchema } from '@/lib/validation';
import logger from '@/lib/logger';

export const GET = apiRoute(
  {
    requireAuth: true,
    connectDB: true,
    errorMessage: 'Failed to fetch activities',
  },
  async (request, { session }) => {
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

    // Build a stable cache key from query params
    const filterKey = JSON.stringify(query) + JSON.stringify(sort) + `${skip}-${limit}`;
    const cacheKey = `activities:${session.user.email}:${filterKey}`;

    const data = await cacheWrap(
      cacheKey,
      async () => {
        const [activities, total] = await Promise.all([
          Activity.find(query).sort(sort).skip(skip).limit(limit).lean(),
          Activity.countDocuments(query),
        ]);
        return {
          activities,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        };
      },
      30 // 30 seconds server cache
    );

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=15' },
    });
  }
);

export const POST = apiRoute(
  {
    requireAuth: true,
    requireCsrf: true,
    rateLimit: { max: 30, windowMs: 60000 },
    schema: activityCreateSchema,
    connectDB: true,
    errorMessage: 'Failed to save activity',
  },
  async (request, { session, body }) => {
    const { type, title, score, totalMarks, details, difficulty, duration, tags } = body;

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
      logger.warn({ err: xpError }, 'XP award failed (non-critical)');
    }

    // Update study plan progress automatically (non-blocking)
    updateStudyPlanProgress(session.user.email, {
      type,
      title,
      tags: tags || [],
      difficulty,
    }).catch((err) => logger.warn({ err }, 'Study plan update failed (non-critical)'));

    // Invalidate activity & dashboard caches for this user
    const email = session.user.email;
    await cacheInvalidatePrefix(`activities:${email}`);
    await cacheDelete(`dashboard:${email}`);
    await cacheDelete(`gamification:${email}`);

    return NextResponse.json(
      {
        activity,
        xp: xpResult,
        message: 'Activity saved',
      },
      { status: 201 }
    );
  }
);
