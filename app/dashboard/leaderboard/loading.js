import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function LeaderboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Table */}
      <Card>
        <div className="p-4 border-b">
          <div className="grid grid-cols-6 gap-4">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
        <div className="divide-y">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="p-4 grid grid-cols-6 gap-4 items-center">
              <Skeleton className="h-6 w-8" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-5 w-12 rounded-md" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-10" />
            </div>
          ))}
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-4">
        <Skeleton className="h-8 w-24 rounded-md" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
    </div>
  );
}
