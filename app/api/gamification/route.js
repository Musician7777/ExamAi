import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getUserProfile, awardXP, BADGES } from '@/lib/services/gamificationService';
import { cacheWrap, cacheDelete } from '@/lib/services/cacheService';
import logger from '@/lib/logger';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cacheKey = `gamification:${session.user.email}`;
    const data = await cacheWrap(
      cacheKey,
      async () => {
        const profile = await getUserProfile(session.user.email);
        return { profile, allBadges: BADGES };
      },
      60_000
    ); // 60s server cache

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=30' },
    });
  } catch (error) {
    logger.error({ err: error }, 'Gamification GET error');
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { activityType, score, totalMarks } = await request.json();

    if (!activityType) {
      return NextResponse.json({ error: 'Activity type is required' }, { status: 400 });
    }

    const result = await awardXP(session.user.email, activityType, {
      score: score || 0,
      totalMarks: totalMarks || 100,
    });

    // Invalidate caches after mutation
    cacheDelete(`gamification:${session.user.email}`);
    cacheDelete(`dashboard:${session.user.email}`);

    return NextResponse.json(result);
  } catch (error) {
    logger.error({ err: error }, 'Gamification POST error');
    return NextResponse.json({ error: 'Failed to award XP' }, { status: 500 });
  }
}
