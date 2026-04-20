import mongoose from 'mongoose';

const userProfileSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    xp: { type: Number, default: 0 },
    badges: { type: [String], default: [] },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: null },
    totalExams: { type: Number, default: 0 },
    totalCoding: { type: Number, default: 0 },
    totalInterviews: { type: Number, default: 0 },
    bestScore: { type: Number, default: 0 },
    showAds: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

const UserProfile = mongoose.models.UserProfile || mongoose.model('UserProfile', userProfileSchema);
export default UserProfile;
