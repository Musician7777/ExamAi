'use client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import { CustomTooltipStyle } from './chartTheme';

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
  deepTopicEntries,
  deepTopicLabels,
  deepTopicValues,
  deepTopicCounts,
  weakTopics,
  strongTopics,
  resolvedColors,
}) {
  if (deepTopicEntries.length === 0) return null;

  // Build Recharts data arrays
  const topicAccuracyData = deepTopicLabels.map((label, i) => ({
    topic: label.length > 20 ? label.slice(0, 18) + '…' : label,
    accuracy: deepTopicValues[i],
    fill: deepTopicValues[i] >= 75 ? '#4ade80' : deepTopicValues[i] >= 50 ? '#fbbf24' : '#f87171',
  }));

  const practiceDistData = deepTopicLabels.map((label, i) => ({
    name: label.length > 15 ? label.slice(0, 13) + '…' : label,
    value: deepTopicCounts[i],
    fill: PALETTE[i % PALETTE.length],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">
          Topic-wise <span className="gradient-text">Deep Analytics</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Breakdown by specific topics for actionable insights.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Topic Accuracy Horizontal Bar */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="font-semibold text-base">Topic Accuracy</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Accuracy percentage per topic</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topicAccuracyData} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={resolvedColors?.border || 'rgba(99, 102, 241, 0.12)'}
                  opacity={0.3}
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: resolvedColors?.mutedFg || '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="topic"
                  tick={{ fontSize: 11, fill: resolvedColors?.mutedFg || '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  width={100}
                />
                <Tooltip contentStyle={CustomTooltipStyle} formatter={(value) => [`${value}%`, 'Accuracy']} />
                <Bar dataKey="accuracy" name="Accuracy" radius={[0, 6, 6, 0]} maxBarSize={24}>
                  {topicAccuracyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Practice Distribution Pie */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="font-semibold text-base">Practice Distribution</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Activity count per topic</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={practiceDistData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  strokeWidth={0}
                >
                  {practiceDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={CustomTooltipStyle} formatter={(value, name) => [`${value} activities`, name]} />
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

      {/* Topic Detail Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {deepTopicEntries.map(([topic, data]) => {
          const avg = Math.round(data.total / data.count);
          const isWeak = avg < 50;
          const isStrong = avg >= 75;
          return (
            <Card
              key={topic}
              className={cn(
                'p-4 space-y-2 transition-all hover:shadow-md',
                isWeak ? 'border-red-500/20' : isStrong ? 'border-emerald-500/20' : ''
              )}
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
    </div>
  );
}
