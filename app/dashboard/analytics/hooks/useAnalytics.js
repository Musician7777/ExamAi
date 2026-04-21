'use client';
import { useMemo, useState } from 'react';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useCachedFetch } from '@/hooks/useCachedFetch';

/**
 * Reads theme-aware CSS variable values from the document root
 * and returns a chartColors object suitable for Chart.js configs.
 */
function getThemeChartColors() {
  if (typeof document === 'undefined') {
    return {
      primary: '#6366f1',
      primaryBg: 'rgba(99,102,241,0.1)',
      grid: 'rgba(99,102,241,0.08)',
      tick: '#64748b',
      label: '#94a3b8',
    };
  }
  const style = getComputedStyle(document.documentElement);
  const primary = style.getPropertyValue('--color-primary')?.trim() || '#6366f1';
  const muted = style.getPropertyValue('--color-muted-foreground')?.trim() || '#64748b';
  const border = style.getPropertyValue('--color-border')?.trim() || 'rgba(99,102,241,0.08)';
  const primaryBg = primary.startsWith('#') ? `${primary}1a` : primary.replace(/[\d.]+\)$/, '0.1)');
  const gridBg = border.startsWith('#') ? `${border}14` : border.replace(/[\d.]+\)$/, '0.08)');
  return { primary, primaryBg, grid: gridBg, tick: muted, label: muted };
}

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
 * Returns loading state, derived metrics, chart configs, and insight cards data.
 */
export function useAnalytics() {
  const [datePreset, setDatePreset] = useState('30d');
  const { dateFrom, dateTo } = useMemo(() => getPresetDates(datePreset), [datePreset]);

  // Build the URL with date range params.
  // NOTE: limit=1000 is a pragmatic cap — for very active users this may still truncate.
  // A proper fix would be server-side aggregation or paginated fetching.
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

  const { theme } = useTheme();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const chartColors = useMemo(() => getThemeChartColors(), [theme]);

  const hasData = activities.length > 0;
  const scores = useMemo(
    () =>
      activities
        .filter((a) => a.totalMarks > 0)
        .map((a) => Math.round((a.score / a.totalMarks) * 100))
        .reverse(),
    [activities]
  );
  const labels = useMemo(() => scores.map((_, i) => `Activity ${i + 1}`), [scores]);

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

  // Difficulty-based breakdown — uses ONLY the explicit difficulty field
  const easyScores = useMemo(() => activities.filter((a) => a.difficulty === 'easy'), [activities]);
  const medScores = useMemo(() => activities.filter((a) => a.difficulty === 'medium'), [activities]);
  const hardScores = useMemo(() => activities.filter((a) => a.difficulty === 'hard'), [activities]);
  const mixedScores = useMemo(() => activities.filter((a) => a.difficulty === 'mixed'), [activities]);
  const unratedScores = useMemo(() => activities.filter((a) => !a.difficulty), [activities]);

  // Score-based performance bands (independent of difficulty)
  const highScoreCount = useMemo(() => scores.filter((s) => s >= 80).length, [scores]);
  const midScoreCount = useMemo(() => scores.filter((s) => s >= 50 && s < 80).length, [scores]);
  const lowScoreCount = useMemo(() => scores.filter((s) => s < 50).length, [scores]);

  // Duration analytics — time-based metrics from the duration field (seconds)
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

  // Scatter: time vs accuracy — each point is { x: duration (seconds), y: score % }
  const scatterConfig = useMemo(
    () => ({
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Time vs Accuracy',
            data: activitiesWithDuration.map((a) => ({
              x: a.duration,
              y: Math.round((a.score / a.totalMarks) * 100),
            })),
            backgroundColor: chartColors.primaryBg,
            borderColor: chartColors.primary,
            pointRadius: 6,
            pointHoverRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const mins = Math.floor(ctx.parsed.x / 60);
                const secs = ctx.parsed.x % 60;
                return `${mins}m ${secs}s → ${ctx.parsed.y}%`;
              },
            },
          },
        },
        scales: {
          x: {
            title: { display: true, text: 'Time (seconds)', color: chartColors.label, font: { size: 11 } },
            ticks: {
              color: chartColors.tick,
              callback: (val) => {
                const m = Math.floor(val / 60);
                const s = val % 60;
                return m > 0 ? `${m}m` : `${s}s`;
              },
            },
            grid: { color: chartColors.grid },
          },
          y: {
            min: 0,
            max: 100,
            title: { display: true, text: 'Score %', color: chartColors.label, font: { size: 11 } },
            ticks: { color: chartColors.tick },
            grid: { color: chartColors.grid },
          },
        },
      },
    }),
    [activitiesWithDuration, chartColors]
  );

  // Trend indicators — compare recent half vs earlier half of activities
  const trend = useMemo(() => {
    if (scores.length < 4) return null;
    const mid = Math.floor(scores.length / 2);
    const earlier = scores.slice(0, mid);
    const recent = scores.slice(mid);
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const diff = recentAvg - earlierAvg;
    const pctChange = earlierAvg > 0 ? Math.round((diff / earlierAvg) * 100) : 0;
    // ±2% threshold to avoid labeling minor noise as trending
    return {
      direction: diff > 2 ? 'up' : diff < -2 ? 'down' : 'stable',
      diff: Math.round(diff),
      pctChange,
      recentAvg: Math.round(recentAvg),
      earlierAvg: Math.round(earlierAvg),
    };
  }, [scores]);

  // Chart configs
  const lineConfig = useMemo(
    () => ({
      type: 'line',
      data: {
        labels: hasData ? labels : ['No data'],
        datasets: [
          {
            label: 'Score %',
            data: hasData ? scores : [0],
            borderColor: chartColors.primary,
            backgroundColor: chartColors.primaryBg,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: chartColors.primary,
            pointRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { min: 0, max: 100, ticks: { color: chartColors.tick }, grid: { color: chartColors.grid } },
          x: { ticks: { color: chartColors.tick }, grid: { display: false } },
        },
      },
    }),
    [hasData, labels, scores, chartColors]
  );

  const radarConfig = useMemo(
    () => ({
      type: 'radar',
      data: {
        labels: topicLabels,
        datasets: [
          {
            label: 'Accuracy',
            data: topicValues,
            borderColor: chartColors.primary,
            backgroundColor: chartColors.primaryBg,
            pointBackgroundColor: chartColors.primary,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: { color: chartColors.tick, stepSize: 25 },
            grid: { color: chartColors.grid },
            pointLabels: { color: chartColors.label, font: { size: 12 } },
          },
        },
      },
    }),
    [topicLabels, topicValues, chartColors]
  );

  const barConfig = useMemo(
    () => ({
      type: 'bar',
      data: {
        labels: hasData ? ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'] : ['No data'],
        datasets: [
          {
            label: 'Activities',
            data: hasData
              ? [
                  scores.filter((s) => s <= 20).length,
                  scores.filter((s) => s > 20 && s <= 40).length,
                  scores.filter((s) => s > 40 && s <= 60).length,
                  scores.filter((s) => s > 60 && s <= 80).length,
                  scores.filter((s) => s > 80).length,
                ]
              : [0],
            backgroundColor: ['#ef4444', '#f59e0b', '#6366f1', '#22c55e', '#4ade80'],
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { ticks: { color: chartColors.tick, stepSize: 1 }, grid: { color: chartColors.grid } },
          x: { ticks: { color: chartColors.tick }, grid: { display: false } },
        },
      },
    }),
    [hasData, scores, chartColors]
  );

  const doughnutConfig = useMemo(
    () => ({
      type: 'doughnut',
      data: {
        labels: ['High (80%+)', 'Medium (50-79%)', 'Low (<50%)'],
        datasets: [
          {
            data: hasData ? [highScoreCount, midScoreCount, lowScoreCount] : [1, 1, 1],
            backgroundColor: hasData ? ['#4ade80', '#fbbf24', '#f87171'] : ['#334155', '#334155', '#334155'],
            borderWidth: 0,
            spacing: 4,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: chartColors.label, padding: 16, font: { size: 12 } },
          },
        },
        cutout: '65%',
      },
    }),
    [hasData, highScoreCount, midScoreCount, lowScoreCount, chartColors]
  );

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
    loading,
    hasData,
    chartColors,
    lineConfig,
    radarConfig,
    barConfig,
    doughnutConfig,
    deepTopicEntries,
    deepTopicLabels,
    deepTopicValues,
    deepTopicCounts,
    weakTopics,
    strongTopics,
    insights,
    revalidating,
    error,
    refetch,
    datePreset,
    setDatePreset,
    // Difficulty breakdown (explicit field only)
    easyScores,
    medScores,
    hardScores,
    mixedScores,
    unratedScores,
    // Score bands
    highScoreCount,
    midScoreCount,
    lowScoreCount,
    // Duration analytics
    avgDuration,
    avgDurationByType,
    activitiesWithDuration,
    scatterConfig,
    // Trend
    trend,
  };
}
