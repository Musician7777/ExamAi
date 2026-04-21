/**
 * Utility functions for exporting analytics data as CSV
 */

// Characters that trigger CSV formula injection when at start of cell
const FORMULA_TRIGGER_CHARS = ['=', '+', '-', '@', '\t'];

/**
 * Escape a value for CSV output
 * Prevents formula injection by prepending ' for cells starting with special chars
 */
function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const strValue = String(value);
  const firstChar = strValue.charAt(0);
  // Check if starts with formula-triggering character
  if (FORMULA_TRIGGER_CHARS.includes(firstChar)) {
    return `'${strValue.replace(/'/g, '\"\"')}`;
  }
  // Escape cells with commas, quotes, or newlines
  if (strValue.includes(',') || strValue.includes('\"') || strValue.includes('\n')) {
    return `\"${strValue.replace(/'/g, '\"\"')}\"`;
  }
  return strValue;
}

/**
 * Convert an array of objects to CSV string
 */
export function arrayToCSV(data, columns) {
  if (!data || data.length === 0) return '';

  // Create header row
  const header = columns.map((col) => col.label || col.key).join(',');

  // Create data rows
  const rows = data.map((item) =>
    columns.map((col) => {
      const value = item[col.key];
      return csvEscape(value);
    }).join(',')
  );

  return [header, ...rows].join('\n');
}

/**
 * Trigger browser download of a CSV file
 */
export function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export activities data as CSV
 */
export function exportActivitiesCSV(activities) {
  const columns = [
    { key: 'createdAt', label: 'Date' },
    { key: 'type', label: 'Type' },
    { key: 'title', label: 'Title' },
    { key: 'score', label: 'Score' },
    { key: 'totalMarks', label: 'Total Marks' },
    { key: 'percentage', label: 'Percentage' },
    { key: 'difficulty', label: 'Difficulty' },
    { key: 'duration', label: 'Duration (seconds)' },
    { key: 'tags', label: 'Tags' },
  ];

  const data = activities.map((a) => ({
    createdAt: new Date(a.createdAt).toLocaleDateString(),
    type: a.type || '',
    title: a.title || '',
    score: a.score ?? '',
    totalMarks: a.totalMarks ?? '',
    percentage: a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : '',
    difficulty: a.difficulty || '',
    duration: a.duration || '',
    tags: (a.tags || []).join('; '),
  }));

  const csv = arrayToCSV(data, columns);
  const timestamp = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `analytics_activities_${timestamp}.csv`);
}

/**
 * Export question performance data as CSV
 */
export function exportQuestionPerformanceCSV(questionPerformance, difficultyPerformance, topicPerformance) {
  const sections = [];

  // Question Type Performance
  if (questionPerformance && questionPerformance.length > 0) {
    sections.push('Question Type Performance');
    sections.push('Type,Accuracy %,Total Answered,Avg Time (seconds)');
    questionPerformance.forEach((q) => {
      sections.push(`${csvEscape(q.type)},${q.accuracy},${q.total},${q.avgTimeSeconds}`);
    });
    sections.push('');
  }

  // Difficulty Performance
  if (difficultyPerformance && difficultyPerformance.length > 0) {
    sections.push('Difficulty Performance');
    sections.push('Difficulty,Accuracy %,Total Questions');
    difficultyPerformance.forEach((d) => {
      sections.push(`${csvEscape(d.difficulty)},${d.accuracy},${d.total}`);
    });
    sections.push('');
  }

  // Topic Performance
  if (topicPerformance && topicPerformance.length > 0) {
    sections.push('Topic Performance');
    sections.push('Topic,Accuracy %,Total Attempts,Avg Time (seconds)');
    topicPerformance.forEach((t) => {
      sections.push(`${csvEscape(t.topic)},${t.accuracy},${t.total},${t.avgTimeSeconds}`);
    });
  }

  const csv = sections.join('\n');
  const timestamp = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `analytics_question_performance_${timestamp}.csv`);
}

/**
 * Export funnel analysis data as CSV
 */
export function exportFunnelCSV(funnelData) {
  if (!funnelData) return;

  const data = [
    { stage: 'Started', value: funnelData.started || 0 },
    { stage: 'In Progress', value: funnelData.started || 0 },
    { stage: 'Completed', value: funnelData.completed || 0 },
    { stage: 'Abandoned', value: funnelData.abandoned || 0 },
    { stage: 'Reviewed', value: funnelData.reviewed || 0 },
    { stage: 'Completion Rate (%)', value: funnelData.completionRate || 0 },
    { stage: 'Abandon Rate (%)', value: funnelData.abandonRate || 0 },
    { stage: 'Total Sessions', value: funnelData.totalSessions || 0 },
  ];

  const columns = [
    { key: 'stage', label: 'Stage' },
    { key: 'value', label: 'Value' },
  ];

  const csv = arrayToCSV(data, columns);
  const timestamp = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `analytics_funnel_${timestamp}.csv`);
}

/**
 * Export weekly retention data as CSV
 */
export function exportRetentionCSV(weeklyRetention) {
  if (!weeklyRetention || weeklyRetention.length === 0) return;

  const columns = [
    { key: 'week', label: 'Week' },
    { key: 'activeDaysCount', label: 'Active Days' },
    { key: 'sessionsStarted', label: 'Sessions Started' },
    { key: 'examsCompleted', label: 'Exams Completed' },
    { key: 'completionRate', label: 'Completion Rate (%)' },
    { key: 'weekOverWeekChange', label: 'Week-over-Week Change' },
  ];

  const csv = arrayToCSV(weeklyRetention, columns);
  const timestamp = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `analytics_retention_${timestamp}.csv`);
}

/**
 * Export all analytics as a comprehensive CSV
 */
export function exportAllAnalyticsCSV(analyticsData, activities) {
  const timestamp = new Date().toISOString().split('T')[0];
  const sections = [];

  // Summary
  sections.push('ANALYTICS SUMMARY');
  sections.push(`Generated,${new Date().toLocaleString()}`);
  sections.push('');

  // Funnel Summary
  if (analyticsData?.funnel) {
    const f = analyticsData.funnel;
    sections.push('FUNNEL ANALYSIS');
    sections.push(`Total Sessions,${f.totalSessions || 0}`);
    sections.push(`Started,${f.started || 0}`);
    sections.push(`Completed,${f.completed || 0}`);
    sections.push(`Abandoned,${f.abandoned || 0}`);
    sections.push(`Completion Rate,${f.completionRate || 0}%`);
    sections.push(`Abandon Rate,${f.abandonRate || 0}%`);
    sections.push('');
  }

  // Question Performance
  if (analyticsData?.questionPerformance?.length > 0) {
    sections.push('QUESTION TYPE PERFORMANCE');
    sections.push('Type,Accuracy %,Total,Avg Time (s)');
    analyticsData.questionPerformance.forEach((q) => {
      sections.push(`${csvEscape(q.type)},${q.accuracy},${q.total},${q.avgTimeSeconds}`);
    });
    sections.push('');
  }

  // Difficulty Performance
  if (analyticsData?.difficultyPerformance?.length > 0) {
    sections.push('DIFFICULTY PERFORMANCE');
    sections.push('Difficulty,Accuracy %,Total');
    analyticsData.difficultyPerformance.forEach((d) => {
      sections.push(`${csvEscape(d.difficulty)},${d.accuracy},${d.total}`);
    });
    sections.push('');
  }

  // Topic Performance
  if (analyticsData?.topicPerformance?.length > 0) {
    sections.push('TOPIC PERFORMANCE');
    sections.push('Topic,Accuracy %,Attempts,Avg Time (s)');
    analyticsData.topicPerformance.forEach((t) => {
      sections.push(`${csvEscape(t.topic)},${t.accuracy},${t.total},${t.avgTimeSeconds}`);
    });
    sections.push('');
  }

  // Weekly Retention
  if (analyticsData?.weeklyRetention?.length > 0) {
    sections.push('WEEKLY RETENTION');
    sections.push('Week,Active Days,Sessions,Exams,Completion %,Change');
    analyticsData.weeklyRetention.forEach((w) => {
      sections.push(
        `${csvEscape(w.week)},${w.activeDaysCount},${w.sessionsStarted},${w.examsCompleted},${w.completionRate},${w.weekOverWeekChange}`
      );
    });
    sections.push('');
  }

  // Activities
  if (activities && activities.length > 0) {
    sections.push('ACTIVITIES');
    sections.push('Date,Type,Title,Score,Total Marks,Percentage,Difficulty,Duration,Tags');
    activities.forEach((a) => {
      const row = [
        new Date(a.createdAt).toLocaleDateString(),
        csvEscape(a.type),
        csvEscape(a.title).replace(/,/g, ';'),
        a.score ?? '',
        a.totalMarks ?? '',
        a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : '',
        csvEscape(a.difficulty),
        a.duration || '',
        (a.tags || []).join(';'),
      ].join(',');
      sections.push(row);
    });
  }

  const csv = sections.join('\n');
  downloadCSV(csv, `analytics_full_export_${timestamp}.csv`);
}