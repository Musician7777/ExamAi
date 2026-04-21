'use client';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

import { CustomTooltipStyle } from './chartTheme';

/**
 * Cohort Analysis Component
 * Shows weekly retention metrics and user engagement patterns
 */
export default function CohortAnalysis({ weeklyRetention, resolvedColors }) {
  if (!weeklyRetention || weeklyRetention.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="font-semibold text-base mb-4">Weekly Retention</h3>
        <div className="text-center py-8 text-muted-foreground">
          <span className="text-4xl">📊</span>
          <p className="mt-2">Complete more exams to see retention insights</p>
        </div>
      </Card>
    );
  }

  const avgCompletionRate =
    weeklyRetention.length > 0
      ? Math.round(weeklyRetention.reduce((sum, w) => sum + w.completionRate, 0) / weeklyRetention.length)
      : 0;

  // Build Recharts data
  const chartData = weeklyRetention.map((w) => ({
    week: w.week,
    'Active Days': w.activeDaysCount,
    Sessions: w.sessionsStarted,
    completionRate: w.completionRate,
    weekOverWeekChange: w.weekOverWeekChange,
  }));

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-base">Weekly Retention</h3>
          <p className="text-xs text-muted-foreground mt-1">Your engagement patterns over the past weeks</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-emerald-500">{avgCompletionRate}%</div>
          <div className="text-xs text-muted-foreground">Avg Completion</div>
        </div>
      </div>

      {/* Recharts grouped bar chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={resolvedColors?.border || 'rgba(99, 102, 241, 0.12)'}
              opacity={0.3}
            />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 11, fill: resolvedColors?.mutedFg || '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: resolvedColors?.mutedFg || '#64748b' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={35}
            />
            <Tooltip contentStyle={CustomTooltipStyle} />
            <Legend
              verticalAlign="top"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
            />
            <Bar dataKey="Active Days" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={32} />
            <Bar dataKey="Sessions" fill="#4ade80" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Week-over-week change indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t mt-4">
        {weeklyRetention.map((week, idx) => (
          <div key={week.week} className="text-center">
            <div className="text-sm font-medium">{week.week}</div>
            <div className="text-xs text-muted-foreground">{week.completionRate}% completion</div>
            {idx > 0 && week.weekOverWeekChange !== 0 && (
              <div
                className={cn('text-xs font-medium', week.weekOverWeekChange > 0 ? 'text-emerald-500' : 'text-red-500')}
              >
                {week.weekOverWeekChange > 0 ? '+' : ''}
                {week.weekOverWeekChange}%
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
