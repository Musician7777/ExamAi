import { NextResponse } from 'next/server';
import Activity from '@/models/Activity';
import { cacheWrap } from '@/lib/services/redisCacheService';
import { apiRoute } from '@/lib/apiHandler';

export const GET = apiRoute(
  {
    requireAuth: true,
    connectDB: true,
    errorMessage: 'Failed to fetch dashboard',
  },
  async (request, { session }) => {
    const cacheKey = `dashboard:${session.user.email}`;
    const data = await cacheWrap(
      cacheKey,
      async () => {
        const [totalActivities, examCount, interviewCount, codingCount, avgScore, recentActivities] = await Promise.all(
          [
            Activity.countDocuments({ userId: session.user.email }),
            Activity.countDocuments({ userId: session.user.email, type: 'exam' }),
            Activity.countDocuments({ userId: session.user.email, type: 'interview' }),
            Activity.countDocuments({ userId: session.user.email, type: 'coding' }),
            Activity.aggregate([
              { $match: { userId: session.user.email } },
              { $group: { _id: null, avg: { $avg: { $multiply: [{ $divide: ['$score', '$totalMarks'] }, 100] } } } },
            ]),
            Activity.find({ userId: session.user.email }).sort({ createdAt: -1 }).limit(5).lean(),
          ]
        );

        return {
          stats: {
            totalActivities,
            examCount,
            interviewCount,
            codingCount,
            avgScore: Math.round(avgScore[0]?.avg || 0),
          },
          recentActivities,
        };
      },
      60 // 60 seconds
    );

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=30' },
    });
  }
);
