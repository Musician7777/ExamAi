import mongoose from 'mongoose';

/* ─── Schedule Task Schema ─── */
const scheduleTaskSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  title: { type: String, required: true },
  type: {
    type: String,
    enum: [
      'easy-test',
      'medium-test',
      'hard-test',
      'subject-test',
      'mock-test',
      'timed-test',
      'previous-year',
      'mixed-test',
      'coding-test',
      'interview-sim',
      'rest',
    ],
    required: true,
  },
  stage: { type: String, default: '' },
  subject: { type: String, default: '' },
  duration: { type: Number, default: 60 }, // minutes
  priority: { type: Number, default: 3, min: 1, max: 5 },
  actionRoute: { type: String, default: '' },
  actionConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
  completionStatus: {
    type: String,
    enum: ['planned', 'in_progress', 'completed', 'skipped'],
    default: 'planned',
  },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
});

/* ─── Stage Schema ─── */
const stageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  objective: { type: String, default: '' },
  duration: { type: Number, default: 7 }, // days
  startDay: { type: Number, default: 1 },
  endDay: { type: Number, default: 7 },
  practiceFocus: { type: [String], default: [] },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed'],
    default: 'upcoming',
  },
});

/* ─── Subject Schema ─── */
const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  totalSessions: { type: Number, default: 0 },
  revisionCount: { type: Number, default: 0 },
  mockAllocation: { type: Number, default: 0 },
  difficultyLevel: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  priorityScore: { type: Number, default: 3, min: 1, max: 5 },
  strengthLevel: {
    type: String,
    enum: ['weak', 'average', 'strong'],
    default: 'average',
  },
});

/* ─── Main Pathway Schema ─── */
const pathwaySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },

    /* ── Goal & Exam ── */
    examName: { type: String, required: true },
    examType: { type: String, default: 'custom' },
    goalType: {
      type: String,
      enum: [
        'competitive-exam',
        'school-college',
        'interview-preparation',
        'coding-interview',
        'skill-learning',
        'custom',
      ],
      default: 'custom',
    },

    /* ── Structure ── */
    stages: { type: [stageSchema], default: [] },
    subjects: { type: [subjectSchema], default: [] },
    questionTypes: { type: [String], default: [] },

    /* ── Time ── */
    totalDuration: { type: Number, default: 30 }, // days
    dailyAvailability: { type: Number, default: 2 }, // hours
    preferredDays: { type: [String], default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: null },

    /* ── User preferences ── */
    currentLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'practicing', 'mock-ready'],
      default: 'beginner',
    },
    testPreferences: {
      easyTests: { type: Number, default: 25 },
      mediumTests: { type: Number, default: 35 },
      hardTests: { type: Number, default: 20 },
      mockTests: { type: Number, default: 20 },
    },
    constraints: { type: [String], default: [] },

    /* ── Schedule ── */
    schedule: { type: [scheduleTaskSchema], default: [] },

    /* ── Metadata ── */
    strategySummary: { type: String, default: '' },
    inferredFields: { type: [String], default: [] },
    userOverrides: { type: mongoose.Schema.Types.Mixed, default: {} },

    /* ── Progress ── */
    completedTasks: { type: Number, default: 0 },
    totalTasks: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/* ── Virtuals ── */
pathwaySchema.virtual('completionPercentage').get(function () {
  if (this.totalTasks === 0) return 0;
  return Math.round((this.completedTasks / this.totalTasks) * 100);
});

pathwaySchema.set('toJSON', { virtuals: true });
pathwaySchema.set('toObject', { virtuals: true });

/* ── Indexes ── */
pathwaySchema.index({ userId: 1, isActive: 1 });

const Pathway = mongoose.models.Pathway || mongoose.model('Pathway', pathwaySchema);

export default Pathway;
