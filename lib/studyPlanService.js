import StudyPlan from '@/models/StudyPlan';
import { cacheDelete } from '@/lib/services/redisCacheService';
import logger from '@/lib/logger';

/**
 * Automatically update study plan progress when a user completes an activity.
 *
 * This function matches the activity against study plan items and increments
 * the activitiesCount for matching items.
 *
 * @param {string} userId - The user's email/ID
 * @param {Object} activity - The activity that was just completed
 * @returns {Promise<Object|null>} - Updated study plan or null if no match
 */
export async function updateStudyPlanProgress(userId, activity) {
  try {
    // Find the user's active study plan
    const studyPlan = await StudyPlan.findOne({ userId, isActive: true });
    if (!studyPlan) {
      return null;
    }

    const activityType = activity.type; // 'exam', 'coding', 'interview'
    const activityTags = activity.tags || [];
    const activityTitle = (activity.title || '').toLowerCase();
    const activityDifficulty = activity.difficulty;

    let updated = false;

    // Check each item in the study plan
    for (const item of studyPlan.items) {
      // Skip if item is already completed or skipped
      if (item.status === 'completed' || item.status === 'skipped') {
        continue;
      }

      // Check if this activity matches the item
      let matches = false;

      if (item.type === 'weak_topic') {
        // Match by topic name in tags or title
        const topicLower = item.topic.toLowerCase();
        matches =
          activityTags.some((tag) => tag.toLowerCase().includes(topicLower)) || activityTitle.includes(topicLower);
      } else if (item.type === 'question_type') {
        // Question type items are matched when exam details include question type info
        // For now, match all exams for question type practice (user can manually update if needed)
        // This is intentionally broader to encourage practice
        if (activityType === 'exam') {
          matches = true;
        }
      } else if (item.type === 'milestone') {
        // Match review milestone
        matches = item.topic.toLowerCase().includes('review') && activityType === 'exam';
      } else if (item.type === 'practice') {
        // General practice matches any activity
        matches = true;
      }

      if (matches) {
        // Increment activities count
        item.activitiesCount = (item.activitiesCount || 0) + 1;

        // Check if target is met - auto-mark as in_progress
        if (item.status === 'pending' && item.activitiesCount > 0) {
          item.status = 'in_progress';
        }

        // If target activities reached, auto-complete
        if (item.activitiesCount >= item.targetActivities && item.status !== 'completed') {
          item.status = 'completed';
        }

        updated = true;
        logger.info(
          { userId, itemTopic: item.topic, activitiesCount: item.activitiesCount },
          'Study plan item progress updated'
        );
      }
    }

    if (updated) {
      // Recalculate completed items count
      studyPlan.completedItems = studyPlan.items.filter((i) => i.status === 'completed').length;
      studyPlan.totalItems = studyPlan.items.length;

      // Check if all items are completed
      const allCompleted = studyPlan.items.every((i) => i.status === 'completed' || i.status === 'skipped');
      if (allCompleted && studyPlan.items.length > 0) {
        studyPlan.isActive = false;
        studyPlan.endDate = new Date();
        logger.info({ userId }, 'Study plan completed automatically');
      }

      await studyPlan.save();

      // Invalidate study plan cache
      await cacheDelete(`studyPlan:${userId}`);

      return studyPlan;
    }

    return null;
  } catch (error) {
    logger.error({ err: error, userId }, 'Failed to update study plan progress');
    return null;
  }
}

/**
 * Check if an activity topic matches any study plan item
 *
 * @param {string} topic - Topic to check
 * @param {Object} studyPlan - The study plan object
 * @returns {boolean} - True if topic matches an item
 */
export function topicMatchesStudyPlanItem(topic, studyPlan) {
  if (!studyPlan || !studyPlan.items) return false;

  const topicLower = topic.toLowerCase();
  return studyPlan.items.some((item) => {
    if (item.type === 'weak_topic') {
      return item.topic.toLowerCase().includes(topicLower) || topicLower.includes(item.topic.toLowerCase());
    }
    return false;
  });
}

/**
 * Get suggested topics based on study plan focus areas
 *
 * @param {string} userId - The user's email/ID
 * @returns {Promise<Array>} - Array of suggested topics to practice
 */
export async function getSuggestedTopics(userId) {
  try {
    const studyPlan = await StudyPlan.findOne({ userId, isActive: true }).lean();
    if (!studyPlan) return [];

    // Get topics that are not yet completed
    const pendingTopics = studyPlan.items
      .filter((item) => item.type === 'weak_topic' && item.status !== 'completed')
      .map((item) => ({
        topic: item.topic,
        progress: item.activitiesCount || 0,
        target: item.targetActivities || 3,
        priority: item.priority || 99,
      }))
      .sort((a, b) => a.priority - b.priority);

    return pendingTopics;
  } catch (error) {
    logger.error({ err: error, userId }, 'Failed to get suggested topics');
    return [];
  }
}
