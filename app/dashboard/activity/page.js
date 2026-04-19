'use client';
import { useState, useCallback } from 'react';
import { Calendar, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { useCachedFetch } from '@/hooks/useCachedFetch';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshShimmer } from '@/components/ui/refresh-shimmer';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export default function ActivityPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ type: '', dateFrom: '', dateTo: '', minScore: '', difficulty: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  // Build URL with filters
  const buildUrl = useCallback(() => {
    const params = new URLSearchParams({ page, limit: 15 });
    if (filters.type) params.set('type', filters.type);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    if (filters.minScore) params.set('minScore', filters.minScore);
    if (filters.difficulty) params.set('difficulty', filters.difficulty);
    return `/api/activities?${params}`;
  }, [page, filters]);

  // Reset page to 1 when filters change (adjusting state during render)
  const [prevFilterKey, setPrevFilterKey] = useState(JSON.stringify(filters));
  const currentFilterKey = JSON.stringify(filters);
  if (prevFilterKey !== currentFilterKey) {
    setPrevFilterKey(currentFilterKey);
    setPage(1);
  }

  const {
    data: activitiesData,
    loading,
    revalidating,
  } = useCachedFetch(buildUrl(), {
    deps: [page, filters],
    ttl: 30_000, // 30s — activities change more often when user completes tasks
    selector: (json) => ({
      activities: json.activities || [],
      pagination: json.pagination || { page: 1, totalPages: 1, total: 0 },
    }),
  });

  const activities = activitiesData?.activities || [];
  const pagination = activitiesData?.pagination || { page: 1, totalPages: 1, total: 0 };

  const typeIcon = (type) => ({ exam: '📝', coding: '💻', interview: '🎤' })[type] || '📄';
  const scoreColor = (score, total) => {
    const pct = total > 0 ? (score / total) * 100 : 0;
    return pct >= 70 ? 'text-emerald-400' : pct >= 40 ? 'text-amber-400' : 'text-red-400';
  };

  return (
    <div className="space-y-6 relative">
      <RefreshShimmer active={revalidating && !loading} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            📊 Activity <span className="gradient-text">History</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your progress across exams, coding challenges, and interviews
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowFilters((v) => !v)} className="gap-2">
          <Filter className="h-4 w-4" /> Filters{' '}
          {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
      </div>

      {showFilters && (
        <Card className="p-5">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
              <select
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                value={filters.type}
                onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}
              >
                <option value="">All Types</option>
                <option value="exam">📝 Exams</option>
                <option value="coding">💻 Coding</option>
                <option value="interview">🎤 Interviews</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">From Date</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">To Date</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Min Score</label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minScore}
                onChange={(e) => setFilters((p) => ({ ...p, minScore: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Difficulty</label>
              <select
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                value={filters.difficulty}
                onChange={(e) => setFilters((p) => ({ ...p, difficulty: e.target.value }))}
              >
                <option value="">All</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3"
            onClick={() => setFilters({ type: '', dateFrom: '', dateTo: '', minScore: '', difficulty: '' })}
          >
            Clear All
          </Button>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4 text-center">
                <Skeleton className="h-7 w-10 mx-auto mb-1" />
                <Skeleton className="h-4 w-24 mx-auto" />
              </Card>
            ))
          : [
              { value: pagination.total, label: 'Total Activities' },
              { value: activities.filter((a) => a.type === 'exam').length, label: 'Exams' },
              { value: activities.filter((a) => a.type === 'coding').length, label: 'Coding' },
              { value: activities.filter((a) => a.type === 'interview').length, label: 'Interviews' },
            ].map((s, i) => (
              <Card key={i} className="p-4 text-center">
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </Card>
            ))}
      </div>

      {/* Activity List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-6 rounded" />
                  <div>
                    <Skeleton className="h-4 w-44 mb-1" />
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-20 rounded-md" />
                      <Skeleton className="h-4 w-14 rounded-md" />
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-5 w-14 mb-1" />
                  <Skeleton className="h-3 w-10" />
                </div>
              </div>
            </Card>
          ))
        ) : activities.length === 0 ? (
          <Card className="p-12 text-center">
            <span className="text-4xl">🔍</span>
            <h3 className="text-lg font-semibold mt-4">No activities found</h3>
            <p className="text-muted-foreground mt-1">Try adjusting your filters or start a new exam!</p>
          </Card>
        ) : (
          activities.map((activity) => (
            <Card
              key={activity._id}
              className="p-4 cursor-pointer hover:shadow-md transition-all"
              onClick={() => setExpandedId(expandedId === activity._id ? null : activity._id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{typeIcon(activity.type)}</span>
                  <div>
                    <h4 className="text-sm font-medium">{activity.title}</h4>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />{' '}
                        {new Date(activity.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {activity.type}
                      </Badge>
                      {activity.difficulty && (
                        <Badge
                          variant={
                            activity.difficulty === 'easy'
                              ? 'success'
                              : activity.difficulty === 'hard'
                                ? 'destructive'
                                : 'warning'
                          }
                          className="text-[10px]"
                        >
                          {activity.difficulty}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className={cn('text-lg font-bold', scoreColor(activity.score, activity.totalMarks))}>
                      {activity.score}/{activity.totalMarks}
                    </span>
                    <div className="text-xs text-muted-foreground">
                      {activity.totalMarks > 0 ? Math.round((activity.score / activity.totalMarks) * 100) : 0}%
                    </div>
                  </div>
                  {expandedId === activity._id ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {expandedId === activity._id && activity.details && (
                <>
                  <Separator className="my-3" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                    {Object.entries(activity.details).map(([key, value]) => (
                      <div key={key} className="flex justify-between p-2 rounded-md bg-secondary/50">
                        <span className="text-muted-foreground">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                        </span>
                        <span className="font-medium">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          ))
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ← Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </Button>
        </div>
      )}
    </div>
  );
}
