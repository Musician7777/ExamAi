import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AnalyticsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div>
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-3 w-16 mt-1" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tab bar */}
      <Skeleton className="h-11 w-80 rounded-lg" />

      {/* Charts */}
      <Card className="p-6">
        <Skeleton className="h-5 w-28 mb-4" />
        <div className="h-72">
          <Skeleton className="h-full w-full rounded-lg" />
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <Skeleton className="h-5 w-36 mb-4" />
          <div className="h-64">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        </Card>
        <Card className="p-6">
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="h-64">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        </Card>
      </div>

      {/* Insight cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-5 flex items-start gap-4">
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
