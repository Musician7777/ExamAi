import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function InterviewLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-96 mt-2" />
      </div>

      {/* Template cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Card key={i} className="p-5 flex flex-col items-center gap-2">
            <Skeleton className="h-8 w-8 rounded mb-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
            <div className="flex gap-1 mt-1">
              <Skeleton className="h-4 w-12 rounded-full" />
              <Skeleton className="h-4 w-14 rounded-full" />
            </div>
          </Card>
        ))}
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-between flex-wrap gap-4 p-4 bg-secondary/20 rounded-xl border">
        <div className="flex gap-3">
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
        <Skeleton className="h-11 w-48 rounded-full" />
      </div>
    </div>
  );
}
