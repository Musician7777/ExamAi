import mongoose from 'mongoose';

const studyPlanItemSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  type: { type: String, enum: ['weak_topic', 'question_type', 'review', 'practice', 'milestone'], required: true },
  priority: { type: Number, default: 1 }, // 1 = highest priority
  targetDate: { type: Date, default: null },
  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'skipped'], default: 'pending' },
  activitiesCount: { type: Number, default: 0 }, // How many practice activities done
  targetActivities: { type: Number, default: 3 }, // Target number of practice activities
  notes: { type: String, default: '' },
});

const studyPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'Personalized Study Plan',
    },
    durationWeeks: {
      type: Number,
      default: 4,
    },
    weeklyGoal: {
      type: String,
      default: 'Complete targeted practice sessions',
    },
    focusAreas: {
      type: [String],
      default: [],
    },
    items: {
      type: [studyPlanItemSchema],
      default: [],
    },
    // Analytics data snapshot when plan was generated
    analyticsSnapshot: {
      weakTopics: [{ topic: String, accuracy: Number }],
      strongTopics: [{ topic: String, accuracy: Number }],
      questionTypesToPractice: [String],
      overallAccuracy: Number,
      totalActivities: Number,
    },
    // Progress tracking
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Completion metrics
    completedItems: {
      type: Number,
      default: 0,
    },
    totalItems: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for completion percentage
studyPlanSchema.virtual('completionPercentage').get(function () {
  if (this.totalItems === 0) return 0;
  return Math.round((this.completedItems / this.totalItems) * 100);
});

// Ensure virtuals are included in JSON output
studyPlanSchema.set('toJSON', { virtuals: true });
studyPlanSchema.set('toObject', { virtuals: true });

// Compound index for efficient active plan lookups
studyPlanSchema.index({ userId: 1, isActive: 1 });

const StudyPlan = mongoose.models.StudyPlan || mongoose.model('StudyPlan', studyPlanSchema);

export default StudyPlan;