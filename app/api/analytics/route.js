import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Activity from '@/models/Activity';
import ExamSession from '@/models/ExamSession';
import AnalyticsEvent from '@/models/AnalyticsEvent';
import logger from '@/lib/logger';

/**
 * GET /api/analytics
 * 
 * Returns comprehensive analytics data including:
 * - Funnel analysis (exam start → completion → review)
 * - Question-level performance metrics
 * - Cohort analysis for user retention
 * - Personalized recommendations
 */
export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const userId = session.user.email;

    // ── 1. Funnel Analysis ──────────────────────────────────────────────
    // Get exam session stats
    const sessionStats = await ExamSession.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgTimeRemaining: { $avg: '$timeRemaining' },
        },
      },
    ]);

    const funnelData = {
      started: sessionStats.find((s) => s._id === 'in_progress')?.count || 0,
      paused: sessionStats.find((s) => s._id === 'paused')?.count || 0,
      completed: sessionStats.find((s) => s._id === 'completed')?.count || 0,
      abandoned: sessionStats.find((s) => s._id === 'abandoned')?.count || 0,
    };

    // Calculate completion rate
    const totalStarted = Object.values(funnelData).reduce((a, b) => a + b, 0);
    const completionRate = totalStarted > 0 ? (funnelData.completed / totalStarted) * 100 : 0;
    const abandonRate = totalStarted > 0 ? (funnelData.abandoned / totalStarted) * 100 : 0;

    // Get activities to count reviews
    const reviewCount = await Activity.countDocuments({
      userId,
      type: 'exam',
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
    });

    funnelData.reviewed = reviewCount;
    funnelData.completionRate = Math.round(completionRate);
    funnelData.abandonRate = Math.round(abandonRate);
    funnelData.totalSessions = totalStarted;

    // ── 2. Question-Level Performance ───────────────────────────────────
    // Get question-level events for detailed performance
    const questionEvents = await AnalyticsEvent.find({
      userId,
      eventType: { $in: ['question_correct', 'question_incorrect'] },
    })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    // Calculate per-question-type stats
    const questionTypeStats = {
      MCQ: { correct: 0, total: 0, avgTime: 0 },
      MSQ: { correct: 0, total: 0, avgTime: 0 },
      NAT: { correct: 0, total: 0, avgTime: 0 },
      Descriptive: { correct: 0, total: 0, avgTime: 0 },
    };

    // Calculate per-difficulty stats
    const difficultyStats = {
      easy: { correct: 0, total: 0 },
      medium: { correct: 0, total: 0 },
      hard: { correct: 0, total: 0 },
    };

    // Topic-wise accuracy
    const topicStats = {};

    questionEvents.forEach((event) => {
      const qType = event.questionType || 'MCQ';
      if (questionTypeStats[qType]) {
        questionTypeStats[qType].total++;
        if (event.isCorrect) questionTypeStats[qType].correct++;
        if (event.timeSpent) {
          questionTypeStats[qType].avgTime =
            (questionTypeStats[qType].avgTime * (questionTypeStats[qType].total - 1) + event.timeSpent) /
            questionTypeStats[qType].total;
        }
      }

      const diff = event.difficulty;
      if (diff && difficultyStats[diff]) {
        difficultyStats[diff].total++;
        if (event.isCorrect) difficultyStats[diff].correct++;
      }

      const topic = event.topic;
      if (topic) {
        if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0, totalTime: 0 };
        topicStats[topic].total++;
        if (event.isCorrect) topicStats[topic].correct++;
        if (event.timeSpent) topicStats[topic].totalTime += event.timeSpent;
      }
    });

    // Calculate accuracy percentages
    const questionPerformance = Object.entries(questionTypeStats).map(([type, stats]) => ({
      type,
      accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      total: stats.total,
      avgTimeSeconds: Math.round(stats.avgTime || 0),
    }));

    const difficultyPerformance = Object.entries(difficultyStats).map(([diff, stats]) => ({
      difficulty: diff,
      accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      total: stats.total,
    }));

    const topicPerformance = Object.entries(topicStats)
      .map(([topic, stats]) => ({
        topic,
        accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        total: stats.total,
        avgTimeSeconds: stats.total > 0 ? Math.round(stats.totalTime / stats.total) : 0,
      }))
      .sort((a, b) => a.accuracy - b.accuracy); // Sort by weakest first

    // ── 3. Cohort Analysis ──────────────────────────────────────────────
    // Group users by their signup week and track retention
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const cohortData = await AnalyticsEvent.aggregate([
      {
        $match: {
          userId,
          eventType: { $in: ['daily_active', 'exam_start', 'exam_complete'] },
          createdAt: { $gte: fourWeeksAgo },
        },
      },
      {
        $group: {
          _id: {
            week: { $isoWeek: '$createdAt' },
            year: { $isoWeekYear: '$createdAt' },
          },
          activeDays: { $addToSet: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } },
          sessionsStarted: {
            $sum: { $cond: [{ $eq: ['$eventType', 'exam_start'] }, 1, 0] },
          },
          examsCompleted: {
            $sum: { $cond: [{ $eq: ['$eventType', 'exam_complete'] }, 1, 0] },
          },
          firstActivity: { $min: '$createdAt' },
          lastActivity: { $max: '$createdAt' },
        },
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
    ]);

    // Calculate weekly retention metrics
    const weeklyRetention = cohortData.map((week, idx) => ({
      week: `Week ${week._id.week}`,
      activeDaysCount: week.activeDays.length,
      sessionsStarted: week.sessionsStarted,
      examsCompleted: week.examsCompleted,
      completionRate: week.sessionsStarted > 0 ? Math.round((week.examsCompleted / week.sessionsStarted) * 100) : 0,
      weekOverWeekChange: idx > 0 ? week.activeDays.length - (cohortData[idx - 1]?.activeDays.length || 0) : 0,
    }));

    // ── 4. Personalized Recommendations ────────────────────────────────
    // Find topics where user is weak (accuracy < 50%)
    const weakTopics = topicPerformance.filter((t) => t.accuracy < 50 && t.total >= 3);
    // Find topics where user is strong (accuracy >= 75%)
    const strongTopics = topicPerformance.filter((t) => t.accuracy >= 75 && t.total >= 3);
    // Find question types to practice
    const questionTypesToPractice = questionPerformance.filter((q) => q.accuracy < 60 && q.total >= 5);

    const recommendations = {
      weakTopics: weakTopics.slice(0, 5).map((t) => t.topic),
      strongTopics: strongTopics.slice(0, 3).map((t) => t.topic),
      questionTypesToPractice: questionTypesToPractice.map((q) => q.type),
      tips: [],
    };

    if (weakTopics.length > 0) {
      recommendations.tips.push({
        icon: '📚',
        text: `Focus on improving: ${weakTopics[0].topic} (${weakTopics[0].accuracy}% accuracy)`,
      });
    }
    if (abandonRate > 30) {
      recommendations.tips.push({
        icon: '⏱️',
        text: 'Try shorter exam sessions to reduce abandonment',
      });
    }
    if (completionRate < 50 && funnelData.completed > 3) {
      recommendations.tips.push({
        icon: '🎯',
        text: 'Complete more exams to see better progress insights',
      });
    }
    if (questionTypesToPractice.length > 0) {
      recommendations.tips.push({
        icon: '✍️',
        text: `Practice ${questionTypesToPractice[0].type} questions - only ${questionTypesToPractice[0].accuracy}% accuracy`,
      });
    }

    // ── 5. Return Combined Analytics ────────────────────────────────────
    return NextResponse.json({
      funnel: funnelData,
      questionPerformance,
      difficultyPerformance,
      topicPerformance: topicPerformance.slice(0, 20), // Top 20 topics
      weeklyRetention,
      recommendations,
      // Time series for charts
      dailyActivity: await getDailyActivityData(userId),
      examProgress: await getExamProgressData(userId),
    });
  } catch (error) {
    logger.error({ err: error }, 'Analytics GET error');
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

/**
 * Helper: Get daily activity data for the last 30 days
 */
async function getDailyActivityData(userId) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const activities = await Activity.aggregate([
    {
      $match: {
        userId,
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        avgScore: { $avg: { $multiply: [{ $divide: ['$score', '$totalMarks'] }, 100] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return activities.map((a) => ({
    date: a._id,
    activities: a.count,
    avgScore: Math.round(a.avgScore || 0),
  }));
}

/**
 * Helper: Get exam progress data (avg time per question, completion rate over time)
 */
async function getExamProgressData(userId) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const examSessions = await ExamSession.find({
    userId,
    createdAt: { $gte: thirtyDaysAgo },
    status: 'completed',
  }).lean();

  const completed = examSessions.length;
  const totalQuestions = examSessions.reduce((sum, s) => {
    const questions = s.examData?.sections?.flatMap((sec) => sec.questions) || [];
    return sum + questions.length;
  }, 0);

  // Calculate avg completion time
  const completedSessions = examSessions.filter((s) => s.completedAt);
  const avgCompletionTime =
    completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => {
          const duration = (s.examData?.duration || 60) * 60;
          const timeSpent = duration - (s.timeRemaining || 0);
          return sum + Math.max(0, timeSpent);
        }, 0) / completedSessions.length
      : 0;

  return {
    totalExamsCompleted: completed,
    avgQuestionsPerExam: completed > 0 ? Math.round(totalQuestions / completed) : 0,
    avgCompletionTimeSeconds: Math.round(avgCompletionTime),
  };
}

/**
 * POST /api/analytics
 * 
 * Track an analytics event (for frontend to send events)
 */
export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const {
      eventType,
      data,
      activityId,
      examSessionId,
      questionIndex,
      questionType,
      timeSpent,
      isCorrect,
      selectedAnswer,
      correctAnswer,
      topic,
      difficulty,
      sessionId,
    } = await request.json();

    if (!eventType) {
      return NextResponse.json({ error: 'Event type is required' }, { status: 400 });
    }

    const event = await AnalyticsEvent.create({
      userId: session.user.email,
      eventType,
      data: data || {},
      activityId: activityId || null,
      examSessionId: examSessionId || null,
      questionIndex: questionIndex !== undefined ? questionIndex : null,
      questionType: questionType || null,
      timeSpent: timeSpent || null,
      isCorrect: isCorrect !== undefined ? isCorrect : null,
      selectedAnswer: selectedAnswer || null,
      correctAnswer: correctAnswer || null,
      topic: topic || null,
      difficulty: difficulty || null,
      sessionId: sessionId || null,
      platform: 'web',
    });

    return NextResponse.json({ event, message: 'Event tracked' }, { status: 201 });
  } catch (error) {
    logger.error({ err: error }, 'Analytics POST error');
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
  }
}