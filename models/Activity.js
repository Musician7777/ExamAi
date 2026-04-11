import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['exam', 'coding', 'interview'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    default: 0,
  },
  totalMarks: {
    type: Number,
    default: 100,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'mixed', null],
    default: null,
  },
  duration: {
    type: Number, // seconds taken
    default: null,
  },
  tags: {
    type: [String],
    default: [],
  },
}, {
  timestamps: true,
});

const Activity = mongoose.models.Activity || mongoose.model('Activity', activitySchema);

export default Activity;
