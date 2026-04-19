import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ExamResultsLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Score card */}
      <Card className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-32 h-32 rounded-full mb-6 mx-auto">
          <Skeleton className="w-32 h-32 rounded-full" />
        </div>
        <Skeleton className="h-7 w-24 mx-auto mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl bg-background border flex flex-col items-center">
              <Skeleton className="h-8 w-8 rounded mb-2" />
              <Skeleton className="h-6 w-8 mb-1" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
      </Card>

      {/* Section breakdown */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-44" />
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4 flex items-center gap-4">
              <Skeleton className="h-4 w-1/3" />
              <div className="flex-1">
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
              <Skeleton className="h-4 w-14" />
            </Card>
          ))}
        </div>
      </div>

      {/* Question review */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-6 border-l-4">
              <div className="flex justify-between mb-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-16 rounded-md" />
              </div>
              <Skeleton className="h-5 w-full mb-2" />
              <Skeleton className="h-5 w-4/5 mb-4" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
