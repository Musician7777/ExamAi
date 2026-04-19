import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function GenerateLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Tabs */}
      <div className="space-y-6">
        <div className="flex gap-1">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>

        {/* Government presets */}
        <div>
          <Skeleton className="h-4 w-36 mb-3" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="p-5 flex flex-col items-center gap-2 text-center">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-24" />
              </Card>
            ))}
          </div>
        </div>

        {/* Private presets */}
        <div>
          <Skeleton className="h-4 w-32 mb-3" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="p-5 flex flex-col items-center gap-2 text-center">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </Card>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <Skeleton className="h-11 w-40 rounded-md" />
      </div>
    </div>
  );
}
