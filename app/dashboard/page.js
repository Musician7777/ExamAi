'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useCachedFetch } from '@/hooks/useCachedFetch';
import { Zap, Code, MessageSquare, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { RefreshShimmer } from '@/components/ui/refresh-shimmer';
import ExamConfigModal from '../components/ExamConfigModal/ExamConfigModal';
import { cn } from '@/lib/utils';

const quickActions = [
  {
    icon: <Zap className="h-5 w-5" />,
    bg: 'bg-indigo-500/10',
    color: 'text-indigo-400',
    href: '/dashboard/generate',
    title: 'Generate Exam',
    desc: 'Create AI-powered test',
    mode: 'exam',
    emoji: '📝',
  },
  {
    icon: <Code className="h-5 w-5" />,
    bg: 'bg-emerald-500/10',
    color: 'text-emerald-400',
    href: '/dashboard/coding',
    title: 'Coding Challenge',
    desc: 'Practice DSA problems',
    mode: 'coding',
    emoji: '💻',
  },
  {
    icon: <MessageSquare className="h-5 w-5" />,
    bg: 'bg-pink-500/10',
    color: 'text-pink-400',
    href: '/dashboard/interview',
    title: 'Mock Interview',
    desc: 'AI interview simulation',
    mode: 'interview',
    emoji: '🎤',
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    bg: 'bg-sky-500/10',
    color: 'text-sky-400',
    href: '/dashboard/analytics',
    title: 'View Analytics',
    desc: 'Performance insights',
    mode: null,
    emoji: '📊',
  },
];

function GamificationWidget({ gamData, loading }) {
  if (loading)
    return (
      <Card className="p-5 space-y-4" aria-label="Gamification loading">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-full" />
      </Card>
    );
  if (!gamData) return null;

  const level = gamData.levelInfo || { level: 1, title: 'Beginner', xp: 0, xpForNext: 100, progress: 0 };
  const streak = gamData.currentStreak || 0;
  const badges = gamData.badgeDetails || [];
  const recentBadges = badges.slice(-3).reverse();

  return (
    <Card className="p-5 space-y-4" aria-label="Your progress">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">🏆 Your Progress</h3>
        <Link href="/dashboard/profile" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
          View all →
        </Link>
      </div>

      {/* Level & XP */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">
            Lv.{level.level} — {level.title}
          </span>
          <span className="text-muted-foreground">{level.xp} XP</span>
        </div>
        <Progress
          value={level.progress}
          className="h-2.5"
          aria-label={`Level ${level.level} progress: ${Math.round(level.progress)}%`}
        />
        {level.nextLevel && (
          <p className="text-xs text-muted-foreground">
            {level.xpForNext} XP to Level {level.level + 1}
          </p>
        )}
      </div>

      {/* Streak & Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-lg bg-orange-500/5 border border-orange-500/10">
          <div className="text-lg font-bold text-orange-400">🔥 {streak}</div>
          <div className="text-[10px] text-muted-foreground">Streak</div>
        </div>
        <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
          <div className="text-lg font-bold text-emerald-400">{badges.length}</div>
          <div className="text-[10px] text-muted-foreground">Badges</div>
        </div>
        <div className="p-2 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
          <div className="text-lg font-bold text-indigo-400">{gamData.totalExams || 0}</div>
          <div className="text-[10px] text-muted-foreground">Exams</div>
        </div>
      </div>

      {/* Recent Badges */}
      {recentBadges.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-semibold">Recent Badges</p>
          <div className="flex gap-2">
            {recentBadges.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-secondary/30 text-xs"
                title={b.description}
              >
                <span>{b.emoji}</span>
                <span className="font-medium">{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const firstName = session?.user?.name?.split(' ')[0] || 'there';
  const {
    data: dashData,
    loading: dashLoading,
    revalidating: dashRevalidating,
  } = useCachedFetch('/api/dashboard', {
    ttl: 60_000, // 60s
    selector: (json) => json,
  });

  const {
    data: gamData,
    loading: gamLoading,
    revalidating: gamRevalidating,
  } = useCachedFetch('/api/gamification', {
    ttl: 60_000,
    selector: (json) => json.profile,
  });

  const loading = dashLoading || gamLoading;
  const revalidating = !loading && (dashRevalidating || gamRevalidating);

  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [configModalMode, setConfigModalMode] = useState('exam');
  const [configModalPreset, setConfigModalPreset] = useState({ name: '', emoji: '' });

  function handleQuickAction(action) {
    if (!action.mode) {
      router.push(action.href);
      return;
    }
    setConfigModalMode(action.mode);
    setConfigModalPreset({ name: action.title, emoji: action.emoji });
    setConfigModalOpen(true);
  }

  function handleConfigGenerate(config) {
    setConfigModalOpen(false);
    sessionStorage.setItem('examConfigModalResult', JSON.stringify({ mode: configModalMode, config }));
    const targetHref = quickActions.find((a) => a.mode === configModalMode)?.href;
    if (targetHref) router.push(targetHref);
  }

  const stats = dashData
    ? [
        {
          icon: '📝',
          bg: 'bg-indigo-500/10',
          value: String(dashData.stats.totalActivities),
          label: 'Activities',
          change: `${dashData.stats.examCount} exams`,
        },
        {
          icon: '🎯',
          bg: 'bg-emerald-500/10',
          value: `${dashData.stats.avgScore}%`,
          label: 'Avg. Score',
          change: dashData.stats.avgScore >= 70 ? 'Great!' : 'Keep going',
        },
        {
          icon: '💻',
          bg: 'bg-sky-500/10',
          value: String(dashData.stats.codingCount),
          label: 'Coding Done',
          change: `${dashData.stats.interviewCount} interviews`,
        },
        {
          icon: '🏆',
          bg: 'bg-amber-500/10',
          value: dashData.stats.avgScore >= 80 ? 'Top 20%' : dashData.stats.avgScore >= 60 ? 'Top 50%' : '—',
          label: 'Ranking',
          change: dashData.stats.totalActivities > 0 ? 'Based on score' : 'Start practicing',
        },
      ]
    : [
        { icon: '📝', bg: 'bg-indigo-500/10', value: '0', label: 'Activities', change: 'Get started!' },
        { icon: '🎯', bg: 'bg-emerald-500/10', value: '—', label: 'Avg. Score', change: 'No data yet' },
        { icon: '💻', bg: 'bg-sky-500/10', value: '0', label: 'Coding Done', change: 'Try a challenge' },
        { icon: '🏆', bg: 'bg-amber-500/10', value: '—', label: 'Ranking', change: 'Start practicing' },
      ];

  return (
    <div className="space-y-8 relative">
      <RefreshShimmer active={revalidating} />
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, <span className="gradient-text">{firstName}</span> 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here is your preparation overview. Keep pushing!</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-lg', s.bg)}>{s.icon}</div>
              <span className="text-xs text-emerald-400 font-medium">{s.change}</span>
            </div>
            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-7 w-16" /> : s.value}</div>
            <div className="text-sm text-muted-foreground mt-0.5">{s.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-3 space-y-6">
          <GamificationWidget gamData={gamData} loading={loading} />
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            {loading ? (
              <div className="space-y-3 py-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-5 w-5 rounded" />
                      <div>
                        <Skeleton className="h-4 w-40 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <div className="text-right">
                      <Skeleton className="h-5 w-12 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : dashData?.recentActivities?.length > 0 ? (
              <div className="space-y-3">
                {dashData.recentActivities.map((activity, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div>
                      <h4 className="text-sm font-medium">
                        {activity.type === 'coding' ? '💻' : activity.type === 'exam' ? '📝' : '🎤'} {activity.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">{activity.date}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold gradient-text">{activity.score}</span>
                      <p className="text-xs text-muted-foreground">{activity.total}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-2xl mb-2">🚀</p>
                <p className="text-muted-foreground text-sm mb-1">No activity yet</p>
                <p className="text-xs text-muted-foreground">
                  Take an exam, solve a coding challenge, or try an interview to see your progress here.
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-3">
          {quickActions.map((action, i) => (
            <Card
              key={i}
              className="p-4 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-indigo-500/20 transition-all"
              onClick={() => handleQuickAction(action)}
            >
              <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', action.bg, action.color)}>
                {action.icon}
              </div>
              <div>
                <h4 className="text-sm font-semibold">{action.title}</h4>
                <p className="text-xs text-muted-foreground">{action.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <ExamConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        onGenerate={handleConfigGenerate}
        mode={configModalMode}
        presetName={configModalPreset.name}
        presetEmoji={configModalPreset.emoji}
        examType=""
      />
    </div>
  );
}
