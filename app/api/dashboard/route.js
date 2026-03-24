import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Activity from '@/models/Activity';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const userId = session.user.email;

    // Get all activities for this user
    const activities = await Activity.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    // Calculate stats
    const totalActivities = activities.length;
    const scores = activities.filter(a => a.totalMarks > 0).map(a => (a.score / a.totalMarks) * 100);
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
      : 0;

    // Recent activities (last 5)
    const recentActivities = activities.slice(0, 5).map(a => ({
      title: a.title,
      type: a.type,
      score: a.totalMarks > 0 ? `${Math.round((a.score / a.totalMarks) * 100)}%` : '—',
      total: `${a.score}/${a.totalMarks}`,
      date: getRelativeTime(a.createdAt),
    }));

    // Count by type
    const examCount = activities.filter(a => a.type === 'exam').length;
    const codingCount = activities.filter(a => a.type === 'coding').length;
    const interviewCount = activities.filter(a => a.type === 'interview').length;

    return NextResponse.json({
      stats: {
        totalActivities,
        avgScore,
        examCount,
        codingCount,
        interviewCount,
      },
      recentActivities,
    });
  } catch (error) {
    console.error('Dashboard GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}

function getRelativeTime(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}
