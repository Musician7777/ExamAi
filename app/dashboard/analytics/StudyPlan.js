'use client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Calendar, CheckCircle2, Circle, CircleDot, Clock, Target, RefreshCw, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const TYPE_CONFIG = {
  weak_topic: { icon: '📚', label: 'Focus Area', color: 'bg-red-500/10 border-red-500/20', badge: 'destructive' },
  question_type: { icon: '✍️', label: 'Practice Type', color: 'bg-amber-500/10 border-amber-500/20', badge: 'warning' },
  milestone: { icon: '🎯', label: 'Milestone', color: 'bg-emerald-500/10 border-emerald-500/20', badge: 'success' },
  practice: { icon: '💪', label: 'Practice', color: 'bg-sky-500/10 border-sky-500/20', badge: 'default' },
  review: { icon: '📖', label: 'Review', color: 'bg-violet-500/10 border-violet-500/20', badge: 'default' },
};

const STATUS_CONFIG = {
  pending: { icon: CircleDot, color: 'text-primary', label: 'Not Started' },
  in_progress: { icon: Clock, color: 'text-amber-500', label: 'In Progress' },
  completed: { icon: CheckCircle2, color: 'text-emerald-500', label: 'Completed' },
  skipped: { icon: Circle, color: 'text-muted-foreground/50', label: 'Skipped' },
};

export default function StudyPlan({ studyPlan, onUpdateItem, onRegenerate, loading }) {
  const [expandedWeek, setExpandedWeek] = useState('all');

  if (!studyPlan) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">📋 Your Study Plan</h3>
        </div>
        <div className='text-center py-8'>
          <span className='text-4xl'>🎯</span>
          <p className='mt-2 text-muted-foreground'>Complete more activities to get personalized recommendations</p>
        </div>
      </Card>
    );
  }

  const { title, items = [], completedItems = 0, totalItems = 0, startDate, endDate, analyticsSnapshot } = studyPlan;
  const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Group items by week
  const weeks = {};
  items.forEach((item) => {
    const itemDate = new Date(item.targetDate || startDate);
    const weekNum = Math.ceil((itemDate - new Date(startDate)) / (7 * 24 * 60 * 60 * 1000)) || 1;
    const weekKey = `Week ${weekNum}`;
    if (!weeks[weekKey]) weeks[weekKey] = [];
    weeks[weekKey].push(item);
  });

  // Sort weeks
  const sortedWeeks = Object.entries(weeks).sort((a, b) => {
    const aNum = parseInt(a[0].replace('Week ', ''));
    const bNum = parseInt(b[0].replace('Week ', ''));
    return aNum - bNum;
  });

  const handleStatusChange = (itemId, currentStatus) => {
    if (onUpdateItem) {
      // Cycle through statuses: pending → in_progress → completed
      const statusCycle = {
        pending: 'in_progress',
        in_progress: 'completed',
        completed: 'pending',
        skipped: 'pending',
      };
      const newStatus = statusCycle[currentStatus] || 'in_progress';
      onUpdateItem(itemId, newStatus);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card className='p-6'>
      {/* Header */}
      <div className='flex items-start justify-between mb-6'>
        <div className='flex-1'>
          <div className='flex items-center gap-2'>
            <h3 className='font-semibold text-lg'>📋 {title || 'Your Study Plan'}</h3>
            {completionPercentage === 100 && (
              <Badge variant='success' className='animate-pulse'>Complete! 🎉</Badge>
            )}
          </div>
          <p className='text-sm text-muted-foreground mt-1'>
            {formatDate(startDate)} — {formatDate(endDate)} • {totalItems} goals
          </p>
        </div>
        <Button
          variant='outline'
          size='sm'
          onClick={onRegenerate}
          disabled={loading}
          className='gap-2'
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Regenerate
        </Button>
      </div>

      {/* Progress bar */}
      <div className='mb-6'>
        <div className='flex items-center justify-between mb-2'>
          <span className='text-sm font-medium'>Progress</span>
          <span className='text-sm text-muted-foreground'>
            {completedItems}/{totalItems} completed ({completionPercentage}%)
          </span>
        </div>
        <Progress value={completionPercentage} className='h-2' />
      </div>

      {/* Analytics snapshot */}
      {analyticsSnapshot && (
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-4 bg-secondary/50 rounded-lg'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-primary'>
              {analyticsSnapshot.overallAccuracy || 0}%
            </div>
            <div className='text-xs text-muted-foreground'>Overall Accuracy</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-red-500'>
              {analyticsSnapshot.weakTopics?.length || 0}
            </div>
            <div className='text-xs text-muted-foreground'>Focus Areas</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-amber-500'>
              {analyticsSnapshot.questionTypesToPractice?.length || 0}
            </div>
            <div className='text-xs text-muted-foreground'>Types to Practice</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-sky-500'>
              {analyticsSnapshot.totalActivities || 0}
            </div>
            <div className='text-xs text-muted-foreground'>Total Activities</div>
          </div>
        </div>
      )}

      {/* Weekly timeline */}
      <div className='space-y-4'>
        {sortedWeeks.map(([week, weekItems]) => {
          const weekNum = parseInt(week.replace('Week ', ''));
          const isExpanded = expandedWeek === 'all' || expandedWeek === week;
          const completedInWeek = weekItems.filter((i) => i.status === 'completed').length;

          return (
            <div key={week} className='border rounded-lg overflow-hidden'>
              {/* Week header */}
              <button
                onClick={() => setExpandedWeek(isExpanded ? null : week)}
                className='w-full flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/50 transition-colors'
              >
                <div className='flex items-center gap-3'>
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-bold',
                    completedInWeek === weekItems.length
                      ? 'bg-emerald-500 text-white'
                      : 'bg-primary/10 text-primary'
                  )}>
                    {weekNum}
                  </div>
                  <div className='text-left'>
                    <div className='font-medium'>{week}</div>
                    <div className='text-xs text-muted-foreground'>
                      {completedInWeek}/{weekItems.length} completed
                    </div>
                  </div>
                </div>
                <ChevronRight className={cn(
                  'h-5 w-5 transition-transform',
                  isExpanded && 'rotate-90'
                )} />
              </button>

              {/* Week items */}
              {isExpanded && (
                <div className='p-4 space-y-3'>
                  {weekItems.map((item) => {
                    const typeConfig = TYPE_CONFIG[item.type] || TYPE_CONFIG.practice;
                    const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
                    const StatusIcon = statusConfig.icon;
                    const isOverdue = item.targetDate && 
                      new Date(item.targetDate) < new Date() && 
                      item.status !== 'completed';

                    return (
                      <div
                        key={item._id}
                        className={cn(
                          'p-4 rounded-lg border transition-colors',
                          typeConfig.color,
                          item.status === 'completed' && 'opacity-60'
                        )}
                      >
                        <div className='flex items-start gap-3'>
                          <button
                            onClick={() => handleStatusChange(item._id, item.status)}
                            disabled={loading}
                            className='mt-0.5 shrink-0'
                          >
                            <StatusIcon className={cn('h-5 w-5', statusConfig.color)} />
                          </button>
                          <div className='flex-1 min-w-0'>
                            <div className='flex items-center gap-2 mb-1'>
                              <span className='text-lg'>{typeConfig.icon}</span>
                              <span className='font-medium'>{item.topic}</span>
                              <Badge variant={typeConfig.badge} className='text-xs'>
                                {typeConfig.label}
                              </Badge>
                              {isOverdue && (
                                <Badge variant='destructive' className='text-xs'>Overdue</Badge>
                              )}
                            </div>
                            <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                              {item.targetDate && (
                                <span className='flex items-center gap-1'>
                                  <Calendar className='h-3 w-3' />
                                  {formatDate(item.targetDate)}
                                </span>
                              )}
                              <span className='flex items-center gap-1'>
                                <Target className='h-3 w-3' />
                                {item.activitiesCount || 0}/{item.targetActivities || 3} activities
                              </span>
                            </div>
                            {/* Progress for this item */}
                            <div className='mt-2'>
                              <Progress
                                value={((item.activitiesCount || 0) / (item.targetActivities || 3)) * 100}
                                className='h-1'
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className='text-center py-6 text-muted-foreground'>
          <span className='text-3xl'>📝</span>
          <p className='mt-2'>No study goals yet. Complete more activities to get personalized recommendations!</p>
        </div>
      )}
    </Card>
  );
}