'use client';
import { useMemo } from 'react';
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

/**
 * Custom hook that fetches activities and computes all analytics data.
 * Returns loading state, derived metrics, chart configs, and insight cards data.
 */
export function useAnalytics() {
  const {
    data: activitiesData,
    loading,
    revalidating,
  } = useCachedFetch('/api/activities?limit=50', {
    ttl: 60_000,
    selector: (json) => json.activities || [],
  });
  const activities = activitiesData || [];

  const { theme } = useTheme();
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

  // Difficulty-based scores
  const easyScores = useMemo(
    () =>
      activities.filter((a) => a.details?.difficulty === 'easy' || (a.totalMarks > 0 && a.score / a.totalMarks >= 0.8)),
    [activities]
  );
  const medScores = useMemo(
    () =>
      activities.filter(
        (a) =>
          a.details?.difficulty === 'medium' ||
          (a.totalMarks > 0 && a.score / a.totalMarks >= 0.5 && a.score / a.totalMarks < 0.8)
      ),
    [activities]
  );
  const hardScores = useMemo(
    () =>
      activities.filter((a) => a.details?.difficulty === 'hard' || (a.totalMarks > 0 && a.score / a.totalMarks < 0.5)),
    [activities]
  );

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
            data: hasData ? [easyScores.length, medScores.length, hardScores.length] : [1, 1, 1],
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
    [hasData, easyScores.length, medScores.length, hardScores.length, chartColors]
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
  };
}
