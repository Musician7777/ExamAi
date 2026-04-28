import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export default function PathwayLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5">
            <Skeleton className="h-10 w-10 rounded-xl mb-3" />
            <Skeleton className="h-6 w-20 mb-1" />
            <Skeleton className="h-4 w-24" />
          </Card>
        ))}
      </div>
      <Card className="p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid sm:grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-40 w-full" />
      </Card>
    </div>
  );
}
