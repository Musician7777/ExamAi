import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/services/gamificationService';
import { cacheWrap, CACHE_KEYS, CACHE_TTL } from '@/lib/services/redisCacheService';
import logger from '@/lib/logger';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Cache leaderboard for 15 minutes using Redis (with in-memory fallback)
    const leaderboard = await cacheWrap(
      `${CACHE_KEYS.LEADERBOARD}${page}`,
      () => getLeaderboard(page, Math.min(limit, 50)),
      CACHE_TTL.LONG // 15 minutes
    );

    return NextResponse.json(leaderboard, {
      headers: { 
        'Cache-Control': 'public, max-age=900, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Leaderboard GET error');
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
