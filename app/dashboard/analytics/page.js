'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  RotateCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Flame,
  Download,
  FileSpreadsheet,
  BarChart3,
  Target,
  Users,
  Lightbulb,
  Activity,
  Zap,
  Award,
  Timer,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from 'recharts';
import AnalyticsLoadingSkeleton from './AnalyticsLoadingSkeleton';
import DeepTopicAnalytics from './DeepTopicAnalytics';
import InsightCards from './InsightCards';
import FunnelAnalysis from './FunnelAnalysis';
import CohortAnalysis from './CohortAnalysis';
import QuestionPerformance from './QuestionPerformance';
import StudyPlan from './StudyPlan';
import { useAnalytics, DATE_PRESETS } from './hooks/useAnalytics';
import { RefreshShimmer } from '@/components/ui/refresh-shimmer';
import AdBanner from '@/app/components/AdBanner/AdBanner';
import { formatDuration } from '@/lib/utils';
import {
  exportAllAnalyticsCSV,
  exportActivitiesCSV,
  exportFunnelCSV,
  exportRetentionCSV,
  exportQuestionPerformanceCSV,
} from '@/lib/exportAnalytics';

import { resolveChartColors, CustomTooltipStyle } from './chartTheme';

const CHART_COLORS = {
  primary: '#6366f1',
  primaryLight: 'rgba(99, 102, 241, 0.15)',
  emerald: '#4ade80',
  amber: '#fbbf24',
  red: '#f87171',
  sky: '#38bdf8',
  violet: '#8b5cf6',
  orange: '#fb923c',
};

function CustomTooltipContent({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={CustomTooltipStyle}>
      {label && <p className="text-xs font-semibold text-slate-200 mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="text-xs text-slate-300">
          <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
          {entry.name}: {typeof entry.value === 'number' ? entry.value : entry.value}
        </p>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [resolvedColors, setResolvedColors] = useState(() => resolveChartColors());

  // Re-resolve chart colors when theme changes (theme is detected via data attribute on html)
  useEffect(() => {
    const observer = new MutationObserver(() => setResolvedColors(resolveChartColors()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    return () => observer.disconnect();
  }, []);
  const [studyPlan, setStudyPlan] = useState(null);
  const [studyPlanLoading, setStudyPlanLoading] = useState(false);

  const {
    loading,
    hasData,
    scoreTrendData,
    topicData,
    scoreDistribution,
    scoreRangeData,
    scatterData,
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
    trend,
    easyScores,
    medScores,
    hardScores,
    mixedScores,
    unratedScores,
    avgDuration,
    avgDurationByType,
    activitiesWithDuration,
    streak,
    funnelData,
    questionPerformance,
    difficultyPerformance,
    weeklyRetention,
    recommendations,
    scores,
    scoredActivities,
    activities,
  } = useAnalytics();

  useEffect(() => {
    async function fetchStudyPlan() {
      try {
        const res = await fetch('/api/study-plan');
        const data = await res.json();
        if (data.studyPlan) {
          setStudyPlan(data.studyPlan);
        }
      } catch {
        // Silently fail
      }
    }
    fetchStudyPlan();
  }, []);

  const handleUpdateStudyPlanItem = async (itemId, status) => {
    setStudyPlanLoading(true);
    try {
      const res = await fetch('/api/study-plan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_item', itemId, status }),
      });
      const data = await res.json();
      if (data.studyPlan) {
        setStudyPlan(data.studyPlan);
      }
    } catch {
      // Silently fail
    }
    setStudyPlanLoading(false);
  };

  const handleRegenerateStudyPlan = async () => {
    setStudyPlanLoading(true);
    try {
      const res = await fetch('/api/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerate: true }),
      });
      const data = await res.json();
      if (data.studyPlan) {
        setStudyPlan(data.studyPlan);
      }
    } catch {
      // Silently fail
    }
    setStudyPlanLoading(false);
  };

  const handleExportAll = () => {
    exportAllAnalyticsCSV(
      { funnel: funnelData, questionPerformance, difficultyPerformance, weeklyRetention },
      activities
    );
    setExportMenuOpen(false);
  };
  const handleExportActivities = () => {
    exportActivitiesCSV(activities);
    setExportMenuOpen(false);
  };
  const handleExportFunnel = () => {
    exportFunnelCSV(funnelData);
    setExportMenuOpen(false);
  };
  const handleExportRetention = () => {
    exportRetentionCSV(weeklyRetention);
    setExportMenuOpen(false);
  };
  const handleExportQuestionPerformance = () => {
    exportQuestionPerformanceCSV(questionPerformance, difficultyPerformance, []);
    setExportMenuOpen(false);
  };

  const datePicker = (
    <Tabs value={datePreset} onValueChange={setDatePreset}>
      <TabsList className="bg-secondary/50 h-9">
        {DATE_PRESETS.map((p) => (
          <TabsTrigger
            key={p.key}
            value={p.key}
            className="text-xs px-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
          >
            {p.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );

  const exportButton = (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setExportMenuOpen(!exportMenuOpen)}
        className="gap-2 border-dashed"
      >
        <Download className="h-4 w-4" />
        Export
      </Button>
      {exportMenuOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-card border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-1.5">
            {[
              { label: 'Export All Analytics', fn: handleExportAll },
              { label: 'Export Activities', fn: handleExportActivities },
              { label: 'Export Funnel Data', fn: handleExportFunnel },
              { label: 'Export Retention Data', fn: handleExportRetention },
              { label: 'Export Question Performance', fn: handleExportQuestionPerformance },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.fn}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-secondary/80 rounded-lg transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Compute summary stats
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const totalActivities = activities.length;
  const bestScore = scores.length > 0 ? Math.max(...scores) : 0;

  if (loading) {
    return <AnalyticsLoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Performance <span className="gradient-text">Analytics</span>
            </h1>
            <p className="text-muted-foreground mt-1">Something went wrong loading your analytics.</p>
          </div>
          {datePicker}
        </div>
        <Card className="p-8 flex flex-col items-center justify-center gap-4 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="text-sm text-muted-foreground max-w-md">
            Failed to load analytics data. This could be a temporary issue — please try again.
          </p>
          <Button variant="outline" onClick={refetch} className="gap-2">
            <RotateCw className="h-4 w-4" />
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <RefreshShimmer active={revalidating} />

      {/* ── Header ── */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Performance <span className="gradient-text">Analytics</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              {hasData
                ? 'Track your progress, identify weak areas, and improve.'
                : 'Complete activities to see your performance analytics here.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {exportButton}
            {datePicker}
          </div>
        </div>

        {/* ── Summary stat cards ── */}
        {hasData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 border-l-4 border-l-indigo-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-indigo-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight">{avgScore}%</p>
                  <p className="text-xs text-muted-foreground">Avg Score</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 border-l-4 border-l-emerald-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight">{totalActivities}</p>
                  <p className="text-xs text-muted-foreground">Activities</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 border-l-4 border-l-amber-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Award className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight">{bestScore}%</p>
                  <p className="text-xs text-muted-foreground">Best Score</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 border-l-4 border-l-sky-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
                  <Timer className="h-5 w-5 text-sky-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight">{avgDuration ? formatDuration(avgDuration) : '—'}</p>
                  <p className="text-xs text-muted-foreground">Avg Duration</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ── Trend banner ── */}
        {trend && (
          <Card
            className={`p-4 flex items-center gap-3 border-l-4 transition-all ${
              trend.direction === 'up'
                ? 'border-l-emerald-500 bg-emerald-500/5'
                : trend.direction === 'down'
                  ? 'border-l-red-500 bg-red-500/5'
                  : 'border-l-sky-500 bg-sky-500/5'
            }`}
          >
            {trend.direction === 'up' ? (
              <TrendingUp className="h-5 w-5 text-emerald-500 shrink-0" />
            ) : trend.direction === 'down' ? (
              <TrendingDown className="h-5 w-5 text-red-500 shrink-0" />
            ) : (
              <Minus className="h-5 w-5 text-sky-500 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">
                {trend.direction === 'up'
                  ? 'Performance improving'
                  : trend.direction === 'down'
                    ? 'Performance declining'
                    : 'Performance stable'}
              </p>
              <p className="text-xs text-muted-foreground">
                Recent avg: {trend.recentAvg}% · Earlier avg: {trend.earlierAvg}%
                {trend.pctChange !== 0 && (
                  <span className={`ml-1 font-medium ${trend.pctChange > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    ({trend.pctChange > 0 ? '+' : ''}
                    {trend.pctChange}%)
                  </span>
                )}
              </p>
            </div>
            <div
              className={`text-lg font-bold ${
                trend.direction === 'up'
                  ? 'text-emerald-500'
                  : trend.direction === 'down'
                    ? 'text-red-500'
                    : 'text-sky-500'
              }`}
            >
              {trend.diff > 0 ? '+' : ''}
              {trend.diff}%
            </div>
          </Card>
        )}
      </div>

      {/* ── Tab Navigation ── */}
      {hasData && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-secondary/50 h-11 w-full sm:w-auto">
            <TabsTrigger
              value="overview"
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4"
            >
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4"
            >
              <Target className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger
              value="engagement"
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4"
            >
              <Users className="h-4 w-4" />
              Engagement
            </TabsTrigger>
            <TabsTrigger
              value="insights"
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4"
            >
              <Lightbulb className="h-4 w-4" />
              Insights
            </TabsTrigger>
          </TabsList>

          {/* ════════════════════════════════════════════════════════
              TAB 1: OVERVIEW — Score Trend, Radar, Distribution, Pie
              ════════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div className="mt-6 space-y-6">
              {/* Score Trend Area Chart */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-base">Score Trend</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Your score progression over time</p>
                  </div>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={scoreTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={resolvedColors.border} opacity={0.3} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: resolvedColors.mutedFg }}
                        axisLine={false}
                        tickLine={false}
                        angle={-30}
                        textAnchor="end"
                        height={50}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 11, fill: resolvedColors.mutedFg }}
                        axisLine={false}
                        tickLine={false}
                        width={35}
                      />
                      <Tooltip content={<CustomTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke={CHART_COLORS.primary}
                        strokeWidth={2.5}
                        fill="url(#scoreGradient)"
                        dot={{ r: 3, fill: CHART_COLORS.primary, strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: CHART_COLORS.primary, stroke: '#fff', strokeWidth: 2 }}
                        name="Score %"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Topic Accuracy Radar */}
                <Card className="p-6">
                  <div className="mb-4">
                    <h3 className="font-semibold text-base">Topic-wise Accuracy</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Performance across different activity types</p>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={topicData} cx="50%" cy="50%" outerRadius="70%">
                        <PolarGrid stroke={resolvedColors.border} />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: resolvedColors.mutedFg }} />
                        <PolarRadiusAxis
                          domain={[0, 100]}
                          tick={{ fontSize: 10, fill: resolvedColors.mutedFg }}
                          axisLine={false}
                        />
                        <Radar
                          name="Accuracy"
                          dataKey="accuracy"
                          stroke={CHART_COLORS.primary}
                          fill={CHART_COLORS.primary}
                          fillOpacity={0.2}
                          strokeWidth={2}
                        />
                        <Tooltip content={<CustomTooltipContent />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Score Distribution Bar */}
                <Card className="p-6">
                  <div className="mb-4">
                    <h3 className="font-semibold text-base">Score Distribution</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">How your scores are spread across ranges</p>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={scoreDistribution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={resolvedColors.border} opacity={0.3} />
                        <XAxis
                          dataKey="range"
                          tick={{ fontSize: 11, fill: resolvedColors.mutedFg }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: resolvedColors.mutedFg }}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                          width={35}
                        />
                        <Tooltip content={<CustomTooltipContent />} />
                        <Bar dataKey="count" name="Activities" radius={[6, 6, 0, 0]} maxBarSize={60}>
                          {scoreDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              {/* Score Range Pie */}
              <Card className="p-6">
                <div className="mb-4">
                  <h3 className="font-semibold text-base">Score Range Breakdown</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Distribution of high, medium, and low scores</p>
                </div>
                <div className="h-64 max-w-md mx-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={scoreRangeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="value"
                        nameKey="name"
                        strokeWidth={0}
                      >
                        {scoreRangeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name, props) => {
                          const total = scoreRangeData.reduce((s, e) => s + e.value, 0);
                          const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                          return [`${value} activities (${pct}%)`, name];
                        }}
                        contentStyle={CustomTooltipStyle}
                      />
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        iconSize={8}
                        formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════
              TAB 2: PERFORMANCE — Deep Topics, Questions, Difficulty
              ════════════════════════════════════════════════════════ */}
          {activeTab === 'performance' && (
            <div className="mt-6 space-y-6">
              <DeepTopicAnalytics
                deepTopicEntries={deepTopicEntries}
                deepTopicLabels={deepTopicLabels}
                deepTopicValues={deepTopicValues}
                deepTopicCounts={deepTopicCounts}
                weakTopics={weakTopics}
                strongTopics={strongTopics}
                resolvedColors={resolvedColors}
              />

              <QuestionPerformance
                questionPerformance={questionPerformance}
                difficultyPerformance={difficultyPerformance}
                recommendations={recommendations}
                resolvedColors={resolvedColors}
              />

              {/* Difficulty breakdown */}
              {easyScores.length + medScores.length + hardScores.length + mixedScores.length > 0 && (
                <Card className="p-6">
                  <div className="mb-4">
                    <h3 className="font-semibold text-base">Difficulty Breakdown</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Activity distribution by difficulty level</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      {
                        label: 'Easy',
                        count: easyScores.length,
                        color: 'text-emerald-500',
                        bg: 'bg-emerald-500/10',
                        border: 'border-l-emerald-500',
                      },
                      {
                        label: 'Medium',
                        count: medScores.length,
                        color: 'text-amber-500',
                        bg: 'bg-amber-500/10',
                        border: 'border-l-amber-500',
                      },
                      {
                        label: 'Hard',
                        count: hardScores.length,
                        color: 'text-red-500',
                        bg: 'bg-red-500/10',
                        border: 'border-l-red-500',
                      },
                      {
                        label: 'Mixed',
                        count: mixedScores.length,
                        color: 'text-sky-500',
                        bg: 'bg-sky-500/10',
                        border: 'border-l-sky-500',
                      },
                    ].map((d) => (
                      <div key={d.label} className={`rounded-lg ${d.bg} p-4 text-center border-l-4 ${d.border}`}>
                        <p className={`text-2xl font-bold ${d.color}`}>{d.count}</p>
                        <p className="text-xs text-muted-foreground mt-1">{d.label}</p>
                      </div>
                    ))}
                  </div>
                  {unratedScores.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-3">
                      {unratedScores.length} activit{unratedScores.length === 1 ? 'y' : 'ies'} without a difficulty
                      rating
                    </p>
                  )}
                </Card>
              )}

              {/* Time vs Accuracy scatter */}
              {activitiesWithDuration.length > 0 && (
                <Card className="p-6">
                  <div className="mb-4">
                    <h3 className="font-semibold text-base">Time vs Accuracy</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Each dot represents an activity — hover for details
                    </p>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={resolvedColors.border} opacity={0.3} />
                        <XAxis
                          type="number"
                          dataKey="duration"
                          name="Time"
                          tick={{ fontSize: 11, fill: resolvedColors.mutedFg }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(val) => {
                            const m = Math.floor(val / 60);
                            const s = val % 60;
                            return m > 0 ? `${m}m` : `${s}s`;
                          }}
                          label={{
                            value: 'Time',
                            position: 'insideBottom',
                            offset: -5,
                            fontSize: 11,
                            fill: resolvedColors.mutedFg,
                          }}
                        />
                        <YAxis
                          type="number"
                          dataKey="score"
                          name="Score"
                          domain={[0, 100]}
                          tick={{ fontSize: 11, fill: resolvedColors.mutedFg }}
                          axisLine={false}
                          tickLine={false}
                          label={{
                            value: 'Score %',
                            angle: -90,
                            position: 'insideLeft',
                            offset: 10,
                            fontSize: 11,
                            fill: resolvedColors.mutedFg,
                          }}
                          width={45}
                        />
                        <Tooltip
                          cursor={{ strokeDasharray: '3 3' }}
                          formatter={(value, name, props) => {
                            if (name === 'Time') {
                              const m = Math.floor(value / 60);
                              const s = value % 60;
                              return [`${m}m ${s}s`, 'Time'];
                            }
                            return [`${value}%`, 'Score'];
                          }}
                          contentStyle={CustomTooltipStyle}
                        />
                        <Scatter
                          name="Activities"
                          data={scatterData}
                          fill={CHART_COLORS.primary}
                          fillOpacity={0.7}
                          r={5}
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════
              TAB 3: ENGAGEMENT — Streak, Funnel, Cohort, Time, Study Plan
              ════════════════════════════════════════════════════════ */}
          {activeTab === 'engagement' && (
            <div className="mt-6 space-y-6">
              {/* Streak tracking */}
              {streak && (
                <Card className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-semibold text-base flex items-center gap-2">
                        <Flame className="h-5 w-5 text-orange-500" /> Practice Streak
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Keep your streak alive by practicing every day!
                      </p>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      {[
                        {
                          label: 'Current Day',
                          value: streak.currentStreak,
                          color: 'text-orange-500',
                          bg: 'bg-orange-500/10',
                        },
                        {
                          label: 'Best Day',
                          value: streak.longestStreak,
                          color: 'text-amber-500',
                          bg: 'bg-amber-500/10',
                        },
                        {
                          label: 'Current Week',
                          value: streak.weeklyStreak,
                          color: 'text-violet-500',
                          bg: 'bg-violet-500/10',
                        },
                        {
                          label: 'Best Week',
                          value: streak.longestWeeklyStreak,
                          color: 'text-purple-500',
                          bg: 'bg-purple-500/10',
                        },
                        {
                          label: 'Total Days',
                          value: streak.totalActiveDays,
                          color: 'text-sky-500',
                          bg: 'bg-sky-500/10',
                        },
                      ].map((d) => (
                        <div key={d.label} className={`rounded-lg ${d.bg} px-3.5 py-2 text-center`}>
                          <p className={`text-xl font-bold ${d.color}`}>{d.value}</p>
                          <p className="text-[10px] text-muted-foreground">{d.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 28-day mini heatmap */}
                  <div className="mt-2">
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-xs text-muted-foreground">Last 28 days</span>
                      <div className="flex items-center gap-1 ml-auto">
                        <span className="text-[10px] text-muted-foreground">Less</span>
                        {[0, 1, 2, 3].map((level) => (
                          <div
                            key={level}
                            className={`h-3 w-3 rounded-sm ${
                              level === 0
                                ? 'bg-muted/50'
                                : level === 1
                                  ? 'bg-orange-500/25'
                                  : level === 2
                                    ? 'bg-orange-500/50'
                                    : 'bg-orange-500/80'
                            }`}
                          />
                        ))}
                        <span className="text-[10px] text-muted-foreground">More</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                        <div key={i} className="text-[10px] text-muted-foreground text-center">
                          {d}
                        </div>
                      ))}
                      {streak.calendarDays.map((day) => {
                        const level = day.count === 0 ? 0 : day.count <= 1 ? 1 : day.count <= 3 ? 2 : 3;
                        return (
                          <div
                            key={day.date}
                            title={`${day.date}: ${day.count} activit${day.count === 1 ? 'y' : 'ies'}`}
                            aria-label={`${day.date}: ${day.count} activit${day.count === 1 ? 'y' : 'ies'}`}
                            className={`h-5 w-full rounded-sm transition-colors cursor-default ${
                              day.isToday ? 'ring-1 ring-orange-500/50' : ''
                            } ${
                              level === 0
                                ? 'bg-muted/50'
                                : level === 1
                                  ? 'bg-orange-500/25'
                                  : level === 2
                                    ? 'bg-orange-500/50'
                                    : 'bg-orange-500/80'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </Card>
              )}

              {/* Duration analytics */}
              {activitiesWithDuration.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Time <span className="gradient-text">Analytics</span>
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      How you spend time and how it relates to your performance.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Avg Overall', value: avgDuration },
                      { label: 'Avg Exam', value: avgDurationByType.exam },
                      { label: 'Avg Coding', value: avgDurationByType.coding },
                      { label: 'Avg Interview', value: avgDurationByType.interview },
                    ]
                      .filter((d) => d.value != null)
                      .map((d) => (
                        <Card key={d.label} className="p-4 border-l-4 border-l-sky-500">
                          <div className="flex items-center justify-center gap-1.5">
                            <Clock className="h-4 w-4 text-sky-500" />
                            <p className="text-xl font-bold text-sky-500">{formatDuration(d.value)}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 text-center">{d.label}</p>
                        </Card>
                      ))}
                  </div>
                </div>
              )}

              <FunnelAnalysis funnelData={funnelData} />
              <CohortAnalysis weeklyRetention={weeklyRetention} resolvedColors={resolvedColors} />
              <StudyPlan
                studyPlan={studyPlan}
                onUpdateItem={handleUpdateStudyPlanItem}
                onRegenerate={handleRegenerateStudyPlan}
                loading={studyPlanLoading}
              />
            </div>
          )}

          {/* ════════════════════════════════════════════════════════
              TAB 4: INSIGHTS — Insight Cards, Recommendations
              ════════════════════════════════════════════════════════ */}
          {activeTab === 'insights' && (
            <div className="mt-6 space-y-6">
              <InsightCards insights={insights} />

              {/* Weak vs Strong Topics side-by-side */}
              {(weakTopics.length > 0 || strongTopics.length > 0) && (
                <div className="grid sm:grid-cols-2 gap-6">
                  {weakTopics.length > 0 && (
                    <Card className="p-6 border-red-500/20">
                      <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center">
                          <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                        </div>
                        Needs Improvement
                      </h3>
                      <div className="space-y-3">
                        {weakTopics.map((t) => (
                          <div key={t.name} className="flex items-center justify-between">
                            <span className="text-sm">{t.name}</span>
                            <span className="text-sm text-red-500 font-semibold">{t.avg}%</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                  {strongTopics.length > 0 && (
                    <Card className="p-6 border-emerald-500/20">
                      <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <Award className="h-3.5 w-3.5 text-emerald-500" />
                        </div>
                        Your Strengths
                      </h3>
                      <div className="space-y-3">
                        {strongTopics.map((t) => (
                          <div key={t.name} className="flex items-center justify-between">
                            <span className="text-sm">{t.name}</span>
                            <span className="text-sm text-emerald-500 font-semibold">{t.avg}%</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}
        </Tabs>
      )}

      {/* Non-intrusive ad placement */}
      <AdBanner slot={process.env.NEXT_PUBLIC_AD_SLOT_ANALYTICS || ''} format="auto" className="mt-6" />

      {/* Click outside to close export menu */}
      {exportMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setExportMenuOpen(false)} />}
    </div>
  );
}
