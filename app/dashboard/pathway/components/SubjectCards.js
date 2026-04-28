'use client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const strengthColors = {
  weak: { bg: 'bg-red-500/10', text: 'text-red-400' },
  average: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  strong: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
};

export default function SubjectCards({ subjects, onSubjectClick, activeSubject }) {
  if (!subjects || subjects.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
        📚 Subjects
        {activeSubject && (
          <button
            onClick={() => onSubjectClick?.(null)}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-normal ml-2"
          >
            Clear filter ×
          </button>
        )}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {subjects.map((subject, idx) => {
          const colors = strengthColors[subject.strengthLevel] || strengthColors.average;
          const isActive = activeSubject === subject.name;
          return (
            <Card
              key={idx}
              className={cn(
                'p-3 cursor-pointer transition-all hover:shadow-md',
                isActive
                  ? 'border-indigo-500/50 bg-indigo-500/5 ring-1 ring-indigo-500/30'
                  : 'hover:border-indigo-500/20'
              )}
              onClick={() => onSubjectClick?.(isActive ? null : subject.name)}
              style={{ animation: `fadeInUp 0.3s ease-out ${idx * 0.05}s both` }}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold truncate">{subject.name}</h4>
                <Badge variant="secondary" className={cn('text-[10px] capitalize', colors.bg, colors.text)}>
                  {subject.strengthLevel || 'average'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-1 text-center">
                <div className="p-1 rounded-md bg-secondary/30">
                  <div className="text-sm font-bold">{subject.totalSessions || 0}</div>
                  <div className="text-[9px] text-muted-foreground">Tests</div>
                </div>
                <div className="p-1 rounded-md bg-secondary/30">
                  <div className="text-sm font-bold">{subject.mockAllocation || 0}</div>
                  <div className="text-[9px] text-muted-foreground">Mocks</div>
                </div>
                <div className="p-1 rounded-md bg-secondary/30">
                  <div className="text-sm font-bold">{subject.easyTests || 0}</div>
                  <div className="text-[9px] text-muted-foreground">Easy</div>
                </div>
                <div className="p-1 rounded-md bg-secondary/30">
                  <div className="text-sm font-bold">{subject.hardTests || 0}</div>
                  <div className="text-[9px] text-muted-foreground">Hard</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
