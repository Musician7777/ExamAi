import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-7 w-16 mb-1" />
            <Skeleton className="h-4 w-20" />
          </Card>
        ))}
      </div>

      {/* Main content area */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left column - Gamification + Recent Activity */}
        <div className="lg:col-span-3 space-y-6">
          {/* Gamification widget */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-2.5 w-full rounded-full" />
              <Skeleton className="h-3 w-36" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-2 rounded-lg border">
                  <Skeleton className="h-6 w-12 mx-auto mb-1" />
                  <Skeleton className="h-3 w-10 mx-auto" />
                </div>
              ))}
            </div>
          </Card>

          {/* Recent activity */}
          <Card className="p-6">
            <Skeleton className="h-5 w-28 mb-4" />
            <div className="space-y-3">
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
                    <Skeleton className="h-5 w-12 mb-1 ml-auto" />
                    <Skeleton className="h-3 w-16 ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right column - Quick Actions */}
        <div className="lg:col-span-2 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4 flex items-center gap-4">
              <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
              <div>
                <Skeleton className="h-4 w-28 mb-1" />
                <Skeleton className="h-3 w-36" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
