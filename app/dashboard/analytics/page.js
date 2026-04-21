'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, RotateCw, TrendingUp, TrendingDown, Minus, Clock, Flame, Download, FileSpreadsheet } from 'lucide-react';
import LazyChartCanvas from '@/app/components/ChartCanvas/LazyChartCanvas';
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

export default function AnalyticsPage() {
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [activities, setActivities] = useState([]);
  const [studyPlan, setStudyPlan] = useState(null);
  const [studyPlanLoading, setStudyPlanLoading] = useState(false);

  const {
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
    trend,
    easyScores,
    medScores,
    hardScores,
    mixedScores,
    unratedScores,
    avgDuration,
    avgDurationByType,
    activitiesWithDuration,
    scatterConfig,
    streak,
    funnelData,
    questionPerformance,
    difficultyPerformance,
    weeklyRetention,
    recommendations,
  } = useAnalytics();

  // Fetch activities for export - sync with date filter
  useEffect(() => {
    let cancelled = false;
    async function fetchActivities() {
      const params = new URLSearchParams({ limit: '1000', page: '1' });
      if (datePreset !== 'all') {
        const preset = DATE_PRESETS.find((p) => p.key === datePreset);
        if (preset && preset.days) {
          const from = new Date();
          from.setDate(from.getDate() - preset.days);
          params.set('dateFrom', from.toISOString().split('T')[0]);
        }
      }
      try {
        const res = await fetch(`/api/activities?${params.toString()}`);
        const data = await res.json();
        if (!cancelled) {
          setActivities(data.activities || []);
        }
      } catch {
        // Silently fail - export will just use empty data
      }
    }
    fetchActivities();
    return () => {
      cancelled = true;
    };
  }, [datePreset]);

  // Fetch study plan
  useEffect(() => {
    async function fetchStudyPlan() {
      try {
        const res = await fetch('/api/study-plan');
        const data = await res.json();
        if (data.studyPlan) {
          setStudyPlan(data.studyPlan);
        }
      } catch {
        // Silently fail - study plan is optional
      }
    }
    fetchStudyPlan();
  }, []);

  // Update study plan item status
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

  // Regenerate study plan
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

  // Export handlers
  const handleExportAll = () => {
    exportAllAnalyticsCSV({ funnel: funnelData, questionPerformance, difficultyPerformance, weeklyRetention }, activities);
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

  // Date range picker rendered in both error and success states
  const datePicker = (
    <Tabs value={datePreset} onValueChange={setDatePreset}>
      <TabsList>
        {DATE_PRESETS.map((p) => (
          <TabsTrigger key={p.key} value={p.key} className='text-xs px-2.5'>
            {p.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );

  // Export menu button
  const exportButton = (
    <div className='relative'>
      <Button
        variant='outline'
        size='sm'
        onClick={() => setExportMenuOpen(!exportMenuOpen)}
        className='gap-2'
      >
        <Download className='h-4 w-4' />
        Export
      </Button>
      {exportMenuOpen && (
        <div className='absolute right-0 mt-2 w-56 bg-background border rounded-lg shadow-lg z-50'>
          <div className='p-2'>
            <button
              onClick={handleExportAll}
              className='w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary rounded-md transition-colors'
            >
              <FileSpreadsheet className='h-4 w-4' />
              Export All Analytics
            </button>
            <button
              onClick={handleExportActivities}
              className='w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary rounded-md transition-colors'
            >
              <FileSpreadsheet className='h-4 w-4' />
              Export Activities
            </button>
            <button
              onClick={handleExportFunnel}
              className='w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary rounded-md transition-colors'
            >
              <FileSpreadsheet className='h-4 w-4' />
              Export Funnel Data
            </button>
            <button
              onClick={handleExportRetention}
              className='w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary rounded-md transition-colors'
            >
              <FileSpreadsheet className='h-4 w-4' />
              Export Retention Data
            </button>
            <button
              onClick={handleExportQuestionPerformance}
              className='w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary rounded-md transition-colors'
            >
              <FileSpreadsheet className='h-4 w-4' />
              Export Question Performance
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return <AnalyticsLoadingSkeleton />;
  }

  if (error) {
    return (
      <div className='space-y-8'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-bold'>
              📊 Performance <span className='gradient-text'>Analytics</span>
            </h1>
            <p className='text-muted-foreground mt-1'>Something went wrong loading your analytics.</p>
          </div>
          {datePicker}
        </div>
        <Card className='p-8 flex flex-col items-center justify-center gap-4 text-center'>
          <AlertCircle className='h-10 w-10 text-destructive' />
          <p className='text-sm text-muted-foreground max-w-md'>
            Failed to load analytics data. This could be a temporary issue — please try again.
          </p>
          <Button variant='outline' onClick={refetch} className='gap-2'>
            <RotateCw className='h-4 w-4' />
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-8 relative'>
      <RefreshShimmer active={revalidating} />
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold'>
            📊 Performance <span className='gradient-text'>Analytics</span>
          </h1>
          <p className='text-muted-foreground mt-1'>
            {hasData
              ? 'Track your progress, identify weak areas, and improve.'
              : 'Complete activities to see your performance analytics here.'}
          </p>
        </div>
        <div className='flex items-center gap-3'>
          {exportButton}
          {datePicker}
        </div>
      </div>

      {/* Trend indicator banner */}
      {trend && (
        <Card
          className={`p-4 flex items-center gap-3 border-l-4 ${
            trend.direction === 'up'
              ? 'border-l-emerald-500 bg-emerald-500/5'
              : trend.direction === 'down'
                ? 'border-l-red-500 bg-red-500/5'
                : 'border-l-sky-500 bg-sky-500/5'
          }`}
        >
          {trend.direction === 'up' ? (
            <TrendingUp className='h-5 w-5 text-emerald-500 shrink-0' />
          ) : trend.direction === 'down' ? (
            <TrendingDown className='h-5 w-5 text-red-500 shrink-0' />
          ) : (
            <Minus className='h-5 w-5 text-sky-500 shrink-0' />
          )}
          <div className='flex-1 min-w-0'>
            <p className='text-sm font-semibold'>
              {trend.direction === 'up'
                ? 'Performance improving'
                : trend.direction === 'down'
                  ? 'Performance declining'
                  : 'Performance stable'}
            </p>
            <p className='text-xs text-muted-foreground'>
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

      <div className='grid md:grid-cols-2 gap-6'>
        <Card className='md:col-span-2 p-6'>
          <h3 className='font-semibold mb-4'>📈 Score Trend</h3>
          <div className='h-64'>
            <LazyChartCanvas config={lineConfig} />
          </div>
        </Card>
        <Card className='p-6'>
          <h3 className='font-semibold mb-4'>🎯 Topic-wise Accuracy</h3>
          <div className='h-64'>
            <LazyChartCanvas config={radarConfig} />
          </div>
        </Card>
        <Card className='p-6'>
          <h3 className='font-semibold mb-4'>📊 Score Distribution</h3>
          <div className='h-64'>
            <LazyChartCanvas config={barConfig} />
          </div>
        </Card>
        <Card className='md:col-span-2 p-6'>
          <h3 className='font-semibold mb-4'>🎚️ Score Range Breakdown</h3>
          <div className='h-64 max-w-[350px] mx-auto'>
            <LazyChartCanvas config={doughnutConfig} />
          </div>
        </Card>
      </div>

      {/* Streak tracking — only shown when there is streak data */}
      {streak && (
        <Card className='p-6'>
          <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4'>
            <div>
              <h3 className='font-semibold flex items-center gap-2'>
                <Flame className='h-5 w-5 text-orange-500' /> Practice Streak
              </h3>
              <p className='text-xs text-muted-foreground mt-1'>Keep your streak alive by practicing every day!</p>
            </div>
            <div className='flex gap-3 flex-wrap'>
              <div className='rounded-lg bg-orange-500/10 px-4 py-2 text-center'>
                <p className='text-2xl font-bold text-orange-500'>{streak.currentStreak}</p>
                <p className='text-xs text-muted-foreground'>Current Day</p>
              </div>
              <div className='rounded-lg bg-amber-500/10 px-4 py-2 text-center'>
                <p className='text-2xl font-bold text-amber-500'>{streak.longestStreak}</p>
                <p className='text-xs text-muted-foreground'>Best Day</p>
              </div>
              <div className='rounded-lg bg-violet-500/10 px-4 py-2 text-center'>
                <p className='text-2xl font-bold text-violet-500'>{streak.weeklyStreak}</p>
                <p className='text-xs text-muted-foreground'>Current Week</p>
              </div>
              <div className='rounded-lg bg-purple-500/10 px-4 py-2 text-center'>
                <p className='text-2xl font-bold text-purple-500'>{streak.longestWeeklyStreak}</p>
                <p className='text-xs text-muted-foreground'>Best Week</p>
              </div>
              <div className='rounded-lg bg-sky-500/10 px-4 py-2 text-center'>
                <p className='text-2xl font-bold text-sky-500'>{streak.totalActiveDays}</p>
                <p className='text-xs text-muted-foreground'>Total Days</p>
              </div>
            </div>
          </div>

          {/* 28-day mini heatmap */}
          <div className='mt-2'>
            <div className='flex items-center gap-1 mb-2'>
              <span className='text-xs text-muted-foreground'>Last 28 days</span>
              <div className='flex items-center gap-1 ml-auto'>
                <span className='text-[10px] text-muted-foreground'>Less</span>
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
                <span className='text-[10px] text-muted-foreground'>More</span>
              </div>
            </div>
            <div className='grid grid-cols-7 gap-1.5'>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <div key={i} className='text-[10px] text-muted-foreground text-center'>
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

      {/* Difficulty breakdown — only shown when at least one activity has a difficulty set */}
      {easyScores.length + medScores.length + hardScores.length + mixedScores.length > 0 && (
        <Card className='p-6'>
          <h3 className='font-semibold mb-4'>🏋️ Difficulty Breakdown</h3>
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
            {[
              { label: 'Easy', count: easyScores.length, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Medium', count: medScores.length, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              { label: 'Hard', count: hardScores.length, color: 'text-red-500', bg: 'bg-red-500/10' },
              { label: 'Mixed', count: mixedScores.length, color: 'text-sky-500', bg: 'bg-sky-500/10' },
            ].map((d) => (
              <div key={d.label} className={`rounded-lg ${d.bg} p-4 text-center`}>
                <p className={`text-2xl font-bold ${d.color}`}>{d.count}</p>
                <p className='text-xs text-muted-foreground mt-1'>{d.label}</p>
              </div>
            ))}
          </div>
          {unratedScores.length > 0 && (
            <p className='text-xs text-muted-foreground mt-3'>
              {unratedScores.length} activit{unratedScores.length === 1 ? 'y' : 'ies'} without a difficulty rating
            </p>
          )}
        </Card>
      )}

      {/* Duration analytics — only shown when at least one activity has duration data */}
      {activitiesWithDuration.length > 0 && (
        <div className='space-y-6'>
          <div>
            <h2 className='text-xl font-bold'>
              ⏱️ Time <span className='gradient-text'>Analytics</span>
            </h2>
            <p className='text-muted-foreground mt-1'>How you spend time and how it relates to your performance.</p>
          </div>

          {/* Avg time stats cards */}
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
            {[
              {
                label: 'Avg Overall',
                value: avgDuration,
              },
              {
                label: 'Avg Exam',
                value: avgDurationByType.exam,
              },
              {
                label: 'Avg Coding',
                value: avgDurationByType.coding,
              },
              {
                label: 'Avg Interview',
                value: avgDurationByType.interview,
              },
            ]
              .filter((d) => d.value != null)
              .map((d) => (
                <div key={d.label} className='rounded-lg bg-sky-500/10 p-4 text-center'>
                  <div className='flex items-center justify-center gap-1.5'>
                    <Clock className='h-4 w-4 text-sky-500' />
                    <p className='text-2xl font-bold text-sky-500'>{formatDuration(d.value)}</p>
                  </div>
                  <p className='text-xs text-muted-foreground mt-1'>{d.label}</p>
                </div>
              ))}
          </div>

          {/* Time vs Accuracy scatter chart */}
          <Card className='p-6'>
            <h3 className='font-semibold mb-4'>📈 Time vs Accuracy</h3>
            <p className='text-xs text-muted-foreground mb-3'>Each dot represents an activity. Hover to see details.</p>
            <div className='h-72'>
              <LazyChartCanvas config={scatterConfig} />
            </div>
          </Card>
        </div>
      )}

      {/* Funnel Analysis */}
      <FunnelAnalysis funnelData={funnelData} />

      {/* Question Performance & Recommendations */}
      <QuestionPerformance
        questionPerformance={questionPerformance}
        difficultyPerformance={difficultyPerformance}
        recommendations={recommendations}
        chartColors={chartColors}
      />

      {/* Cohort Analysis */}
      <CohortAnalysis weeklyRetention={weeklyRetention} chartColors={chartColors} />

      {/* Personalized Study Plan */}
      <StudyPlan
        studyPlan={studyPlan}
        onUpdateItem={handleUpdateStudyPlanItem}
        onRegenerate={handleRegenerateStudyPlan}
        loading={studyPlanLoading}
      />

      <DeepTopicAnalytics
        chartColors={chartColors}
        deepTopicEntries={deepTopicEntries}
        deepTopicLabels={deepTopicLabels}
        deepTopicValues={deepTopicValues}
        deepTopicCounts={deepTopicCounts}
        weakTopics={weakTopics}
        strongTopics={strongTopics}
      />

      <InsightCards insights={insights} />

      {/* Non-intrusive ad placement — only shows when slot is configured */}
      <AdBanner slot={process.env.NEXT_PUBLIC_AD_SLOT_ANALYTICS || ''} format='auto' className='mt-6' />

      {/* Click outside to close export menu */}
      {exportMenuOpen && (
        <div
          className='fixed inset-0 z-40'
          onClick={() => setExportMenuOpen(false)}
        />
      )}
    </div>
  );
}