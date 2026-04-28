'use client';
import { useMemo } from 'react';

export default function PathwayGraph({ stages, subjects, schedule }) {
  const stageCount = stages?.length || 1;
  const subjectCount = subjects?.length || 1;

  // Calculate dimensions
  const width = Math.max(600, stageCount * 200 + 100);
  const height = Math.max(300, subjectCount * 40 + 160);
  const stageSpacing = (width - 100) / Math.max(stageCount, 1);

  // Calculate stage completion
  const stageStats = useMemo(() => {
    return (stages || []).map((stage) => {
      const tasks = (schedule || []).filter((t) => t.stage === stage.name && t.type !== 'rest');
      const completed = tasks.filter((t) => t.completionStatus === 'completed').length;
      return { ...stage, total: tasks.length, completed, pct: tasks.length > 0 ? completed / tasks.length : 0 };
    });
  }, [stages, schedule]);

  if (!stages || stages.length === 0) return null;

  const stageColors = ['#818cf8', '#34d399', '#fbbf24', '#f472b6', '#22d3ee', '#a78bfa'];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">🗺️ Pathway Map</h3>
      <div className="overflow-x-auto rounded-xl border border-border bg-secondary/10 p-4">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          style={{ minWidth: `${Math.min(width, 500)}px`, maxHeight: '320px' }}
        >
          <defs>
            {/* Animated gradient for connections */}
            <linearGradient id="connGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(239 84% 67%)" stopOpacity="0.3" />
              <stop offset="50%" stopColor="hsl(239 84% 67%)" stopOpacity="0.7" />
              <stop offset="100%" stopColor="hsl(239 84% 67%)" stopOpacity="0.3" />
            </linearGradient>

            {/* Glow filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Connection lines between stages */}
          {stageStats.map((_, idx) => {
            if (idx === 0) return null;
            const x1 = 50 + (idx - 1) * stageSpacing + 30;
            const x2 = 50 + idx * stageSpacing - 30;
            const y = 60;
            return (
              <line
                key={`conn-${idx}`}
                x1={x1}
                y1={y}
                x2={x2}
                y2={y}
                stroke="url(#connGradient)"
                strokeWidth="2"
                strokeDasharray="6 4"
                className="pathway-line-animate"
              />
            );
          })}

          {/* Stage nodes */}
          {stageStats.map((stage, idx) => {
            const cx = 50 + idx * stageSpacing;
            const cy = 60;
            const color = stageColors[idx % stageColors.length];
            const isCompleted = stage.pct >= 1;
            const isActive = stage.status === 'active';

            return (
              <g key={`stage-${idx}`} className="pathway-node-animate">
                {/* Glow ring for active stage */}
                {isActive && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={32}
                    fill="none"
                    stroke={color}
                    strokeWidth="1"
                    opacity="0.3"
                    className="pathway-pulse"
                  />
                )}

                {/* Background circle */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={26}
                  fill={isCompleted ? `${color}33` : 'hsl(240 10% 12%)'}
                  stroke={color}
                  strokeWidth="2"
                  opacity={isCompleted ? 1 : 0.7}
                />

                {/* Progress arc */}
                {stage.pct > 0 && stage.pct < 1 && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={26}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeDasharray={`${stage.pct * 163.36} ${163.36}`}
                    strokeDashoffset="40.84"
                    strokeLinecap="round"
                    transform={`rotate(-90 ${cx} ${cy})`}
                  />
                )}

                {/* Completion check */}
                {isCompleted && (
                  <text x={cx} y={cy + 5} textAnchor="middle" fill={color} fontSize="18">
                    ✓
                  </text>
                )}

                {/* Stage number */}
                {!isCompleted && (
                  <text x={cx} y={cy + 5} textAnchor="middle" fill={color} fontSize="14" fontWeight="bold">
                    {idx + 1}
                  </text>
                )}

                {/* Stage name */}
                <text x={cx} y={cy + 48} textAnchor="middle" fill="hsl(240 5% 65%)" fontSize="11" fontWeight="600">
                  {stage.name}
                </text>

                {/* Task count */}
                <text x={cx} y={cy + 62} textAnchor="middle" fill="hsl(240 5% 50%)" fontSize="9">
                  {stage.completed}/{stage.total} tasks
                </text>

                {/* Subject branches */}
                {(subjects || []).slice(0, 4).map((sub, sidx) => {
                  const branchTasks = (schedule || []).filter((t) => t.stage === stage.name && t.subject === sub.name);
                  if (branchTasks.length === 0 && idx > 0) return null;

                  const bx = cx + (sidx - Math.min(subjects.length, 4) / 2 + 0.5) * 45;
                  const by = 140 + sidx * 35;

                  return (
                    <g key={`sub-${idx}-${sidx}`}>
                      {/* Branch line */}
                      <line
                        x1={cx}
                        y1={cy + 26}
                        x2={bx}
                        y2={by - 8}
                        stroke="hsl(240 5% 25%)"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                      />
                      {/* Subject pill */}
                      <rect
                        x={bx - 35}
                        y={by - 8}
                        width={70}
                        height={18}
                        rx={9}
                        fill="hsl(240 10% 15%)"
                        stroke="hsl(240 5% 25%)"
                        strokeWidth="0.5"
                      />
                      <text x={bx} y={by + 4} textAnchor="middle" fill="hsl(240 5% 60%)" fontSize="8" fontWeight="500">
                        {sub.name.length > 10 ? sub.name.slice(0, 9) + '…' : sub.name}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
