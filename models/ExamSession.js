import mongoose from 'mongoose';

const examSessionSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    examData: { type: mongoose.Schema.Types.Mixed, required: true }, // The full exam JSON
    answers: { type: mongoose.Schema.Types.Mixed, default: {} }, // questionId → selectedOption
    markedForReview: { type: [Number], default: [] },
    currentSection: { type: Number, default: 0 },
    currentQuestion: { type: Number, default: 0 },
    timeRemaining: { type: Number, required: true }, // seconds
    status: {
        type: String,
        enum: ['in_progress', 'paused', 'completed', 'abandoned'],
        default: 'in_progress',
    },
    startedAt: { type: Date, default: Date.now },
    pausedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    totalPauseDuration: { type: Number, default: 0 }, // total paused seconds
}, {
    timestamps: true,
});

// Index for finding active sessions quickly
examSessionSchema.index({ userId: 1, status: 1 });

const ExamSession = mongoose.models.ExamSession || mongoose.model('ExamSession', examSessionSchema);
export default ExamSession;
