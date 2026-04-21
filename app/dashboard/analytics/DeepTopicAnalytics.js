'use client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import LazyChartCanvas from '@/app/components/ChartCanvas/LazyChartCanvas';

const PALETTE = [
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#c084fc',
  '#7c3aed',
  '#4ade80',
  '#fbbf24',
  '#f87171',
  '#38bdf8',
  '#fb923c',
];

export default function DeepTopicAnalytics({
  chartColors,
  deepTopicEntries,
  deepTopicLabels,
  deepTopicValues,
  deepTopicCounts,
  weakTopics,
  strongTopics,
}) {
  if (deepTopicEntries.length === 0) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">
          🎯 Topic-wise <span className="gradient-text">Deep Analytics</span>
        </h2>
        <p className="text-muted-foreground mt-1">Breakdown by specific topics for actionable insights.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">📊 Topic Accuracy</h3>
          <div className="h-64">
            <LazyChartCanvas
              config={{
                type: 'bar',
                data: {
                  labels: deepTopicLabels.length > 0 ? deepTopicLabels : ['No data'],
                  datasets: [
                    {
                      label: 'Accuracy %',
                      data: deepTopicValues.length > 0 ? deepTopicValues : [0],
                      backgroundColor: deepTopicValues.map((v) =>
                        v >= 75 ? '#4ade80' : v >= 50 ? '#fbbf24' : '#f87171'
                      ),
                      borderRadius: 6,
                    },
                  ],
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: 'y',
                  plugins: { legend: { display: false } },
                  scales: {
                    x: {
                      min: 0,
                      max: 100,
                      ticks: { color: chartColors.tick },
                      grid: { color: chartColors.grid },
                    },
                    y: {
                      ticks: { color: chartColors.tick, font: { size: 11 } },
                      grid: { display: false },
                    },
                  },
                },
              }}
            />
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-4">📈 Practice Distribution</h3>
          <div className="h-64">
            <LazyChartCanvas
              config={{
                type: 'doughnut',
                data: {
                  labels: deepTopicLabels.length > 0 ? deepTopicLabels : ['No data'],
                  datasets: [
                    {
                      data: deepTopicCounts.length > 0 ? deepTopicCounts : [1],
                      backgroundColor:
                        deepTopicLabels.length > 0
                          ? deepTopicLabels.map((_, i) => PALETTE[i % PALETTE.length])
                          : ['#334155'],
                      borderWidth: 0,
                      spacing: 3,
                      borderRadius: 4,
                    },
                  ],
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: { color: chartColors.label, padding: 12, font: { size: 11 } },
                    },
                  },
                  cutout: '60%',
                },
              }}
            />
          </div>
        </Card>
      </div>

      {/* Topic Detail Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {deepTopicEntries.map(([topic, data]) => {
          const avg = Math.round(data.total / data.count);
          const isWeak = avg < 50;
          const isStrong = avg >= 75;
          return (
            <Card
              key={topic}
              className={cn('p-4 space-y-2', isWeak ? 'border-destructive/20' : isStrong ? 'border-success/20' : '')}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{topic}</span>
                <Badge variant={isWeak ? 'destructive' : isStrong ? 'success' : 'warning'} className="text-[10px]">
                  {isWeak ? 'Weak' : isStrong ? 'Strong' : 'Average'}
                </Badge>
              </div>
              <Progress value={avg} className="h-1.5" aria-label={`${topic}: ${avg}%`} />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{avg}% accuracy</span>
                <span>
                  {data.count} attempt{data.count !== 1 ? 's' : ''}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Actionable Insights */}
      {(weakTopics.length > 0 || strongTopics.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {weakTopics.length > 0 && (
            <Card className="p-5 border-destructive/20">
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">🔴 Needs Improvement</h3>
              <div className="space-y-2">
                {weakTopics.map((t) => (
                  <div key={t.name} className="flex items-center justify-between text-sm">
                    <span>{t.name}</span>
                    <span className="text-destructive font-semibold">{t.avg}%</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {strongTopics.length > 0 && (
            <Card className="p-5 border-success/20">
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">🟢 Your Strengths</h3>
              <div className="space-y-2">
                {strongTopics.map((t) => (
                  <div key={t.name} className="flex items-center justify-between text-sm">
                    <span>{t.name}</span>
                    <span className="text-success font-semibold">{t.avg}%</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
