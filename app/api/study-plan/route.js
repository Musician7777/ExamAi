import { NextResponse } from 'next/server';
import StudyPlan from '@/models/StudyPlan';
import AnalyticsEvent from '@/models/AnalyticsEvent';
import Activity from '@/models/Activity';
import ExamSession from '@/models/ExamSession';
import { apiRoute } from '@/lib/apiHandler';
import { studyPlanCreateSchema, studyPlanUpdateSchema } from '@/lib/validation';
import logger from '@/lib/logger';

/**
 * GET /api/study-plan
 */
export const GET = apiRoute(
  {
    requireAuth: true,
    connectDB: true,
    errorMessage: 'Failed to fetch study plan',
  },
  async (request, { session }) => {
    const userId = session.user.email;

    // Check for existing active plan
    let studyPlan = await StudyPlan.findOne({ userId, isActive: true }).lean();

    // If no active plan, generate a new one
    if (!studyPlan) {
      studyPlan = await generateStudyPlan(userId);
    }

    return NextResponse.json({ studyPlan });
  }
);

/**
 * POST /api/study-plan
 * Body: { regenerate?: boolean }
 */
export const POST = apiRoute(
  {
    requireAuth: true,
    requireCsrf: true,
    schema: studyPlanCreateSchema,
    connectDB: true,
    errorMessage: 'Failed to generate study plan',
  },
  async (request, { session, body }) => {
    const userId = session.user.email;
    const { regenerate } = body;

    // If regenerate is true, deactivate existing plans
    if (regenerate) {
      await StudyPlan.updateMany({ userId, isActive: true }, { isActive: false });
    }

    // Generate new study plan
    const studyPlan = await generateStudyPlan(userId, regenerate);

    return NextResponse.json({ studyPlan, message: 'Study plan generated' }, { status: 201 });
  }
);

/**
 * PUT /api/study-plan
 * Body: { itemId?, status?, action: 'update_item' | 'regenerate' }
 */
export const PUT = apiRoute(
  {
    requireAuth: true,
    requireCsrf: true,
    schema: studyPlanUpdateSchema,
    connectDB: true,
    errorMessage: 'Failed to update study plan',
  },
  async (request, { session, body }) => {
    const userId = session.user.email;
    const { action, itemId, status, notes } = body;

    if (action === 'update_item') {
      if (!itemId) {
        return NextResponse.json({ error: 'Item ID is required for update_item action' }, { status: 400 });
      }
      const studyPlan = await StudyPlan.findOne({ userId, isActive: true });
      if (!studyPlan) {
        return NextResponse.json({ error: 'No active study plan found' }, { status: 404 });
      }

      const item = studyPlan.items.id(itemId);
      if (!item) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }

      if (status) item.status = status;
      if (notes !== undefined) item.notes = notes;

      // Update progress counts
      studyPlan.completedItems = studyPlan.items.filter((i) => i.status === 'completed').length;
      studyPlan.totalItems = studyPlan.items.length;

      // If all items completed, mark plan as complete
      if (studyPlan.completedItems === studyPlan.totalItems && studyPlan.totalItems > 0) {
        studyPlan.isActive = false;
        studyPlan.endDate = new Date();
      }

      await studyPlan.save();
      return NextResponse.json({ studyPlan, message: 'Item updated' });
    }

    if (action === 'regenerate') {
      await StudyPlan.updateMany({ userId, isActive: true }, { isActive: false });
      const newPlan = await generateStudyPlan(userId, true);
      return NextResponse.json({ studyPlan: newPlan, message: 'Plan regenerated' });
    }

    // Unreachable — Zod enum ensures action is always valid
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
);

/**
 * Generate a personalized study plan based on analytics recommendations
 */
async function generateStudyPlan(userId) {
  const [questionEvents, activities, examSessions] = await Promise.all([
    AnalyticsEvent.find({
      userId,
      eventType: { $in: ['question_correct', 'question_incorrect'] },
    })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean(),
    Activity.find({ userId }).sort({ createdAt: -1 }).limit(100).lean(),
    ExamSession.find({ userId }).lean(),
  ]);

  // Analyze weak topics
  const topicStats = {};
  try {
    questionEvents.forEach((event) => {
      const topic = event.topic;
      if (topic) {
        if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0 };
        topicStats[topic].total++;
        if (event.isCorrect) topicStats[topic].correct++;
      }
    });
  } catch (err) {
    logger.warn({ err }, 'Error analyzing topic stats');
  }

  // Get weak topics (accuracy < 50% with at least 3 questions)
  const weakTopics = Object.entries(topicStats)
    .filter(([_, stats]) => stats.total >= 3 && (stats.correct / stats.total) * 100 < 50)
    .map(([topic, stats]) => ({
      topic,
      accuracy: Math.round((stats.correct / stats.total) * 100),
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5);

  // Get question types to practice
  const questionTypeStats = {
    MCQ: { correct: 0, total: 0 },
    MSQ: { correct: 0, total: 0 },
    NAT: { correct: 0, total: 0 },
  };
  questionEvents.forEach((event) => {
    const qType = event.questionType || 'MCQ';
    if (questionTypeStats[qType]) {
      questionTypeStats[qType].total++;
      if (event.isCorrect) questionTypeStats[qType].correct++;
    }
  });

  const questionTypesToPractice = Object.entries(questionTypeStats)
    .filter(([_, stats]) => stats.total >= 5 && (stats.correct / stats.total) * 100 < 60)
    .map(([type, stats]) => ({
      type,
      accuracy: Math.round((stats.correct / stats.total) * 100),
    }));

  // Build study plan items
  const items = [];
  let priority = 1;

  weakTopics.forEach((wt) => {
    items.push({
      topic: wt.topic,
      type: 'weak_topic',
      priority: priority++,
      targetActivities: 5,
      status: 'pending',
    });
  });

  questionTypesToPractice.slice(0, 3).forEach((qt) => {
    items.push({
      topic: `${qt.type} Questions`,
      type: 'question_type',
      priority: priority++,
      targetActivities: 4,
      status: 'pending',
    });
  });

  const completedSessions = examSessions.filter((s) => s.status === 'completed').length;
  if (completedSessions > 0) {
    items.push({
      topic: 'Review Completed Exams',
      type: 'milestone',
      priority: priority++,
      targetActivities: Math.min(completedSessions, 5),
      status: 'pending',
    });
  }

  if (activities.length < 10) {
    items.push({
      topic: 'Regular Practice',
      type: 'practice',
      priority: priority++,
      targetActivities: 10,
      status: 'pending',
    });
  }

  // Calculate dates
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 28);

  const weeksCount = 4;
  items.forEach((item, idx) => {
    const weekNum = Math.min(Math.floor(idx / (items.length / weeksCount)) + 1, weeksCount);
    const targetDate = new Date(startDate);
    targetDate.setDate(targetDate.getDate() + (weekNum - 1) * 7);
    item.targetDate = targetDate;
  });

  const totalCorrect = questionEvents.filter((e) => e.isCorrect).length;
  const overallAccuracy = questionEvents.length > 0 ? Math.round((totalCorrect / questionEvents.length) * 100) : 0;

  const studyPlan = await StudyPlan.create({
    userId,
    title: 'Personalized Study Plan',
    durationWeeks: 4,
    weeklyGoal: 'Focus on weak areas and maintain regular practice',
    focusAreas: weakTopics.map((wt) => wt.topic),
    items,
    analyticsSnapshot: {
      weakTopics,
      strongTopics: [],
      questionTypesToPractice: questionTypesToPractice.map((qt) => qt.type),
      overallAccuracy,
      totalActivities: activities.length,
    },
    startDate,
    endDate,
    isActive: true,
    completedItems: 0,
    totalItems: items.length,
  });

  return studyPlan.toObject();
}
