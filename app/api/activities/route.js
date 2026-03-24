import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Activity from '@/models/Activity';

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query = { userId: session.user.email };
    if (type) query.type = type;

    const activities = await Activity.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Activities GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { type, title, score, totalMarks, details } = await request.json();

    if (!type || !title) {
      return NextResponse.json({ error: 'Type and title are required' }, { status: 400 });
    }

    const activity = await Activity.create({
      userId: session.user.email,
      type,
      title,
      score: score || 0,
      totalMarks: totalMarks || 100,
      details: details || {},
    });

    return NextResponse.json({ activity, message: 'Activity saved' }, { status: 201 });
  } catch (error) {
    console.error('Activities POST error:', error);
    return NextResponse.json({ error: 'Failed to save activity' }, { status: 500 });
  }
}
