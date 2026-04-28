'use client';
import { Card } from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Edit3, Target } from 'lucide-react';

export default function PathwayOverview({ pathway, onEdit, onRegenerate }) {
  const weakSubjects = (pathway.subjects || []).filter((s) => s.strengthLevel === 'weak').map((s) => s.name);
  const totalTasks = pathway.totalTasks || 0;
  const completedTasks = pathway.completedTasks || 0;
  const completion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const stats = [
    { emoji: '📝', label: 'Exam', value: pathway.examName || 'Custom', bg: 'bg-indigo-500/10' },
    { emoji: '📅', label: 'Duration', value: `${pathway.totalDuration || 30} days`, bg: 'bg-sky-500/10' },
    { emoji: '📋', label: 'Stages', value: String(pathway.stages?.length || 1), bg: 'bg-emerald-500/10' },
    { emoji: '🧪', label: 'Total Tests', value: String(totalTasks), bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-4" style={{ animation: 'fadeInUp 0.4s ease-out' }}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-indigo-400" />
            Your Test <span className="gradient-text">Pathway</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{pathway.strategySummary}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.5">
            <Edit3 className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button variant="outline" size="sm" onClick={onRegenerate} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Regenerate
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${s.bg}`}>{s.emoji}</div>
              <div>
                <div className="text-lg font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">🏆 Test Completion</h3>
          <span className="text-sm font-bold text-indigo-400">{completion}%</span>
        </div>
        <Progress value={completion} className="h-2.5" />
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>
            {completedTasks} of {totalTasks} tests completed
          </span>
          {weakSubjects.length > 0 && (
            <span className="flex items-center gap-1">
              <span className="text-amber-400">⚠️</span> Weak: {weakSubjects.join(', ')}
            </span>
          )}
        </div>
      </Card>

      {pathway.inferredFields?.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/15 text-xs text-amber-400">
          <span>✨</span>
          <span>AI inferred: {pathway.inferredFields.join(', ')}. You can edit these above.</span>
        </div>
      )}
    </div>
  );
}
