import mongoose from 'mongoose';

const analyticsEventSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: [
        // Funnel events
        'exam_start',
        'exam_progress',
        'exam_complete',
        'exam_review',
        'exam_abandon',
        // Question-level events
        'question_view',
        'question_answer',
        'question_correct',
        'question_incorrect',
        'question_marked',
        'question_unmarked',
        // Session events
        'session_create',
        'session_resume',
        'session_pause',
        // Engagement events
        'daily_active',
        'returning_user',
        'new_signup',
        // Interview events
        'interview_start',
        'interview_complete',
      ],
      index: true,
    },
    // Context data
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // For question-level tracking
    activityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity',
      default: null,
    },
    examSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamSession',
      default: null,
    },
    // Question metadata
    questionIndex: {
      type: Number,
      default: null,
    },
    questionType: {
      type: String,
      enum: ['MCQ', 'MSQ', 'NAT', 'Descriptive', null],
      default: null,
    },
    timeSpent: {
      type: Number, // seconds spent on question
      default: null,
    },
    // Result data for question events
    isCorrect: {
      type: Boolean,
      default: null,
    },
    selectedAnswer: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    correctAnswer: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // Topic/topic for recommendation engine
    topic: {
      type: String,
      default: null,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', null],
      default: null,
    },
    // Device/platform info
    platform: {
      type: String,
      default: 'web',
    },
    sessionId: {
      type: String, // Anonymous session ID for cohort grouping
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
analyticsEventSchema.index({ userId: 1, eventType: 1, createdAt: -1 });
analyticsEventSchema.index({ eventType: 1, createdAt: -1 });
analyticsEventSchema.index({ userId: 1, createdAt: -1 });
analyticsEventSchema.index({ sessionId: 1, createdAt: -1 });

// Cohort analysis index - weekly grouping
analyticsEventSchema.index({ eventType: 1, sessionId: 1, createdAt: -1 });
// Topic and difficulty filtering indexes
analyticsEventSchema.index({ userId: 1, topic: 1 });
analyticsEventSchema.index({ userId: 1, difficulty: 1 });

const AnalyticsEvent = mongoose.models.AnalyticsEvent || mongoose.model('AnalyticsEvent', analyticsEventSchema);

export default AnalyticsEvent;
