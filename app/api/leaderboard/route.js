import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/services/gamificationService';
import { cacheWrap, CACHE_KEYS, CACHE_TTL } from '@/lib/services/redisCacheService';
import { apiRoute } from '@/lib/apiHandler';

export const GET = apiRoute(
  {
    errorMessage: 'Failed to fetch leaderboard',
  },
  async (request) => {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const leaderboard = await cacheWrap(
      `${CACHE_KEYS.LEADERBOARD}${page}`,
      () => getLeaderboard(page, Math.min(limit, 50)),
      CACHE_TTL.LONG
    );

    return NextResponse.json(leaderboard, {
      headers: { 'Cache-Control': 'public, max-age=900, stale-while-revalidate=300' },
    });
  }
);
