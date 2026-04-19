import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import ExamSession from '@/models/ExamSession';
import logger from '@/lib/logger';

// GET — Get active/paused sessions or a specific session
export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');

    if (sessionId) {
      const examSession = await ExamSession.findOne({
        _id: sessionId,
        userId: session.user.email,
      }).lean();
      if (!examSession) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      return NextResponse.json({ session: examSession });
    }

    // Get active sessions (in_progress or paused)
    const activeSessions = await ExamSession.find({
      userId: session.user.email,
      status: { $in: ['in_progress', 'paused'] },
    })
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({ sessions: activeSessions });
  } catch (error) {
    logger.error({ err: error }, 'ExamSession GET error');
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

// POST — Create a new exam session
export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { examData, timeRemaining } = await request.json();

    if (!examData) {
      return NextResponse.json({ error: 'Exam data is required' }, { status: 400 });
    }

    const examSession = await ExamSession.create({
      userId: session.user.email,
      examData,
      timeRemaining: timeRemaining || (examData.duration || 60) * 60,
      status: 'in_progress',
    });

    return NextResponse.json(
      {
        session: examSession,
        message: 'Exam session created',
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error({ err: error }, 'ExamSession POST error');
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

// PATCH — Update an existing session (save progress, pause, complete)
export async function PATCH(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { sessionId, answers, markedForReview, currentSection, currentQuestion, timeRemaining, status } =
      await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const examSession = await ExamSession.findOne({
      _id: sessionId,
      userId: session.user.email,
    });

    if (!examSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Update fields if provided
    if (answers !== undefined) examSession.answers = answers;
    if (markedForReview !== undefined) examSession.markedForReview = markedForReview;
    if (currentSection !== undefined) examSession.currentSection = currentSection;
    if (currentQuestion !== undefined) examSession.currentQuestion = currentQuestion;
    if (timeRemaining !== undefined) examSession.timeRemaining = timeRemaining;

    if (status) {
      examSession.status = status;
      if (status === 'paused') {
        examSession.pausedAt = new Date();
      } else if (status === 'completed') {
        examSession.completedAt = new Date();
      } else if (status === 'in_progress' && examSession.pausedAt) {
        // Resuming from pause — track pause duration
        const pauseDuration = Math.floor((Date.now() - examSession.pausedAt.getTime()) / 1000);
        examSession.totalPauseDuration += pauseDuration;
        examSession.pausedAt = null;
      }
    }

    await examSession.save();
    return NextResponse.json({ session: examSession, message: 'Session updated' });
  } catch (error) {
    logger.error({ err: error }, 'ExamSession PATCH error');
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}
