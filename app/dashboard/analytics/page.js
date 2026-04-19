'use client';
import { Card } from '@/components/ui/card';
import ChartCanvas from '@/app/components/ChartCanvas/ChartCanvas';
import AnalyticsLoadingSkeleton from './AnalyticsLoadingSkeleton';
import DeepTopicAnalytics from './DeepTopicAnalytics';
import InsightCards from './InsightCards';
import { useAnalytics } from './hooks/useAnalytics';
import { RefreshShimmer } from '@/components/ui/refresh-shimmer';

export default function AnalyticsPage() {
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
  } = useAnalytics();

  if (loading) {
    return <AnalyticsLoadingSkeleton />;
  }

  return (
    <div className="space-y-8 relative">
      <RefreshShimmer active={revalidating} />
      <div>
        <h1 className="text-2xl font-bold">
          📊 Performance <span className="gradient-text">Analytics</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          {hasData
            ? 'Track your progress, identify weak areas, and improve.'
            : 'Complete activities to see your performance analytics here.'}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="md:col-span-2 p-6">
          <h3 className="font-semibold mb-4">📈 Score Trend</h3>
          <div className="h-64">
            <ChartCanvas config={lineConfig} />
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-4">🎯 Topic-wise Accuracy</h3>
          <div className="h-64">
            <ChartCanvas config={radarConfig} />
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-4">📊 Score Distribution</h3>
          <div className="h-64">
            <ChartCanvas config={barConfig} />
          </div>
        </Card>
        <Card className="md:col-span-2 p-6">
          <h3 className="font-semibold mb-4">🎚️ Performance Breakdown</h3>
          <div className="h-64 max-w-[350px] mx-auto">
            <ChartCanvas config={doughnutConfig} />
          </div>
        </Card>
      </div>

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
    </div>
  );
}
