import { NextResponse } from 'next/server';
import ExamSession from '@/models/ExamSession';
import { apiRoute } from '@/lib/apiHandler';
import { examSessionCreateSchema, examSessionUpdateSchema } from '@/lib/validation';

// GET — Get active/paused sessions or a specific session
export const GET = apiRoute(
  {
    requireAuth: true,
    connectDB: true,
    errorMessage: 'Failed to fetch sessions',
  },
  async (request, { session }) => {
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
  }
);

// POST — Create a new exam session
export const POST = apiRoute(
  {
    requireAuth: true,
    requireCsrf: true,
    schema: examSessionCreateSchema,
    connectDB: true,
    errorMessage: 'Failed to create session',
  },
  async (request, { session, body }) => {
    const { examData, timeRemaining } = body;

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
  }
);

// PATCH — Update an existing session (save progress, pause, complete)
export const PATCH = apiRoute(
  {
    requireAuth: true,
    requireCsrf: true,
    schema: examSessionUpdateSchema,
    connectDB: true,
    errorMessage: 'Failed to update session',
  },
  async (request, { session, body }) => {
    const { sessionId, answers, markedForReview, currentSection, currentQuestion, timeRemaining, status } = body;

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
  }
);
