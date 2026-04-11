import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/services/gamificationService';
import { cacheWrap, CACHE_KEYS } from '@/lib/services/cacheService';

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

        return NextResponse.json(leaderboard);
    } catch (error) {
        console.error('Leaderboard GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }
}
