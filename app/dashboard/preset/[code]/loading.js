import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function PresetLoading() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Card className="p-8 sm:p-10 border-border bg-card shadow-sm space-y-8">
        <div className="flex items-start gap-4 sm:gap-6">
          <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-6 w-20 rounded-md" />
          <Skeleton className="h-6 w-24 rounded-md" />
          <Skeleton className="h-6 w-28 rounded-md" />
        </div>

        <div className="space-y-4 pt-4 border-t">
          <Skeleton className="h-6 w-28" />
          <div className="grid sm:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex justify-between items-center p-4 bg-secondary/30 rounded-xl border border-secondary/50"
              >
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t mt-8">
          <Skeleton className="h-14 flex-1 rounded-md" />
          <Skeleton className="h-14 flex-1 rounded-md" />
        </div>
      </Card>
    </div>
  );
}
