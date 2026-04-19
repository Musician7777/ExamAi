import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/services/gamificationService';
import { cacheWrap, CACHE_KEYS } from '@/lib/services/cacheService';
import logger from '@/lib/logger';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Cache leaderboard for 2 minutes
    const leaderboard = await cacheWrap(
      CACHE_KEYS.leaderboard(page),
      () => getLeaderboard(page, Math.min(limit, 50)),
      120000
    );

    return NextResponse.json(leaderboard, {
      headers: { 'Cache-Control': 'public, max-age=120, stale-while-revalidate=60' },
    });
  } catch (error) {
    logger.error({ err: error }, 'Leaderboard GET error');
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
