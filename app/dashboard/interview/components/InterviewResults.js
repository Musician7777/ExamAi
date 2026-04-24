'use client';
import { useEffect } from 'react';
import { HiOutlineLightBulb, HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineRefresh } from 'react-icons/hi';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────
   SCORE CARD COMPONENT
   ───────────────────────────────────────────── */
function ScoreCard({ avgScore, scores, questionsAnswered, totalQs, grade }) {
  return (
    <Card className="p-8 text-center bg-card shadow-sm border-border flex flex-col items-center">
      <div className="text-7xl font-black gradient-text mb-4">{avgScore}%</div>
      <div className="text-2xl font-bold mb-8">{grade}</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
        <div className="flex flex-col gap-1 p-4 rounded-xl bg-secondary/30">
          <span className="text-2xl font-bold text-indigo-400">{scores.knowledge}%</span>
          <span className="text-sm text-muted-foreground font-semibold">Knowledge</span>
        </div>
        <div className="flex flex-col gap-1 p-4 rounded-xl bg-secondary/30">
          <span className="text-2xl font-bold text-green-400">{scores.communication}%</span>
          <span className="text-sm text-muted-foreground font-semibold">Communication</span>
        </div>
        <div className="flex flex-col gap-1 p-4 rounded-xl bg-secondary/30">
          <span className="text-2xl font-bold text-amber-400">{scores.confidence}%</span>
          <span className="text-sm text-muted-foreground font-semibold">Confidence</span>
        </div>
        <div className="flex flex-col gap-1 p-4 rounded-xl bg-secondary/30">
          <span className="text-2xl font-bold text-foreground">
            {questionsAnswered}/{totalQs}
          </span>
          <span className="text-sm text-muted-foreground font-semibold">Answered</span>
        </div>
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────────
   VERDICT CARD COMPONENT
   ───────────────────────────────────────────── */
function VerdictCard({ analysis }) {
  const readinessLevel = analysis.readinessLevel?.replace(/\n/g, '-').toLowerCase() || '';
  const readinessColor = readinessLevel.includes('ready')
    ? 'bg-green-500/12 text-green-400'
    : readinessLevel.includes('improvement')
      ? 'bg-amber-500/12 text-amber-400'
      : readinessLevel.includes('gap')
        ? 'bg-red-500/12 text-red-400'
        : 'bg-indigo-500/12 text-indigo-400';

  return (
    <Card className="p-6 md:p-8 bg-primary/5 border-primary/20 space-y-4 shadow-inner">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-primary/20 pb-4">
        <span className="text-2xl font-bold gradient-text">{analysis.overallGrade}</span>
        <Badge variant="secondary" className={cn('px-4 py-1.5 text-sm uppercase tracking-wider', readinessColor)}>
          {analysis.readinessLevel}
        </Badge>
      </div>
      <p className="text-lg leading-relaxed text-foreground/90">{analysis.overallVerdict}</p>
    </Card>
  );
}

/* ─────────────────────────────────────────────
   TOPIC BREAKDOWN COMPONENT
   ───────────────────────────────────────────── */
function TopicBreakdown({ topicBreakdown }) {
  if (!topicBreakdown || topicBreakdown.length === 0) return null;

  return (
    <Card className="p-6 space-y-6">
      <h2 className="text-xl font-bold">📋 Topic-wise Breakdown</h2>
      <div className="space-y-4">
        {topicBreakdown.map((topic, i) => (
          <div key={i} className="flex items-center gap-4">
            <span className="w-1/3 font-medium truncate">{topic.topic}</span>
            <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${(topic.score / topic.maxScore) * 100}%`,
                  background:
                    topic.score >= 7
                      ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                      : topic.score >= 4
                        ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                        : 'linear-gradient(90deg, #ef4444, #f87171)',
                }}
              />
            </div>
            <span className="w-12 text-right font-bold">
              {topic.score}/{topic.maxScore}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────────
   STRENGTHS & IMPROVEMENTS COMPONENT
   ───────────────────────────────────────────── */
function StrengthsImprovements({ strengthAreas, improvementAreas }) {
  if ((!strengthAreas || strengthAreas.length === 0) && (!improvementAreas || improvementAreas.length === 0))
    return null;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {strengthAreas && strengthAreas.length > 0 && (
        <Card className="p-6 space-y-4 bg-green-500/5 border-green-500/20">
          <h2 className="text-xl font-bold text-green-500 flex items-center gap-2">💪 Strengths</h2>
          <div className="space-y-4">
            {strengthAreas.map((s, i) => (
              <div key={i} className="space-y-1">
                <div className="font-semibold text-foreground">✓ {s.area}</div>
                <p className="text-sm text-muted-foreground">{s.detail}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
      {improvementAreas && improvementAreas.length > 0 && (
        <Card className="p-6 space-y-4 bg-amber-500/5 border-amber-500/20">
          <h2 className="text-xl font-bold text-amber-500 flex items-center gap-2">🎯 Areas of Improvement</h2>
          <div className="space-y-4">
            {improvementAreas.map((imp, i) => (
              <div key={i} className="space-y-1">
                <div className="font-semibold text-foreground">⚡ {imp.area}</div>
                <p className="text-sm text-muted-foreground">{imp.detail}</p>
                {imp.actionItem && (
                  <div className="flex items-start gap-2 mt-2 p-2 bg-amber-500/10 rounded text-sm text-amber-600 dark:text-amber-400">
                    <HiOutlineLightBulb className="w-5 h-5 shrink-0" />
                    <span>{imp.actionItem}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   COMMUNICATION FEEDBACK COMPONENT
   ───────────────────────────────────────────── */
function CommunicationFeedback({ communicationFeedback }) {
  if (!communicationFeedback) return null;
  const { clarity, depth, examples, tips } = communicationFeedback;
  if (!clarity && !depth && !examples && (!tips || tips.length === 0)) return null;

  return (
    <Card className="p-6 space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">🗣️ Communication Assessment</h2>
      <div className="grid sm:grid-cols-3 gap-4">
        {clarity && (
          <div className="p-4 bg-secondary/30 rounded-xl">
            <h4 className="font-semibold mb-2">Clarity</h4>
            <p className="text-sm text-muted-foreground">{clarity}</p>
          </div>
        )}
        {depth && (
          <div className="p-4 bg-secondary/30 rounded-xl">
            <h4 className="font-semibold mb-2">Depth</h4>
            <p className="text-sm text-muted-foreground">{depth}</p>
          </div>
        )}
        {examples && (
          <div className="p-4 bg-secondary/30 rounded-xl">
            <h4 className="font-semibold mb-2">Use of Examples</h4>
            <p className="text-sm text-muted-foreground">{examples}</p>
          </div>
        )}
      </div>
      {tips && tips.length > 0 && (
        <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
          <h4 className="text-sm font-bold text-indigo-400 mb-2">💡 Tips</h4>
          <ul className="space-y-2 list-none p-0">
            {tips.map((tip, i) => (
              <li key={i} className="text-sm text-muted-foreground pl-5 relative">
                <span className="absolute left-0 text-indigo-400">→</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

/* ─────────────────────────────────────────────
   NEXT STEPS COMPONENT
   ───────────────────────────────────────────── */
function NextSteps({ nextSteps, mockInterviewTip }) {
  if (!nextSteps || nextSteps.length === 0) return null;

  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">🚀 Next Steps</h2>
      <div className="space-y-3">
        {nextSteps.map((step, i) => (
          <div key={i} className="flex gap-3 items-start">
            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-sm font-bold">
              {i + 1}
            </div>
            <p className="pt-0.5">{step}</p>
          </div>
        ))}
      </div>
      {mockInterviewTip && (
        <div className="p-4 bg-violet-500/6 border border-violet-500/12 rounded-xl">
          <strong className="text-indigo-400">💎 Pro Tip:</strong>{' '}
          <span className="text-muted-foreground">{mockInterviewTip}</span>
        </div>
      )}
    </Card>
  );
}

/* ─────────────────────────────────────────────
   QUESTION REVIEW COMPONENT
   ───────────────────────────────────────────── */
function QuestionReview({ reviewData, expandedQuestions, onToggleExpand }) {
  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-xl font-bold mb-4">📝 Question-by-Question Review</h2>
      <div className="space-y-3">
        {reviewData.map((item, i) => (
          <div key={i} className="border rounded-xl overflow-hidden bg-card transition-all hover:border-indigo-500/20">
            <div
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/50"
              onClick={() => onToggleExpand(i)}
            >
              <div className="flex items-center gap-4 min-w-0 pr-4">
                <span className="font-mono font-bold text-muted-foreground shrink-0 w-8">Q{i + 1}</span>
                <span className="truncate font-medium flex-1 text-sm">
                  {item.question.length > 80 ? item.question.substring(0, 80) + '...' : item.question}
                </span>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <Badge
                  variant={item.score >= 7 ? 'success' : item.score >= 4 ? 'warning' : 'destructive'}
                  className="w-12 justify-center"
                >
                  {item.score}/10
                </Badge>
                {expandedQuestions[i] ? (
                  <HiOutlineChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <HiOutlineChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </div>
            {expandedQuestions[i] && (
              <div className="p-4 bg-secondary/10 border-t space-y-4 animate-in slide-in-from-bottom-2 duration-200">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Question</h4>
                  <p className="text-sm font-medium">{item.question}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Your Answer</h4>
                  <p className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3 py-1">
                    {item.answer}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">AI Feedback</h4>
                  <p className="text-sm text-foreground/90">{item.feedback}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────────
   MAIN INTERVIEW RESULTS COMPONENT
   ───────────────────────────────────────────── */
export default function InterviewResults({
  interviewConfig,
  scores,
  reviewData,
  expandedQuestions,
  onToggleQuestionExpand,
  analysis,
  analysisLoading,
  onFetchAnalysis,
  onRestart,
}) {
  const totalQs = interviewConfig?.questionCount || 10;
  const avgScore =
    reviewData.length > 0 ? Math.round((reviewData.reduce((s, r) => s + (r.score || 0), 0) / (totalQs * 10)) * 100) : 0;
  const grade =
    avgScore >= 90
      ? 'Excellent!'
      : avgScore >= 75
        ? 'Great Job!'
        : avgScore >= 50
          ? 'Good Effort!'
          : 'Keep Practicing!';
  const questionsAnswered = reviewData.length;
  const isEarlyExit = questionsAnswered < totalQs;

  // Auto-fetch analysis on mount
  useEffect(() => {
    if (!analysis && !analysisLoading) {
      onFetchAnalysis();
    }
  }, [analysis, analysisLoading, onFetchAnalysis]);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          📊 Interview <span className="gradient-text">Results</span>
        </h1>
        <p className="text-muted-foreground text-lg">
          {isEarlyExit
            ? `You exited early after answering ${questionsAnswered} of ${totalQs} questions.`
            : `Here's your comprehensive analysis across ${questionsAnswered} questions.`}
        </p>
      </div>

      {/* Score Card */}
      <ScoreCard
        avgScore={avgScore}
        scores={scores}
        questionsAnswered={questionsAnswered}
        totalQs={totalQs}
        grade={grade}
      />

      {/* AI Analysis Section */}
      {analysisLoading && (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium text-lg">Generating personalized AI analysis...</p>
        </div>
      )}

      {analysis && (
        <div className="space-y-6">
          <VerdictCard analysis={analysis} />
          <TopicBreakdown topicBreakdown={analysis.topicBreakdown} />
          <StrengthsImprovements strengthAreas={analysis.strengthAreas} improvementAreas={analysis.improvementAreas} />
          <CommunicationFeedback communicationFeedback={analysis.communicationFeedback} />
          <NextSteps nextSteps={analysis.nextSteps} mockInterviewTip={analysis.mockInterviewTip} />
        </div>
      )}

      {/* Question-by-Question Review */}
      <QuestionReview
        reviewData={reviewData}
        expandedQuestions={expandedQuestions}
        onToggleExpand={onToggleQuestionExpand}
      />

      {/* Actions */}
      <div className="flex justify-center pt-4">
        <Button size="lg" onClick={onRestart} className="gap-2 h-14 px-8 text-lg" variant="brand">
          <HiOutlineRefresh className="w-5 h-5" /> Start New Interview
        </Button>
      </div>
    </div>
  );
}
