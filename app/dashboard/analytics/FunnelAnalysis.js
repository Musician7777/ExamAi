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

  const { started, paused, completed, abandoned, reviewed, completionRate, abandonRate, totalSessions } = funnelData;

  // Calculate stages - in_progress represents sessions that started but not completed/abandoned
  const inProgress = started; // Sessions with status 'in_progress' are in progress
  const stages = [
    { label: 'Started', value: started, icon: '🚀', color: 'bg-indigo-500' },
    { label: 'In Progress', value: inProgress, icon: '⏳', color: 'bg-amber-500' },
    { label: 'Completed', value: completed, icon: '✅', color: 'bg-emerald-500' },
    { label: 'Reviewed', value: reviewed, icon: '📖', color: 'bg-sky-500' },
  ];

  // Calculate conversion rates between stages
  const getConversionRate = (from, to) => {
    if (from === 0) return 0;
    return Math.round((to / from) * 100);
  };

  return (
    <Card className='p-6'>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h3 className='font-semibold text-lg'>📊 Exam Funnel Analysis</h3>
          <p className='text-sm text-muted-foreground mt-1'>
            Track your exam journey from start to completion
          </p>
        </div>
        <div className='text-right'>
          <div className={cn('text-2xl font-bold', completionRate >= 60 ? 'text-success' : 'text-destructive')}>
            {completionRate}%
          </div>
          <div className='text-xs text-muted-foreground'>Completion Rate</div>
        </div>
      </div>

      {/* Funnel visualization */}
      <div className='space-y-3 mb-6'>
        {stages.map((stage, idx) => {
          const maxValue = Math.max(...stages.map((s) => s.value), 1);
          const width = stage.value > 0 ? Math.max((stage.value / maxValue) * 100, 15) : 0;
          const prevStage = idx > 0 ? stages[idx - 1] : null;
          const conversionRate = prevStage ? getConversionRate(prevStage.value, stage.value) : null;

          return (
            <div key={stage.label} className='relative'>
              {/* Conversion rate indicator */}
              {conversionRate !== null && (
                <div className='absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs'>
                  <div className={cn('flex items-center gap-1', conversionRate >= 50 ? 'text-success' : 'text-amber-500')}>
                    {conversionRate >= 50 ? (
                      <TrendingUp className='h-3 w-3' />
                    ) : (
                      <TrendingDown className='h-3 w-3' />
                    )}
                    <span>{conversionRate}%</span>
                  </div>
                </div>
              )}

              <div className='flex items-center gap-3'>
                <div className='w-20 text-xs text-muted-foreground text-right'>{stage.label}</div>
                <div className='flex-1'>
                  <div
                    className={cn('h-8 rounded-md transition-all duration-500 flex items-center justify-between px-3', stage.color)}
                    style={{ width: `${width}%` }}
                  >
                    <span className='text-white text-sm font-medium flex items-center gap-2'>
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
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t'>
        <div className='text-center'>
          <div className='text-2xl font-bold'>{totalSessions}</div>
          <div className='text-xs text-muted-foreground'>Total Sessions</div>
        </div>
        <div className='text-center'>
          <div className={cn('text-2xl font-bold', completionRate >= 60 ? 'text-success' : 'text-destructive')}>
            {completionRate}%
          </div>
          <div className='text-xs text-muted-foreground'>Completion</div>
        </div>
        <div className='text-center'>
          <div className={cn('text-2xl font-bold', abandonRate <= 20 ? 'text-success' : 'text-amber-500')}>
            {abandonRate}%
          </div>
          <div className='text-xs text-muted-foreground'>Abandoned</div>
        </div>
        <div className='text-center'>
          <div className='text-2xl font-bold text-sky-500'>{reviewed}</div>
          <div className='text-xs text-muted-foreground'>Reviews</div>
        </div>
      </div>
    </Card>
  );
}