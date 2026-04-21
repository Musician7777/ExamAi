'use client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import LazyChartCanvas from '@/app/components/ChartCanvas/LazyChartCanvas';

/**
 * Question Performance Component
 * Shows question-type performance, difficulty breakdown, and personalized recommendations
 */
export default function QuestionPerformance({
  questionPerformance,
  difficultyPerformance,
  recommendations,
  chartColors,
}) {
  if (!questionPerformance || questionPerformance.length === 0) {
    return (
      <Card className='p-6'>
        <h3 className='font-semibold text-lg mb-4'>📝 Question Performance</h3>
        <div className='text-center py-8 text-muted-foreground'>
          <span className='text-4xl'>📝</span>
          <p className='mt-2'>Answer questions to see performance insights</p>
        </div>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      <Card className='p-6'>
        <h3 className='font-semibold text-lg mb-4'>📝 Question Type Performance</h3>
        <div className='grid md:grid-cols-2 gap-6'>
          {/* Accuracy by question type */}
          <div className='h-48'>
            <LazyChartCanvas
              config={{
                type: 'bar',
                data: {
                  labels: questionPerformance.map((q) => q.type),
                  datasets: [
                    {
                      label: 'Accuracy %',
                      data: questionPerformance.map((q) => q.accuracy),
                      backgroundColor: questionPerformance.map((q) =>
                        q.accuracy >= 70 ? '#4ade80' : q.accuracy >= 50 ? '#fbbf24' : '#f87171'
                      ),
                      borderRadius: 6,
                    },
                  ],
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: {
                      min: 0,
                      max: 100,
                      ticks: { color: chartColors.tick },
                      grid: { color: chartColors.grid },
                    },
                    x: {
                      ticks: { color: chartColors.tick },
                      grid: { display: false },
                    },
                  },
                },
              }}
            />
          </div>

          {/* Average time by question type */}
          <div className='h-48'>
            <LazyChartCanvas
              config={{
                type: 'bar',
                data: {
                  labels: questionPerformance.map((q) => q.type),
                  datasets: [
                    {
                      label: 'Avg Time (s)',
                      data: questionPerformance.map((q) => q.avgTimeSeconds),
                      backgroundColor: chartColors.primary,
                      borderRadius: 6,
                    },
                  ],
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: {
                      ticks: { color: chartColors.tick },
                      grid: { color: chartColors.grid },
                    },
                    x: {
                      ticks: { color: chartColors.tick },
                      grid: { display: false },
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t'>
          {questionPerformance.map((q) => (
            <div key={q.type} className='text-center'>
              <Badge
                variant={q.accuracy >= 70 ? 'success' : q.accuracy >= 50 ? 'warning' : 'destructive'}
                className='mb-1'
              >
                {q.accuracy}%
              </Badge>
              <div className='text-sm font-medium'>{q.type}</div>
              <div className='text-xs text-muted-foreground'>{q.total} answered</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Difficulty Performance */}
      {difficultyPerformance && difficultyPerformance.length > 0 && (
        <Card className='p-6'>
          <h3 className='font-semibold text-lg mb-4'>🎯 Difficulty Breakdown</h3>
          <div className='grid sm:grid-cols-3 gap-4'>
            {difficultyPerformance.map((d) => {
              const diffLabel = d.difficulty.charAt(0).toUpperCase() + d.difficulty.slice(1);
              return (
                <div
                  key={d.difficulty}
                  className={cn(
                    'p-4 rounded-lg border',
                    d.difficulty === 'easy' ? 'border-emerald-500/20 bg-emerald-500/5' :
                    d.difficulty === 'medium' ? 'border-amber-500/20 bg-amber-500/5' :
                    'border-red-500/20 bg-red-500/5'
                  )}
                >
                  <div className='text-2xl font-bold mb-1'>{d.accuracy}%</div>
                  <div className='text-sm font-medium'>{diffLabel}</div>
                  <div className='text-xs text-muted-foreground'>{d.total} questions</div>
                  <div className='mt-2'>
                    <div className='h-2 bg-secondary rounded-full overflow-hidden'>
                      <div
                        className={cn(
                          'h-full rounded-full',
                          d.difficulty === 'easy' ? 'bg-emerald-500' :
                          d.difficulty === 'medium' ? 'bg-amber-500' :
                          'bg-red-500'
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
        <Card className='p-6 border-primary/20'>
          <h3 className='font-semibold text-lg mb-4'>💡 Personalized Recommendations</h3>
          <div className='space-y-3'>
            {recommendations.weakTopics && recommendations.weakTopics.length > 0 && (
              <div className='flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20'>
                <span className='text-xl'>📚</span>
                <div>
                  <div className='font-medium text-sm'>Focus Areas</div>
                  <div className='text-sm text-muted-foreground mt-1'>
                    Improve: {recommendations.weakTopics.slice(0, 3).join(', ')}
                  </div>
                </div>
              </div>
            )}
            {recommendations.questionTypesToPractice && recommendations.questionTypesToPractice.length > 0 && (
              <div className='flex items-start gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20'>
                <span className='text-xl'>✍️</span>
                <div>
                  <div className='font-medium text-sm'>Practice Needed</div>
                  <div className='text-sm text-muted-foreground mt-1'>
                    Work on: {recommendations.questionTypesToPractice.join(', ')} questions
                  </div>
                </div>
              </div>
            )}
            {recommendations.tips && recommendations.tips.map((tip, idx) => (
              <div key={idx} className='flex items-start gap-3 p-3 rounded-lg bg-sky-500/5 border border-sky-500/20'>
                <span className='text-xl'>{tip.icon}</span>
                <div className='text-sm text-muted-foreground'>{tip.text}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}