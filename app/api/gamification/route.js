import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getUserProfile, awardXP, BADGES } from '@/lib/services/gamificationService';

export async function GET() {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const profile = await getUserProfile(session.user.email);
        return NextResponse.json({ profile, allBadges: BADGES });
    } catch (error) {
        console.error('Gamification GET error:', error);
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

        const result = await awardXP(session.user.email, activityType, { score: score || 0, totalMarks: totalMarks || 100 });
        return NextResponse.json(result);
    } catch (error) {
        console.error('Gamification POST error:', error);
        return NextResponse.json({ error: 'Failed to award XP' }, { status: 500 });
    }
}
