'use client';
import { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineMinusCircle, HiOutlineClock } from 'react-icons/hi';
import { BarChart3, Eye, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import clientLogger from '@/lib/client-logger';

function SharedResultContent() {
  const params = useParams();
  const code = params.code;

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchResult() {
      try {
        const res = await fetch(`/api/share?code=${code}`);
        if (res.ok) {
          const data = await res.json();
          setResult(data.result);
        } else {
          const data = await res.json();
          setError(data.error || 'Not found');
        }
      } catch (err) {
        clientLogger.error('Failed to fetch shared result:', err);
        setError('Network error');
      }
      setLoading(false);
    }
    if (code) fetchResult();
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <Skeleton className="h-9 w-64 mx-auto" />
            <Skeleton className="h-4 w-40 mx-auto" />
            <div className="flex items-center justify-center gap-3 mt-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>

          <Card className="p-8 text-center space-y-4">
            <Skeleton className="w-28 h-28 rounded-full mx-auto" />
            <Skeleton className="h-6 w-24 mx-auto" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-3 rounded-xl bg-secondary/30 border flex flex-col items-center space-y-1.5">
                  <Skeleton className="h-6 w-6 rounded" />
                  <Skeleton className="h-5 w-8" />
                  <Skeleton className="h-2 w-10" />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 space-y-3">
            <Skeleton className="h-5 w-36" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-2 flex-1" />
                <Skeleton className="h-4 w-10" />
              </div>
            ))}
          </Card>

          <div className="text-center">
            <Skeleton className="h-10 w-32 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <div className="text-5xl">😕</div>
          <h1 className="text-2xl font-bold">Result Not Found</h1>
          <p className="text-muted-foreground">
            {error || 'This shared result may have been removed or the link is invalid.'}
          </p>
          <Link href="/">
            <Button variant="brand" className="gap-2">
              <Zap className="h-4 w-4" /> Go to ExamAI
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const { resultType, title, data, viewCount, createdAt } = result;

  if (resultType === 'exam') {
    const { percent, correct, wrong, unanswered, grade, sectionResults, timeTaken } = data;
    const minsUsed = timeTaken ? Math.floor(timeTaken / 60) : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">
              📊 Shared <span className="gradient-text">Exam Results</span>
            </h1>
            <p className="text-muted-foreground mt-1">{title}</p>
            <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" /> {viewCount} views
              </span>
              <span>•</span>
              <span>{new Date(createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <Card className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-28 h-28 rounded-full border-8 border-primary/20 mb-4 relative">
              <span className="text-3xl font-bold">{percent}%</span>
            </div>
            <h2 className="text-xl font-bold mb-6">{grade}</h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
              <div className="p-3 rounded-xl bg-background border flex flex-col items-center">
                <HiOutlineCheckCircle className="h-6 w-6 text-success mb-1" />
                <span className="text-xl font-bold text-success">{correct}</span>
                <span className="text-[10px] text-muted-foreground uppercase">Correct</span>
              </div>
              <div className="p-3 rounded-xl bg-background border flex flex-col items-center">
                <HiOutlineXCircle className="h-6 w-6 text-destructive mb-1" />
                <span className="text-xl font-bold text-destructive">{wrong}</span>
                <span className="text-[10px] text-muted-foreground uppercase">Wrong</span>
              </div>
              <div className="p-3 rounded-xl bg-background border flex flex-col items-center">
                <HiOutlineMinusCircle className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-xl font-bold">{unanswered}</span>
                <span className="text-[10px] text-muted-foreground uppercase">Skipped</span>
              </div>
              <div className="p-3 rounded-xl bg-background border flex flex-col items-center">
                <HiOutlineClock className="h-6 w-6 text-primary mb-1" />
                <span className="text-xl font-bold">{minsUsed}m</span>
                <span className="text-[10px] text-muted-foreground uppercase">Time</span>
              </div>
            </div>
          </Card>

          {sectionResults?.length > 0 && (
            <Card className="p-6 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Section Breakdown
              </h3>
              {sectionResults.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-1/3 text-sm font-medium truncate">{s.name}</span>
                  <Progress value={s.percent} className="flex-1 h-2" />
                  <span className="text-sm font-semibold w-12 text-right">
                    {s.correct}/{s.total}
                  </span>
                </div>
              ))}
            </Card>
          )}

          <div className="text-center">
            <Link href="/">
              <Button variant="brand" className="gap-2">
                <Zap className="h-4 w-4" /> Try ExamAI
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Shared profile card
  if (resultType === 'profile') {
    const { name, levelInfo, badges, streak, totalExams, totalCoding, totalInterviews, bestScore } = data;
    const level = levelInfo?.level || 1;
    const levelTitle = levelInfo?.title || 'Beginner';
    const xp = levelInfo?.xp || 0;
    const xpForNext = levelInfo?.xpForNext || 100;
    const progress = levelInfo?.progress || 0;
    const badgeList = badges || [];

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">
              👤 Shared <span className="gradient-text">Profile</span>
            </h1>
            <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" /> {viewCount} views
              </span>
              <span>•</span>
              <span>{new Date(createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Avatar + Name + Level */}
          <Card className="p-8 text-center">
            <div className="relative inline-flex items-center justify-center w-24 h-24 mx-auto mb-4">
              {/* Circular progress ring */}
              <svg width="96" height="96" className="-rotate-90 absolute inset-0" aria-hidden="true">
                <circle
                  cx="48"
                  cy="48"
                  r="43"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-muted/30"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="43"
                  fill="none"
                  stroke="url(#sharedLevelGrad)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 43}
                  strokeDashoffset={2 * Math.PI * 43 - (progress / 100) * 2 * Math.PI * 43}
                  className="transition-[stroke-dashoffset] duration-700 ease-out"
                />
                <defs>
                  <linearGradient id="sharedLevelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(280 80% 60%)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
                {(name || 'U').charAt(0).toUpperCase()}
              </div>
            </div>
            <h2 className="text-xl font-bold">{name || 'User'}</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Lv. {level} — {levelTitle}
            </p>

            {/* XP progress */}
            <div className="max-w-xs mx-auto mt-3">
              <div className="h-2 w-full rounded-full bg-muted/30 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {xp} XP · {xpForNext} XP to next level
              </p>
            </div>
          </Card>

          {/* Stats grid */}
          <Card className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-3 rounded-lg bg-secondary/20">
                <div className="text-xl font-bold">📝 {totalExams || 0}</div>
                <div className="text-xs text-muted-foreground">Exams</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/20">
                <div className="text-xl font-bold">💻 {totalCoding || 0}</div>
                <div className="text-xs text-muted-foreground">Coding</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/20">
                <div className="text-xl font-bold">🎤 {totalInterviews || 0}</div>
                <div className="text-xs text-muted-foreground">Interviews</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/20">
                <div className="text-xl font-bold">🔥 {streak || 0}</div>
                <div className="text-xs text-muted-foreground">Day Streak</div>
              </div>
            </div>
            {bestScore != null && (
              <div className="text-center mt-4 pt-4 border-t border-border/50">
                <span className="text-sm text-muted-foreground">Best Score: </span>
                <span className="text-lg font-bold">🎯 {bestScore}%</span>
              </div>
            )}
          </Card>

          {/* Badges */}
          {badgeList.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-3">🏅 Badges ({badgeList.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {badgeList.map((badge) => (
                  <div key={badge.id} className="p-3 rounded-xl bg-secondary/30 border border-border/50 text-center">
                    <div className="text-2xl mb-1">{badge.emoji}</div>
                    <div className="text-xs font-semibold">{badge.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{badge.description}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="text-center">
            <Link href="/">
              <Button variant="brand" className="gap-2">
                <Zap className="h-4 w-4" /> Try ExamAI
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Generic result display for coding/interview
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            📊 Shared <span className="gradient-text">Results</span>
          </h1>
          <p className="text-muted-foreground mt-1">{title}</p>
        </div>
        <Card className="p-8 text-center">
          <div className="text-4xl mb-4">{resultType === 'coding' ? '💻' : '🎤'}</div>
          <div className="text-3xl font-bold">{data.percent}%</div>
          <p className="text-muted-foreground mt-2">{data.grade || 'Completed'}</p>
        </Card>
        <div className="text-center">
          <Link href="/">
            <Button variant="brand" className="gap-2">
              <Zap className="h-4 w-4" /> Try ExamAI
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SharedResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Skeleton className="h-9 w-64 mx-auto" />
            <Skeleton className="h-4 w-40 mx-auto" />
          </div>
        </div>
      }
    >
      <SharedResultContent />
    </Suspense>
  );
}
