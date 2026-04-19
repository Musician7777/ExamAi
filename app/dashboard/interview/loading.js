import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function InterviewLoading() {
  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <Skeleton className="h-10 w-64 mx-auto mb-2" />
        <Skeleton className="h-5 w-96 mx-auto" />
      </div>

      {/* Template cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-10 w-10 rounded mb-4" />
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-40 mb-4" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-5 w-14 rounded-md" />
              <Skeleton className="h-5 w-16 rounded-md" />
              <Skeleton className="h-5 w-12 rounded-md" />
            </div>
          </Card>
        ))}
      </div>

      {/* Bottom controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 bg-secondary/20 rounded-2xl border">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
        <Skeleton className="h-14 w-56 rounded-md" />
      </div>
    </div>
  );
}
