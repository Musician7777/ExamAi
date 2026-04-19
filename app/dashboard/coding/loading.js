import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function CodingLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Difficulty filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-md" />
        ))}
      </div>

      {/* Presets grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-5 flex flex-col items-center gap-2 text-center">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-28" />
          </Card>
        ))}
      </div>

      {/* Problem list */}
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <div>
                <Skeleton className="h-4 w-32 mb-1" />
                <div className="flex gap-1.5">
                  <Skeleton className="h-4 w-12 rounded-md" />
                  <Skeleton className="h-4 w-14 rounded-md" />
                </div>
              </div>
            </div>
            <Skeleton className="h-5 w-14 rounded-md" />
          </Card>
        ))}
      </div>
    </div>
  );
}
