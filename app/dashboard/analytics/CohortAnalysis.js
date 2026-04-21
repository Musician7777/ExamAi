'use client';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Cohort Analysis Component
 * Shows weekly retention metrics and user engagement patterns
 */
export default function CohortAnalysis({ weeklyRetention, chartColors }) {
  if (!weeklyRetention || weeklyRetention.length === 0) {
    return (
      <Card className='p-6'>
        <h3 className='font-semibold text-lg mb-4'>📈 Weekly Retention</h3>
        <div className='text-center py-8 text-muted-foreground'>
          <span className='text-4xl'>📊</span>
          <p className='mt-2'>Complete more exams to see retention insights</p>
        </div>
      </Card>
    );
  }

  const maxActiveDays = Math.max(...weeklyRetention.map((w) => w.activeDaysCount), 1);
  const maxSessions = Math.max(...weeklyRetention.map((w) => w.sessionsStarted), 1);
  const avgCompletionRate =
    weeklyRetention.length > 0
      ? Math.round(weeklyRetention.reduce((sum, w) => sum + w.completionRate, 0) / weeklyRetention.length)
      : 0;

  return (
    <Card className='p-6'>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h3 className='font-semibold text-lg'>📈 Weekly Retention</h3>
          <p className='text-sm text-muted-foreground mt-1'>
            Your engagement patterns over the past weeks
          </p>
        </div>
        <div className='text-right'>
          <div className='text-2xl font-bold text-emerald-500'>{avgCompletionRate}%</div>
          <div className='text-xs text-muted-foreground'>Avg Completion</div>
        </div>
      </div>

      {/* Bar chart visualization */}
      <div className='space-y-4 mb-6'>
        {weeklyRetention.map((week, idx) => {
          const activeDaysHeight = (week.activeDaysCount / maxActiveDays) * 100;
          const sessionsHeight = (week.sessionsStarted / maxSessions) * 100;
          const change = week.weekOverWeekChange;

          return (
            <div key={week.week} className='flex items-center gap-4'>
              <div className='w-16 text-xs text-muted-foreground'>{week.week}</div>
              <div className='flex-1 space-y-1'>
                {/* Active days bar */}
                <div className='flex items-center gap-2'>
                  <div className='w-20 text-xs text-muted-foreground'>Active Days</div>
                  <div className='flex-1 h-4 bg-secondary/50 rounded overflow-hidden'>
                    <div
                      className='h-full bg-indigo-500 rounded transition-all duration-300'
                      style={{ width: `${activeDaysHeight}%` }}
                    />
                  </div>
                  <div className='w-12 text-xs font-medium text-right'>{week.activeDaysCount}d</div>
                </div>
                {/* Sessions bar */}
                <div className='flex items-center gap-2'>
                  <div className='w-20 text-xs text-muted-foreground'>Sessions</div>
                  <div className='flex-1 h-4 bg-secondary/50 rounded overflow-hidden'>
                    <div
                      className='h-full bg-emerald-500 rounded transition-all duration-300'
                      style={{ width: `${sessionsHeight}%` }}
                    />
                  </div>
                  <div className='w-12 text-xs font-medium text-right'>{week.sessionsStarted}</div>
                </div>
              </div>
              {/* Change indicator */}
              {idx > 0 && (
                <div className={cn('w-12 text-xs text-right', change > 0 ? 'text-success' : change < 0 ? 'text-destructive' : 'text-muted-foreground')}>
                  {change > 0 ? `+${change}` : change}
                </div>
              )}
              {idx === 0 && <div className='w-12' />}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className='flex items-center gap-6 pt-4 border-t text-xs'>
        <div className='flex items-center gap-2'>
          <div className='w-3 h-3 rounded bg-indigo-500' />
          <span className='text-muted-foreground'>Active Days</span>
        </div>
        <div className='flex items-center gap-2'>
          <div className='w-3 h-3 rounded bg-emerald-500' />
          <span className='text-muted-foreground'>Sessions</span>
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-muted-foreground'>± WoW</span>
          <span className='text-muted-foreground'>Week-over-week change</span>
        </div>
      </div>
    </Card>
  );
}