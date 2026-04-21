'use client';
import { useMemo, useState } from 'react';
import { useCachedFetch } from '@/hooks/useCachedFetch';

/**
 * Builds type-wise score aggregates from activities.
 */
function buildTypeScores(activities) {
  const typeScores = {};
  activities.forEach((a) => {
    const topic = a.type === 'coding' ? 'Coding' : a.type === 'exam' ? 'Exams' : 'Interviews';
    if (!typeScores[topic]) typeScores[topic] = { total: 0, count: 0 };
    if (a.totalMarks > 0) {
      typeScores[topic].total += (a.score / a.totalMarks) * 100;
      typeScores[topic].count++;
    }
  });
  return typeScores;
}

/**
 * Builds deep topic-wise score aggregates from tags, sections, and coding title keywords.
 */
function buildDeepTopicScores(activities) {
  const deepTopicScores = {};
  activities.forEach((a) => {
    const tags = a.tags || [];
    tags.forEach((tag) => {
      const t = tag.trim();
      if (!t) return;
      if (!deepTopicScores[t]) deepTopicScores[t] = { total: 0, count: 0 };
      if (a.totalMarks > 0) {
        deepTopicScores[t].total += (a.score / a.totalMarks) * 100;
        deepTopicScores[t].count++;
      }
    });
    if (tags.length === 0 && a.type === 'exam') {
      const sectionTopics = a.details?.sections || [];
      sectionTopics.forEach((s) => {
        const t = typeof s === 'string' ? s.trim() : s.name?.trim();
        if (!t) return;
        if (!deepTopicScores[t]) deepTopicScores[t] = { total: 0, count: 0 };
        if (a.totalMarks > 0) {
          deepTopicScores[t].total += (a.score / a.totalMarks) * 100;
          deepTopicScores[t].count++;
        }
      });
    }
    if (tags.length === 0 && a.type === 'coding') {
      const codingTopics = [
        'DSA',
        'Arrays',
        'Strings',
        'Trees',
        'Graphs',
        'DP',
        'Sorting',
        'Searching',
        'Math',
        'Recursion',
      ];
      const found = codingTopics.find((t) => a.title?.toLowerCase().includes(t.toLowerCase()));
      if (found) {
        if (!deepTopicScores[found]) deepTopicScores[found] = { total: 0, count: 0 };
        if (a.totalMarks > 0) {
          deepTopicScores[found].total += (a.score / a.totalMarks) * 100;
          deepTopicScores[found].count++;
        }
      }
    }
  });
  return deepTopicScores;
}

/** Predefined date-range presets */
export const DATE_PRESETS = [
  { key: '7d', label: '7D', days: 7 },
  { key: '30d', label: '30D', days: 30 },
  { key: '90d', label: '3M', days: 90 },
  { key: '1y', label: '1Y', days: 365 },
  { key: 'all', label: 'All', days: null },
];

/**
 * Returns dateFrom / dateTo strings for a given preset key.
 */
function getPresetDates(presetKey) {
  if (presetKey === 'all') return { dateFrom: null, dateTo: null };
  const preset = DATE_PRESETS.find((p) => p.key === presetKey);
  if (!preset || preset.days === null) return { dateFrom: null, dateTo: null };
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - preset.days);
  return {
    dateFrom: from.toISOString().split('T')[0],
    dateTo: now.toISOString().split('T')[0],
  };
}

/**
 * Custom hook that fetches activities and computes all analytics data.
 * Returns loading state, derived metrics, Recharts-ready data arrays, and insight cards data.
 */
export function useAnalytics() {
  const [datePreset, setDatePreset] = useState('30d');
  const { dateFrom, dateTo } = useMemo(() => getPresetDates(datePreset), [datePreset]);

  const activitiesUrl = useMemo(() => {
    const params = new URLSearchParams({ limit: '1000', page: '1' });
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    return `/api/activities?${params.toString()}`;
  }, [dateFrom, dateTo]);

  const {
    data: activitiesData,
    loading,
    revalidating,
    error,
    refetch,
  } = useCachedFetch(activitiesUrl, {
    ttl: 60_000,
    selector: (json) => json.activities || [],
  });
  const activities = useMemo(() => activitiesData || [], [activitiesData]);

  // ── Deep Analytics (Funnel, Question Performance, Cohort) ──
  const {
    data: analyticsData,
    loading: analyticsLoading,
    revalidating: analyticsRevalidating,
  } = useCachedFetch('/api/analytics', {
    ttl: 120_000,
    selector: (json) => json,
  });

  const funnelData = useMemo(() => analyticsData?.funnel || null, [analyticsData]);
  const questionPerformance = useMemo(() => analyticsData?.questionPerformance || [], [analyticsData]);
  const difficultyPerformance = useMemo(() => analyticsData?.difficultyPerformance || [], [analyticsData]);
  const weeklyRetention = useMemo(() => analyticsData?.weeklyRetention || [], [analyticsData]);
  const recommendations = useMemo(() => analyticsData?.recommendations || null, [analyticsData]);

  const hasData = activities.length > 0;

  // Scored activities with metadata — preserved in chronological order for tooltips & labels
  const scoredActivities = useMemo(
    () =>
      activities
        .filter((a) => a.totalMarks > 0)
        .map((a) => ({
          score: Math.round((a.score / a.totalMarks) * 100),
          title: a.title || 'Untitled',
          type: a.type,
          date: a.createdAt,
        }))
        .reverse(),
    [activities]
  );
  const scores = useMemo(() => scoredActivities.map((a) => a.score), [scoredActivities]);

  // Type-wise scores
  const typeScores = useMemo(() => buildTypeScores(activities), [activities]);
  const topicLabels = useMemo(
    () => (Object.keys(typeScores).length > 0 ? Object.keys(typeScores) : ['Coding', 'Exams', 'Interviews']),
    [typeScores]
  );
  const topicValues = useMemo(
    () => topicLabels.map((t) => (typeScores[t] ? Math.round(typeScores[t].total / typeScores[t].count) : 0)),
    [topicLabels, typeScores]
  );

  // Deep topic-wise analytics
  const deepTopicScores = useMemo(() => buildDeepTopicScores(activities), [activities]);
  const deepTopicEntries = useMemo(
    () =>
      Object.entries(deepTopicScores)
        .filter(([_, v]) => v.count > 0)
        .sort((a, b) => b[1].count - a[1].count),
    [deepTopicScores]
  );
  const deepTopicLabels = useMemo(() => deepTopicEntries.map(([k]) => k), [deepTopicEntries]);
  const deepTopicValues = useMemo(
    () => deepTopicEntries.map(([_, v]) => Math.round(v.total / v.count)),
    [deepTopicEntries]
  );
  const deepTopicCounts = useMemo(() => deepTopicEntries.map(([_, v]) => v.count), [deepTopicEntries]);
  const weakTopics = useMemo(
    () =>
      deepTopicEntries
        .filter(([_, v]) => v.total / v.count < 50)
        .map(([k, v]) => ({ name: k, avg: Math.round(v.total / v.count), count: v.count })),
    [deepTopicEntries]
  );
  const strongTopics = useMemo(
    () =>
      deepTopicEntries
        .filter(([_, v]) => v.total / v.count >= 75)
        .map(([k, v]) => ({ name: k, avg: Math.round(v.total / v.count), count: v.count })),
    [deepTopicEntries]
  );

  // Difficulty-based breakdown
  const easyScores = useMemo(() => activities.filter((a) => a.difficulty === 'easy'), [activities]);
  const medScores = useMemo(() => activities.filter((a) => a.difficulty === 'medium'), [activities]);
  const hardScores = useMemo(() => activities.filter((a) => a.difficulty === 'hard'), [activities]);
  const mixedScores = useMemo(() => activities.filter((a) => a.difficulty === 'mixed'), [activities]);
  const unratedScores = useMemo(() => activities.filter((a) => !a.difficulty), [activities]);

  // Score-based performance bands
  const highScoreCount = useMemo(() => scores.filter((s) => s >= 80).length, [scores]);
  const midScoreCount = useMemo(() => scores.filter((s) => s >= 50 && s < 80).length, [scores]);
  const lowScoreCount = useMemo(() => scores.filter((s) => s < 50).length, [scores]);

  // Duration analytics
  const activitiesWithDuration = useMemo(
    () => activities.filter((a) => a.duration != null && a.duration > 0 && a.totalMarks > 0),
    [activities]
  );
  const avgDuration = useMemo(() => {
    if (activitiesWithDuration.length === 0) return null;
    const total = activitiesWithDuration.reduce((sum, a) => sum + a.duration, 0);
    return Math.round(total / activitiesWithDuration.length);
  }, [activitiesWithDuration]);
  const avgDurationByType = useMemo(() => {
    const buckets = { exam: [], coding: [], interview: [] };
    activitiesWithDuration.forEach((a) => {
      if (buckets[a.type]) buckets[a.type].push(a.duration);
    });
    return Object.fromEntries(
      Object.entries(buckets)
        .filter(([_, durs]) => durs.length > 0)
        .map(([type, durs]) => [type, Math.round(durs.reduce((a, b) => a + b, 0) / durs.length)])
    );
  }, [activitiesWithDuration]);

  // ── Recharts-ready data arrays ──

  const scoreTrendData = useMemo(
    () =>
      scoredActivities.map((a) => {
        const d = new Date(a.date);
        return {
          date: `${d.toLocaleDateString('en-US', { month: 'short' })} ${d.getDate()}`,
          fullDate: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          score: a.score,
          title: a.title,
          type: a.type,
        };
      }),
    [scoredActivities]
  );

  const topicData = useMemo(
    () =>
      topicLabels.map((label, i) => ({
        subject: label,
        accuracy: topicValues[i],
        count: typeScores[label]?.count || 0,
        fullMark: 100,
      })),
    [topicLabels, topicValues, typeScores]
  );

  const scoreDistribution = useMemo(
    () =>
      hasData
        ? [
            { range: '0-20%', count: scores.filter((s) => s <= 20).length, fill: '#ef4444' },
            { range: '21-40%', count: scores.filter((s) => s > 20 && s <= 40).length, fill: '#f59e0b' },
            { range: '41-60%', count: scores.filter((s) => s > 40 && s <= 60).length, fill: '#6366f1' },
            { range: '61-80%', count: scores.filter((s) => s > 60 && s <= 80).length, fill: '#22c55e' },
            { range: '81-100%', count: scores.filter((s) => s > 80).length, fill: '#4ade80' },
          ]
        : [],
    [hasData, scores]
  );

  const scoreRangeData = useMemo(() => {
    if (!hasData) return [];
    return [
      { name: 'High (80%+)', value: highScoreCount, fill: '#4ade80' },
      { name: 'Medium (50-79%)', value: midScoreCount, fill: '#fbbf24' },
      { name: 'Low (<50%)', value: lowScoreCount, fill: '#f87171' },
    ];
  }, [hasData, highScoreCount, midScoreCount, lowScoreCount]);

  const scatterData = useMemo(
    () =>
      activitiesWithDuration.map((a) => ({
        duration: a.duration,
        score: Math.round((a.score / a.totalMarks) * 100),
        title: a.title || 'Untitled',
        type: a.type,
      })),
    [activitiesWithDuration]
  );

  // Streak tracking — daily and weekly practice streaks from activity timestamps
  const streak = useMemo(() => {
    if (activities.length === 0) return null;

    const toDayStr = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const areConsecutiveDays = (a, b) => {
      const dA = new Date(a + 'T12:00:00');
      const dB = new Date(b + 'T12:00:00');
      const diffDays = Math.round((dB - dA) / 86_400_000);
      return diffDays === 1;
    };

    const daySet = new Set(activities.map((a) => toDayStr(new Date(a.createdAt))));
    const uniqueDays = [...daySet].sort();

    const today = new Date();
    const todayStr = toDayStr(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toDayStr(yesterday);

    let currentStreak = 0;
    const lastDay = uniqueDays[uniqueDays.length - 1];
    if (lastDay === todayStr || lastDay === yesterdayStr) {
      const checkDate = new Date(lastDay + 'T12:00:00');
      while (daySet.has(toDayStr(checkDate))) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    let longestStreak = 0;
    let runLen = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      if (areConsecutiveDays(uniqueDays[i - 1], uniqueDays[i])) {
        runLen++;
      } else {
        longestStreak = Math.max(longestStreak, runLen);
        runLen = 1;
      }
    }
    longestStreak = Math.max(longestStreak, runLen, currentStreak);

    const getWeekMonday = (d) => {
      const day = d.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(d);
      monday.setDate(monday.getDate() + diffToMonday);
      return toDayStr(monday);
    };

    const weekSet = new Set(activities.map((a) => getWeekMonday(new Date(a.createdAt))));
    const uniqueWeeks = [...weekSet].sort();

    const thisWeekMonday = getWeekMonday(today);
    const lastWeekMonday = new Date(today);
    lastWeekMonday.setDate(lastWeekMonday.getDate() - 7);
    const lastWeekMondayStr = getWeekMonday(lastWeekMonday);

    let weeklyStreak = 0;
    const lastWeek = uniqueWeeks[uniqueWeeks.length - 1];
    if (lastWeek === thisWeekMonday || lastWeek === lastWeekMondayStr) {
      const checkWeek = new Date(lastWeek + 'T12:00:00');
      while (weekSet.has(toDayStr(checkWeek))) {
        weeklyStreak++;
        checkWeek.setDate(checkWeek.getDate() - 7);
      }
    }

    let longestWeeklyStreak = 0;
    let weekRun = 1;
    for (let i = 1; i < uniqueWeeks.length; i++) {
      const prevMonday = new Date(uniqueWeeks[i - 1] + 'T12:00:00');
      const currMonday = new Date(uniqueWeeks[i] + 'T12:00:00');
      const diffDays = Math.round((currMonday - prevMonday) / 86_400_000);
      if (diffDays === 7) {
        weekRun++;
      } else {
        longestWeeklyStreak = Math.max(longestWeeklyStreak, weekRun);
        weekRun = 1;
      }
    }
    longestWeeklyStreak = Math.max(longestWeeklyStreak, weekRun, weeklyStreak);

    const activityCountsByDay = {};
    activities.forEach((a) => {
      const dayStr = toDayStr(new Date(a.createdAt));
      activityCountsByDay[dayStr] = (activityCountsByDay[dayStr] || 0) + 1;
    });

    const thisMonday = getWeekMonday(today);
    const gridStart = new Date(thisMonday + 'T12:00:00');
    gridStart.setDate(gridStart.getDate() - 21);

    const calendarDays = [];
    for (let offset = 0; offset < 28; offset++) {
      const d = new Date(gridStart);
      d.setDate(d.getDate() + offset);
      const dayStr = toDayStr(d);
      calendarDays.push({
        date: dayStr,
        count: activityCountsByDay[dayStr] || 0,
        isToday: dayStr === todayStr,
      });
    }

    return {
      currentStreak,
      longestStreak,
      weeklyStreak,
      longestWeeklyStreak,
      totalActiveDays: uniqueDays.length,
      calendarDays,
    };
  }, [activities]);

  // Trend indicators
  const trend = useMemo(() => {
    if (scores.length < 4) return null;
    const mid = Math.floor(scores.length / 2);
    const earlier = scores.slice(0, mid);
    const recent = scores.slice(mid);
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const diff = recentAvg - earlierAvg;
    const pctChange = earlierAvg > 0 ? Math.round((diff / earlierAvg) * 100) : 0;
    return {
      direction: diff > 2 ? 'up' : diff < -2 ? 'down' : 'stable',
      diff: Math.round(diff),
      pctChange,
      recentAvg: Math.round(recentAvg),
      earlierAvg: Math.round(earlierAvg),
    };
  }, [scores]);

  // Insights
  const insights = useMemo(() => {
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const bestTopic = Object.entries(typeScores).sort((a, b) => b[1].total / b[1].count - a[1].total / a[1].count)[0];
    const worstTopic = Object.entries(typeScores).sort((a, b) => a[1].total / a[1].count - b[1].total / b[1].count)[0];

    return hasData
      ? [
          bestTopic
            ? {
                icon: '🎯',
                bg: 'bg-emerald-500/10',
                title: `Strong in ${bestTopic[0]}`,
                desc: `${Math.round(bestTopic[1].total / bestTopic[1].count)}% average. Keep it up!`,
              }
            : null,
          worstTopic && worstTopic[0] !== bestTopic?.[0]
            ? {
                icon: '⚠️',
                bg: 'bg-amber-500/10',
                title: `Improve ${worstTopic[0]}`,
                desc: `${Math.round(worstTopic[1].total / worstTopic[1].count)}% average. Focus more on this area.`,
              }
            : null,
          {
            icon: '📊',
            bg: 'bg-sky-500/10',
            title: 'Overall Score',
            desc: `${avgScore}% average across ${activities.length} activities.`,
          },
        ].filter(Boolean)
      : [
          {
            icon: '🚀',
            bg: 'bg-indigo-500/10',
            title: 'Get Started',
            desc: 'Complete your first activity to see personalized insights here.',
          },
          {
            icon: '💡',
            bg: 'bg-amber-500/10',
            title: 'Tip',
            desc: 'Try a coding challenge or generate an exam to begin tracking your progress.',
          },
        ];
  }, [hasData, scores, typeScores, activities.length]);

  return {
    loading: loading || analyticsLoading,
    revalidating: revalidating || analyticsRevalidating,
    hasData,
    // Recharts-ready data
    scoreTrendData,
    topicData,
    scoreDistribution,
    scoreRangeData,
    scatterData,
    // Raw data
    activities,
    scoredActivities,
    scores,
    // Deep topic analytics
    deepTopicEntries,
    deepTopicLabels,
    deepTopicValues,
    deepTopicCounts,
    weakTopics,
    strongTopics,
    // Insights
    insights,
    // Controls
    error,
    refetch,
    datePreset,
    setDatePreset,
    // Difficulty breakdown
    easyScores,
    medScores,
    hardScores,
    mixedScores,
    unratedScores,
    // Duration analytics
    avgDuration,
    avgDurationByType,
    activitiesWithDuration,
    // Trend
    trend,
    // Streak
    streak,
    // Deep analytics
    funnelData,
    questionPerformance,
    difficultyPerformance,
    weeklyRetention,
    recommendations,
  };
}
