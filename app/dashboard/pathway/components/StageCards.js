'use client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function StageCards({ stages, schedule, onStageClick }) {
  if (!stages || stages.length === 0) return null;

  // Calculate completion per stage
  const stageStats = stages.map((stage) => {
    const tasks = (schedule || []).filter((t) => t.stage === stage.name && t.type !== 'rest');
    const completed = tasks.filter((t) => t.completionStatus === 'completed').length;
    const total = tasks.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { ...stage, completed, total, pct };
  });

  const statusColors = {
    upcoming: 'bg-secondary/50 text-muted-foreground',
    active: 'bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/30',
    completed: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">📋 Exam Stages</h3>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {stageStats.map((stage, idx) => (
          <div
            key={idx}
            className="flex items-center shrink-0"
            style={{ animation: `fadeInUp 0.4s ease-out ${idx * 0.1}s both` }}
          >
            <Card
              className={cn(
                'p-4 min-w-[180px] cursor-pointer transition-all hover:shadow-md hover:border-indigo-500/20',
                stage.pct === 100 && 'border-emerald-500/30 bg-emerald-500/5'
              )}
              onClick={() => onStageClick?.(stage)}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold">{stage.name}</h4>
                <Badge variant="secondary" className={cn('text-[10px]', statusColors[stage.status])}>
                  {stage.status}
                </Badge>
              </div>
              {stage.objective && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{stage.objective}</p>}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                    style={{ width: `${stage.pct}%` }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground">{stage.pct}%</span>
              </div>
              <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                <span>{stage.duration || '—'} days</span>
                <span>
                  {stage.completed}/{stage.total} tasks
                </span>
              </div>
            </Card>
            {/* Connector line */}
            {idx < stageStats.length - 1 && (
              <div className="w-8 flex items-center justify-center shrink-0">
                <div className="pathway-connector w-full h-0.5 bg-border rounded-full" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
