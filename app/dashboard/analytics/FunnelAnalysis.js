'use client';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Funnel Analysis Component
 * Shows user journey: exam start → in progress → completed → reviewed
 * with conversion rates between each stage
 */
export default function FunnelAnalysis({ funnelData }) {
  if (!funnelData) return null;

  const { started, completed, abandoned, reviewed, completionRate, abandonRate, totalSessions } = funnelData;

  const stages = [
    { label: 'Started', value: started, icon: '🚀', color: 'bg-indigo-500', bgColor: 'bg-indigo-500/10' },
    { label: 'Completed', value: completed, icon: '✅', color: 'bg-emerald-500', bgColor: 'bg-emerald-500/10' },
    { label: 'Reviewed', value: reviewed, icon: '📖', color: 'bg-sky-500', bgColor: 'bg-sky-500/10' },
  ];

  const getConversionRate = (from, to) => {
    if (from === 0) return 0;
    return Math.round((to / from) * 100);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-base">Exam Funnel Analysis</h3>
          <p className="text-xs text-muted-foreground mt-1">Track your exam journey from start to completion</p>
        </div>
        <div className="text-right">
          <div className={cn('text-2xl font-bold', completionRate >= 60 ? 'text-emerald-500' : 'text-red-500')}>
            {completionRate}%
          </div>
          <div className="text-xs text-muted-foreground">Completion Rate</div>
        </div>
      </div>

      {/* Funnel visualization — trapezoid-style bars */}
      <div className="space-y-3 mb-6">
        {stages.map((stage, idx) => {
          const maxValue = Math.max(...stages.map((s) => s.value), 1);
          const widthPercent = stage.value > 0 ? Math.max((stage.value / maxValue) * 100, 20) : 0;
          const prevStage = idx > 0 ? stages[idx - 1] : null;
          const conversionRate = prevStage ? getConversionRate(prevStage.value, stage.value) : null;

          return (
            <div key={stage.label} className="relative">
              {/* Conversion rate indicator */}
              {conversionRate !== null && (
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs">
                  <div
                    className={cn(
                      'flex items-center gap-1 px-2 py-0.5 rounded-full',
                      conversionRate >= 50 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                    )}
                  >
                    {conversionRate >= 50 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    <span className="font-medium">{conversionRate}%</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="w-20 text-xs text-muted-foreground text-right">{stage.label}</div>
                <div className="flex-1">
                  <div
                    className={cn(
                      'h-10 rounded-lg transition-all duration-500 flex items-center justify-between px-4',
                      stage.color
                    )}
                    style={{ width: `${widthPercent}%` }}
                  >
                    <span className="text-white text-sm font-medium flex items-center gap-2">
                      <span>{stage.icon}</span>
                      <span>{stage.value}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
        <div className={cn('p-3 rounded-lg text-center', 'bg-indigo-500/10')}>
          <div className="text-xl font-bold text-indigo-500">{totalSessions}</div>
          <div className="text-xs text-muted-foreground">Total Sessions</div>
        </div>
        <div className={cn('p-3 rounded-lg text-center', completionRate >= 60 ? 'bg-emerald-500/10' : 'bg-red-500/10')}>
          <div className={cn('text-xl font-bold', completionRate >= 60 ? 'text-emerald-500' : 'text-red-500')}>
            {completionRate}%
          </div>
          <div className="text-xs text-muted-foreground">Completion</div>
        </div>
        <div className={cn('p-3 rounded-lg text-center', abandonRate <= 20 ? 'bg-emerald-500/10' : 'bg-amber-500/10')}>
          <div className={cn('text-xl font-bold', abandonRate <= 20 ? 'text-emerald-500' : 'text-amber-500')}>
            {abandonRate}%
          </div>
          <div className="text-xs text-muted-foreground">Abandoned</div>
        </div>
        <div className="p-3 rounded-lg text-center bg-sky-500/10">
          <div className="text-xl font-bold text-sky-500">{reviewed}</div>
          <div className="text-xs text-muted-foreground">Reviews</div>
        </div>
      </div>
    </Card>
  );
}
