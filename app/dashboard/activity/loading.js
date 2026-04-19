import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ActivityLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4 text-center">
            <Skeleton className="h-7 w-10 mx-auto mb-1" />
            <Skeleton className="h-4 w-24 mx-auto" />
          </Card>
        ))}
      </div>

      {/* Activity list */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-6 rounded" />
                <div>
                  <Skeleton className="h-4 w-44 mb-1" />
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-20 rounded-md" />
                    <Skeleton className="h-4 w-14 rounded-md" />
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Skeleton className="h-5 w-14 mb-1" />
                <Skeleton className="h-3 w-10" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
