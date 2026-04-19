/**
 * Gamification Service
 * XP calculation, streak tracking, badge management
 */

import connectDB from '@/lib/mongodb';
import UserProfile from '@/models/UserProfile';
import User from '@/models/User';

// XP rewards for different activities
const XP_REWARDS = {
  exam_complete: 50,
  exam_pass: 100, // >70%
  exam_perfect: 200, // 100%
  coding_solve: 30,
  coding_all_pass: 80,
  interview_complete: 60,
  interview_excellent: 120, // >80%
  daily_login: 10,
  streak_bonus: (streak) => Math.min(streak * 5, 50), // up to 50 bonus
};

// Level thresholds
const LEVELS = [
  { level: 1, xpRequired: 0, title: 'Beginner' },
  { level: 2, xpRequired: 100, title: 'Learner' },
  { level: 3, xpRequired: 300, title: 'Practitioner' },
  { level: 4, xpRequired: 600, title: 'Intermediate' },
  { level: 5, xpRequired: 1000, title: 'Advanced' },
  { level: 6, xpRequired: 1500, title: 'Expert' },
  { level: 7, xpRequired: 2500, title: 'Master' },
  { level: 8, xpRequired: 4000, title: 'Grandmaster' },
  { level: 9, xpRequired: 6000, title: 'Legend' },
  { level: 10, xpRequired: 10000, title: 'Champion' },
];

// Badge definitions
const BADGES = {
  first_exam: { id: 'first_exam', name: 'First Exam', emoji: '📝', description: 'Complete your first exam' },
  first_code: { id: 'first_code', name: 'First Code', emoji: '💻', description: 'Solve your first coding problem' },
  first_interview: {
    id: 'first_interview',
    name: 'First Interview',
    emoji: '🎤',
    description: 'Complete your first interview',
  },
  perfect_score: { id: 'perfect_score', name: 'Perfect Score', emoji: '💯', description: 'Score 100% on any exam' },
  streak_7: { id: 'streak_7', name: 'Week Warrior', emoji: '🔥', description: '7-day streak' },
  streak_30: { id: 'streak_30', name: 'Monthly Maven', emoji: '⚡', description: '30-day streak' },
  ten_exams: { id: 'ten_exams', name: 'Exam Expert', emoji: '🎯', description: 'Complete 10 exams' },
  fifty_exams: { id: 'fifty_exams', name: 'Exam Master', emoji: '🏆', description: 'Complete 50 exams' },
  level_5: { id: 'level_5', name: 'Advanced', emoji: '⭐', description: 'Reach level 5' },
  level_10: { id: 'level_10', name: 'Champion', emoji: '👑', description: 'Reach level 10' },
  speed_demon: {
    id: 'speed_demon',
    name: 'Speed Demon',
    emoji: '⚡',
    description: 'Complete exam in under half the time limit',
  },
  night_owl: { id: 'night_owl', name: 'Night Owl', emoji: '🦉', description: 'Study after midnight' },
};

/**
 * Calculate level from XP
 */
export function calculateLevel(xp) {
  let currentLevel = LEVELS[0];
  for (const level of LEVELS) {
    if (xp >= level.xpRequired) {
      currentLevel = level;
    } else {
      break;
    }
  }
  const nextLevel = LEVELS.find((l) => l.level === currentLevel.level + 1);
  const xpForNext = nextLevel ? nextLevel.xpRequired - xp : 0;
  const progress = nextLevel
    ? ((xp - currentLevel.xpRequired) / (nextLevel.xpRequired - currentLevel.xpRequired)) * 100
    : 100;

  return {
    ...currentLevel,
    xp,
    xpForNext: Math.max(0, xpForNext),
    progress: Math.min(100, Math.max(0, progress)),
    nextLevel: nextLevel || null,
  };
}

/**
 * Get or create user profile
 */
export async function getUserProfile(userId) {
  await connectDB();
  let profile = await UserProfile.findOne({ userId }).lean();
  if (!profile) {
    profile = await UserProfile.create({ userId });
    profile = profile.toObject();
  }
  return {
    ...profile,
    levelInfo: calculateLevel(profile.xp || 0),
    badgeDetails: (profile.badges || []).map((id) => BADGES[id]).filter(Boolean),
  };
}

/**
 * Award XP and check for new badges
 * @param {string} userId
 * @param {string} activityType - 'exam', 'coding', 'interview'
 * @param {Object} details - { score, totalMarks, duration, etc. }
 * @returns {Object} { xpAwarded, newBadges, newLevel, streak }
 */
export async function awardXP(userId, activityType, details = {}) {
  await connectDB();
  let profile = await UserProfile.findOne({ userId });
  if (!profile) {
    profile = await UserProfile.create({ userId });
  }

  let xpAwarded = 0;
  const newBadges = [];
  const percentage = details.totalMarks > 0 ? Math.round((details.score / details.totalMarks) * 100) : 0;

  // Calculate XP based on activity type
  switch (activityType) {
    case 'exam':
      xpAwarded += XP_REWARDS.exam_complete;
      if (percentage >= 70) xpAwarded += XP_REWARDS.exam_pass;
      if (percentage === 100) xpAwarded += XP_REWARDS.exam_perfect;
      profile.totalExams = (profile.totalExams || 0) + 1;
      if (percentage > (profile.bestScore || 0)) profile.bestScore = percentage;

      // Badge checks
      if (profile.totalExams === 1) newBadges.push('first_exam');
      if (profile.totalExams === 10) newBadges.push('ten_exams');
      if (profile.totalExams === 50) newBadges.push('fifty_exams');
      if (percentage === 100) newBadges.push('perfect_score');
      break;

    case 'coding':
      xpAwarded += XP_REWARDS.coding_solve;
      if (percentage === 100) xpAwarded += XP_REWARDS.coding_all_pass;
      profile.totalCoding = (profile.totalCoding || 0) + 1;
      if (profile.totalCoding === 1) newBadges.push('first_code');
      break;

    case 'interview':
      xpAwarded += XP_REWARDS.interview_complete;
      if (percentage >= 80) xpAwarded += XP_REWARDS.interview_excellent;
      profile.totalInterviews = (profile.totalInterviews || 0) + 1;
      if (profile.totalInterviews === 1) newBadges.push('first_interview');
      break;
  }

  // Streak logic
  const today = new Date().toDateString();
  const lastActive = profile.lastActiveDate ? new Date(profile.lastActiveDate).toDateString() : null;

  if (lastActive !== today) {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (lastActive === yesterday) {
      profile.currentStreak = (profile.currentStreak || 0) + 1;
    } else if (lastActive !== today) {
      profile.currentStreak = 1;
    }
    profile.longestStreak = Math.max(profile.longestStreak || 0, profile.currentStreak);
    profile.lastActiveDate = new Date();

    // Streak XP bonus
    xpAwarded += XP_REWARDS.streak_bonus(profile.currentStreak);

    // Streak badges
    if (profile.currentStreak >= 7 && !profile.badges?.includes('streak_7')) newBadges.push('streak_7');
    if (profile.currentStreak >= 30 && !profile.badges?.includes('streak_30')) newBadges.push('streak_30');
  }

  // Night owl badge
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 5 && !profile.badges?.includes('night_owl')) {
    newBadges.push('night_owl');
  }

  // Apply XP
  profile.xp = (profile.xp || 0) + xpAwarded;

  // Level badges
  const levelInfo = calculateLevel(profile.xp);
  if (levelInfo.level >= 5 && !profile.badges?.includes('level_5')) newBadges.push('level_5');
  if (levelInfo.level >= 10 && !profile.badges?.includes('level_10')) newBadges.push('level_10');

  // Add new badges (deduplicate)
  const existingBadges = new Set(profile.badges || []);
  const actuallyNew = newBadges.filter((b) => !existingBadges.has(b));
  if (actuallyNew.length > 0) {
    profile.badges = [...existingBadges, ...actuallyNew];
  }

  await profile.save();

  return {
    xpAwarded,
    totalXP: profile.xp,
    newBadges: actuallyNew.map((id) => BADGES[id]).filter(Boolean),
    levelInfo: calculateLevel(profile.xp),
    streak: profile.currentStreak || 0,
  };
}

/**
 * Get leaderboard
 * @param {number} page
 * @param {number} limit
 */
export async function getLeaderboard(page = 1, limit = 20) {
  await connectDB();
  const skip = (page - 1) * limit;

  const [profiles, total] = await Promise.all([
    UserProfile.find({}).sort({ xp: -1 }).skip(skip).limit(limit).lean(),
    UserProfile.countDocuments({}),
  ]);

  // Look up user names to avoid leaking email addresses
  const userEmails = profiles.map((p) => p.userId);
  const userDocs = await User.find({ email: { $in: userEmails } })
    .select('email name')
    .lean();
  const nameMap = new Map(userDocs.map((u) => [u.email, u.name]));

  return {
    users: profiles.map((u, i) => ({
      rank: skip + i + 1,
      displayName: nameMap.get(u.userId) || 'User',
      xp: u.xp || 0,
      level: calculateLevel(u.xp || 0),
      streak: u.currentStreak || 0,
      totalExams: u.totalExams || 0,
      badges: (u.badges || []).length,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export { BADGES, LEVELS, XP_REWARDS };
