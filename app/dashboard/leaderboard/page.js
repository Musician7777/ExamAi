'use client';
import { useState } from 'react';
import { useCachedFetch } from '@/hooks/useCachedFetch';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshShimmer } from '@/components/ui/refresh-shimmer';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import AdBanner from '@/app/components/AdBanner/AdBanner';

export default function LeaderboardPage() {
  const [page, setPage] = useState(1);

  const {
    data: leaderboardData,
    loading,
    revalidating,
  } = useCachedFetch(`/api/leaderboard?page=${page}&limit=20`, {
    deps: [page],
    ttl: 120_000, // 2 min — leaderboard changes less frequently
    selector: (json) => ({ users: json.users || [], totalPages: json.totalPages || 1 }),
  });

  const leaderboard = leaderboardData?.users || [];
  const totalPages = leaderboardData?.totalPages || 1;

  const rankEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          🏆 Global <span className="gradient-text">Leaderboard</span>
        </h1>
        <p className="text-muted-foreground mt-1">Top performers ranked by experience points earned</p>
      </div>

      <Card className="relative overflow-hidden">
        <RefreshShimmer active={revalidating && !loading} />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Rank</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>XP</TableHead>
              <TableHead>Streak</TableHead>
              <TableHead>Badges</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i} className={cn(i < 3 && 'bg-indigo-500/5')}>
                  <TableCell>
                    <Skeleton className="h-6 w-8" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-14 rounded-md" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-10" />
                  </TableCell>
                </TableRow>
              ))
            ) : leaderboard.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <EmptyState
                    emoji="🏆"
                    title="No rankings yet"
                    description="Complete activities to appear on the leaderboard!"
                    action={{
                      label: 'Start an Activity',
                      href: '/dashboard/generate'
                    }}
                  />
                </TableCell>
              </TableRow>
            ) : (
              leaderboard.map((user) => (
                <TableRow key={user.rank} className={cn(user.rank <= 3 && 'bg-indigo-500/5')}>
                  <TableCell className="font-bold text-lg">{rankEmoji(user.rank)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {user.displayName?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.displayName || 'User'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="brand" className="text-[10px]">
                        Lv.{user.level?.level || 1}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{user.level?.title || 'Beginner'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{(user.xp || 0).toLocaleString()} XP</TableCell>
                  <TableCell>{user.streak > 0 ? `🔥 ${user.streak}d` : '—'}</TableCell>
                  <TableCell>{user.badges > 0 ? `${user.badges} 🏅` : '—'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ← Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next →
          </Button>
        </div>
      )}

      {/* Non-intrusive ad placement — only shows when slot is configured */}
      <AdBanner slot={process.env.NEXT_PUBLIC_AD_SLOT_LEADERBOARD || ''} format="auto" className="mt-6" />
    </div>
  );
}
