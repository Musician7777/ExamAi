import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ExamLiveLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border rounded-xl p-4 sm:p-6 shadow-sm">
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-12 w-32 rounded-lg" />
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          {/* Question card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-5 w-16 rounded-md" />
            </div>
            <Skeleton className="h-1 w-full mb-6 rounded-full" />
            <Skeleton className="h-6 w-full mb-3" />
            <Skeleton className="h-6 w-4/5 mb-3" />
            <Skeleton className="h-6 w-3/5 mb-8" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border-2">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <Skeleton className="h-5 flex-1" />
                </div>
              ))}
            </div>
          </Card>

          {/* Navigation buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-24 rounded-md" />
              <Skeleton className="h-10 w-20 rounded-md" />
              <Skeleton className="h-10 w-16 rounded-md" />
            </div>
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>
        </div>

        {/* Question navigator sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-5">
            <Skeleton className="h-5 w-28 mb-4 mx-auto" />
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 20 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-md" />
              ))}
            </div>
            <div className="mt-6 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="w-3 h-3 rounded-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
            <Skeleton className="h-10 w-full mt-6 rounded-md" />
          </Card>
        </div>
      </div>
    </div>
  );
}
