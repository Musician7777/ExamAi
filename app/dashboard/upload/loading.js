import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function UploadLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Upload area */}
      <Card className="p-12 flex flex-col items-center justify-center text-center border-dashed border-2">
        <Skeleton className="h-12 w-12 rounded mb-3" />
        <Skeleton className="h-6 w-36 mb-2" />
        <Skeleton className="h-4 w-32 mb-3" />
        <Skeleton className="h-6 w-12 rounded-full" />
      </Card>
    </div>
  );
}
