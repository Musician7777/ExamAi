'use client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Lightbulb } from 'lucide-react';

import { CustomTooltipStyle } from './chartTheme';

/**
 * Question Performance Component
 * Shows question-type performance, difficulty breakdown, and personalized recommendations
 */
export default function QuestionPerformance({
  questionPerformance,
  difficultyPerformance,
  recommendations,
  resolvedColors,
}) {
  if (!questionPerformance || questionPerformance.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="font-semibold text-base mb-4">Question Performance</h3>
        <div className="text-center py-8 text-muted-foreground">
          <span className="text-4xl">📝</span>
          <p className="mt-2">Answer questions to see performance insights</p>
        </div>
      </Card>
    );
  }

  // Build Recharts data
  const accuracyData = questionPerformance.map((q) => ({
    type: q.type,
    accuracy: q.accuracy,
    fill: q.accuracy >= 70 ? '#4ade80' : q.accuracy >= 50 ? '#fbbf24' : '#f87171',
  }));

  const timeData = questionPerformance.map((q) => ({
    type: q.type,
    avgTime: Math.round(q.avgTimeSeconds),
  }));

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="font-semibold text-base">Question Type Performance</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Accuracy and time by question type</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Accuracy by question type */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Accuracy %</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={accuracyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={resolvedColors?.border || 'rgba(99, 102, 241, 0.12)'}
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="type"
                    tick={{ fontSize: 11, fill: resolvedColors?.mutedFg || '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: resolvedColors?.mutedFg || '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    width={35}
                  />
                  <Tooltip contentStyle={CustomTooltipStyle} formatter={(value) => [`${value}%`, 'Accuracy']} />
                  <Bar dataKey="accuracy" name="Accuracy" radius={[6, 6, 0, 0]} maxBarSize={50}>
                    {accuracyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Average time by question type */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Avg Time (seconds)</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={resolvedColors?.border || 'rgba(99, 102, 241, 0.12)'}
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="type"
                    tick={{ fontSize: 11, fill: resolvedColors?.mutedFg || '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: resolvedColors?.mutedFg || '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    width={35}
                  />
                  <Tooltip contentStyle={CustomTooltipStyle} formatter={(value) => [`${value}s`, 'Avg Time']} />
                  <Bar dataKey="avgTime" fill="#6366f1" name="Avg Time" radius={[6, 6, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Stats badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
          {questionPerformance.map((q) => (
            <div key={q.type} className="text-center p-3 rounded-lg bg-secondary/30">
              <Badge
                variant={q.accuracy >= 70 ? 'success' : q.accuracy >= 50 ? 'warning' : 'destructive'}
                className="mb-1"
              >
                {q.accuracy}%
              </Badge>
              <div className="text-sm font-medium">{q.type}</div>
              <div className="text-xs text-muted-foreground">{q.total} answered</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Difficulty Performance */}
      {difficultyPerformance && difficultyPerformance.length > 0 && (
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="font-semibold text-base">Difficulty Breakdown</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Performance by difficulty level</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {difficultyPerformance.map((d) => {
              const diffLabel = d.difficulty.charAt(0).toUpperCase() + d.difficulty.slice(1);
              return (
                <div
                  key={d.difficulty}
                  className={cn(
                    'p-4 rounded-lg border transition-all hover:shadow-md',
                    d.difficulty === 'easy'
                      ? 'border-emerald-500/20 bg-emerald-500/5'
                      : d.difficulty === 'medium'
                        ? 'border-amber-500/20 bg-amber-500/5'
                        : 'border-red-500/20 bg-red-500/5'
                  )}
                >
                  <div className="text-2xl font-bold mb-1">{d.accuracy}%</div>
                  <div className="text-sm font-medium">{diffLabel}</div>
                  <div className="text-xs text-muted-foreground">{d.total} questions</div>
                  <div className="mt-2">
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          d.difficulty === 'easy'
                            ? 'bg-emerald-500'
                            : d.difficulty === 'medium'
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                        )}
                        style={{ width: `${d.accuracy}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Personalized Recommendations */}
      {recommendations && (
        <Card className="p-6 border-primary/20">
          <div className="mb-4">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Personalized Recommendations
            </h3>
          </div>
          <div className="space-y-3">
            {recommendations.weakTopics && recommendations.weakTopics.length > 0 && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                <span className="text-xl">📚</span>
                <div>
                  <div className="font-medium text-sm">Focus Areas</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Improve: {recommendations.weakTopics.slice(0, 3).join(', ')}
                  </div>
                </div>
              </div>
            )}
            {recommendations.questionTypesToPractice && recommendations.questionTypesToPractice.length > 0 && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <span className="text-xl">✍️</span>
                <div>
                  <div className="font-medium text-sm">Practice Needed</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Work on: {recommendations.questionTypesToPractice.join(', ')} questions
                  </div>
                </div>
              </div>
            )}
            {recommendations.tips &&
              recommendations.tips.map((tip, idx) => (
                <div key={idx} className="flex items-start gap-3 p-4 rounded-lg bg-sky-500/5 border border-sky-500/20">
                  <span className="text-xl">{tip.icon}</span>
                  <div className="text-sm text-muted-foreground">{tip.text}</div>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
