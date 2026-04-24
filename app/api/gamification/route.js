import { NextResponse } from 'next/server';
import { getUserProfile, awardXP, BADGES } from '@/lib/services/gamificationService';
import { cacheWrap, cacheDelete } from '@/lib/services/redisCacheService';
import { apiRoute } from '@/lib/apiHandler';
import { gamificationAwardSchema } from '@/lib/validation';

export const GET = apiRoute(
  {
    requireAuth: true,
    errorMessage: 'Failed to fetch profile',
  },
  async (request, { session }) => {
    const cacheKey = `gamification:${session.user.email}`;
    const data = await cacheWrap(
      cacheKey,
      async () => {
        const profile = await getUserProfile(session.user.email);
        return { profile, allBadges: BADGES };
      },
      60 // 60 seconds
    );

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=30' },
    });
  }
);

export const POST = apiRoute(
  {
    requireAuth: true,
    requireCsrf: true,
    schema: gamificationAwardSchema,
    errorMessage: 'Failed to award XP',
  },
  async (request, { session, body }) => {
    const { activityType, score, totalMarks } = body;

    const result = await awardXP(session.user.email, activityType, {
      score: score || 0,
      totalMarks: totalMarks || 100,
    });

    // Invalidate caches after mutation
    await cacheDelete(`gamification:${session.user.email}`);
    await cacheDelete(`dashboard:${session.user.email}`);

    return NextResponse.json(result);
  }
);
