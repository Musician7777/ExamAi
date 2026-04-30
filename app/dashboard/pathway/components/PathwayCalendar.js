'use client';
import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Play, Check, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';

const TASK_COLORS = {
  'easy-test': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'medium-test': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'hard-test': 'bg-red-500/20 text-red-400 border-red-500/30',
  'subject-test': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  'mock-test': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  'timed-test': 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  'previous-year': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'mixed-test': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'coding-test': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'interview-sim': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  rest: 'bg-secondary/50 text-muted-foreground border-border',
};

const STATUS_STYLES = {
  planned: '',
  in_progress: 'ring-2 ring-indigo-500/40',
  completed: 'opacity-70',
  skipped: 'opacity-40 line-through',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function PathwayCalendar({ schedule, onTaskAction, onLaunchTest, stageFilter, subjectFilter }) {
  const [viewMode, setViewMode] = useState('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedTask, setSelectedTask] = useState(null);

  const tasksByDate = useMemo(() => {
    const map = {};
    (schedule || []).forEach((task) => {
      const key = new Date(task.date).toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(task);
    });
    return map;
  }, [schedule]);

  const { startDate, endDate, dateRange } = useMemo(() => {
    if (!schedule || schedule.length === 0) return { startDate: new Date(), endDate: new Date(), dateRange: [] };

    const allDates = schedule.map((t) => new Date(t.date));
    const earliest = new Date(Math.min(...allDates));

    if (viewMode === 'week') {
      const weekStart = new Date(earliest);
      weekStart.setDate(weekStart.getDate() + weekOffset * 7);
      const day = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1));

      const range = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        range.push(d);
      }
      return { startDate: range[0], endDate: range[6], dateRange: range };
    }

    const monthStart = new Date(earliest);
    monthStart.setDate(1);
    monthStart.setMonth(monthStart.getMonth() + weekOffset);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0);

    const padStart = new Date(monthStart);
    const sd = padStart.getDay();
    padStart.setDate(padStart.getDate() - (sd === 0 ? 6 : sd - 1));

    const range = [];
    const current = new Date(padStart);
    while (current <= monthEnd || range.length % 7 !== 0) {
      range.push(new Date(current));
      current.setDate(current.getDate() + 1);
      if (range.length > 42) break;
    }

    return { startDate: monthStart, endDate: monthEnd, dateRange: range };
  }, [schedule, viewMode, weekOffset]);

  const filterTask = (task) => {
    if (stageFilter && task.stage !== stageFilter) return false;
    if (subjectFilter && task.subject !== subjectFilter) return false;
    return true;
  };

  const today = new Date().toDateString();
  const maxWeeks =
    schedule && schedule.length > 0
      ? Math.ceil(
          (new Date(Math.max(...schedule.map((t) => new Date(t.date)))) -
            new Date(Math.min(...schedule.map((t) => new Date(t.date))))) /
            (7 * 24 * 60 * 60 * 1000)
        )
      : 4;

  // Click a task → always show detail panel first (user can then launch from there)
  const handleTaskClick = (task) => {
    if (task.type === 'rest') return;
    setSelectedTask(selectedTask?._id === task._id ? null : task);
  };

  return (
    <div className="space-y-3">
      {/* Calendar header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">📅 Test Schedule</h3>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-secondary/50 rounded-lg p-0.5">
            <button
              onClick={() => {
                setViewMode('week');
                setWeekOffset(0);
              }}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium transition-all',
                viewMode === 'week' ? 'bg-indigo-500/15 text-indigo-400' : 'text-muted-foreground'
              )}
            >
              Week
            </button>
            <button
              onClick={() => {
                setViewMode('month');
                setWeekOffset(0);
              }}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium transition-all',
                viewMode === 'month' ? 'bg-indigo-500/15 text-indigo-400' : 'text-muted-foreground'
              )}
            >
              Month
            </button>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setWeekOffset((o) => o - 1)}
              disabled={weekOffset <= 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setWeekOffset(0)}>
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setWeekOffset((o) => o + 1)}
              disabled={weekOffset >= maxWeeks}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {startDate.getDate()} {MONTHS[startDate.getMonth()]} — {endDate.getDate()} {MONTHS[endDate.getMonth()]}{' '}
        {endDate.getFullYear()}
        <span className="ml-2 text-indigo-400">• Click any test to see details & launch</span>
      </p>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">
            {d}
          </div>
        ))}

        {dateRange.map((date, idx) => {
          const dateKey = date.toDateString();
          const dayTasks = (tasksByDate[dateKey] || []).filter(filterTask);
          const isToday = dateKey === today;
          const isCurrentMonth = viewMode === 'month' ? date.getMonth() === startDate.getMonth() : true;

          return (
            <div
              key={idx}
              className={cn(
                'min-h-[80px] rounded-lg border p-1.5 transition-all',
                isToday ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-border/50',
                !isCurrentMonth && 'opacity-30',
                viewMode === 'week' && 'min-h-[120px]'
              )}
              style={{ animation: `fadeIn 0.2s ease-out ${idx * 0.02}s both` }}
            >
              <div
                className={cn('text-[10px] font-semibold mb-1', isToday ? 'text-indigo-400' : 'text-muted-foreground')}
              >
                {date.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayTasks.slice(0, viewMode === 'week' ? 5 : 2).map((task, tidx) => (
                  <button
                    key={task._id || tidx}
                    onClick={() => handleTaskClick(task)}
                    className={cn(
                      'w-full text-left px-1.5 py-0.5 rounded text-[9px] font-medium border transition-all truncate cursor-pointer hover:brightness-125',
                      TASK_COLORS[task.type] || 'bg-secondary/50 text-muted-foreground border-border',
                      STATUS_STYLES[task.completionStatus],
                      task.type !== 'rest' &&
                        task.completionStatus === 'planned' &&
                        'hover:ring-1 hover:ring-indigo-500/40'
                    )}
                    title={`${task.title} — Click to start`}
                  >
                    {task.completionStatus === 'completed' ? '✓ ' : task.type !== 'rest' ? '▶ ' : ''}
                    {task.title}
                  </button>
                ))}
                {dayTasks.length > (viewMode === 'week' ? 5 : 2) && (
                  <span className="text-[9px] text-muted-foreground">
                    +{dayTasks.length - (viewMode === 'week' ? 5 : 2)} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task detail (for completed/skipped tasks) */}
      {selectedTask && (
        <Card className="p-4 border-indigo-500/20 bg-indigo-500/5" style={{ animation: 'fadeInUp 0.2s ease-out' }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="text-sm font-semibold">{selectedTask.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(selectedTask.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
                {' · '}
                {selectedTask.duration || 30} min
                {selectedTask.stage && ` · ${selectedTask.stage}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={cn('text-[10px]', TASK_COLORS[selectedTask.type])}>
                {selectedTask.type.replace(/-/g, ' ')}
              </Badge>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            {selectedTask.actionRoute && selectedTask.completionStatus !== 'completed' && (
              <Button
                variant="brand"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  onLaunchTest?.(selectedTask);
                  setSelectedTask(null);
                }}
              >
                <Play className="h-3 w-3" /> Launch Test
              </Button>
            )}
            {selectedTask.completionStatus !== 'completed' && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  onTaskAction?.(selectedTask, 'complete');
                  setSelectedTask(null);
                }}
              >
                <Check className="h-3 w-3" /> Mark Done
              </Button>
            )}
            {selectedTask.completionStatus !== 'skipped' && selectedTask.completionStatus !== 'completed' && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={() => {
                  onTaskAction?.(selectedTask, 'skip');
                  setSelectedTask(null);
                }}
              >
                <SkipForward className="h-3 w-3" /> Skip
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-2 pt-1">
        {[
          { type: 'easy-test', label: 'Easy' },
          { type: 'medium-test', label: 'Medium' },
          { type: 'hard-test', label: 'Hard' },
          { type: 'mock-test', label: 'Mock' },
          { type: 'timed-test', label: 'Speed' },
          { type: 'subject-test', label: 'Subject' },
        ].map(({ type, label }) => (
          <div key={type} className="flex items-center gap-1">
            <div className={cn('w-2.5 h-2.5 rounded-sm', TASK_COLORS[type]?.split(' ')[0])} />
            <span className="text-[10px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
