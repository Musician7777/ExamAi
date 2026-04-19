import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfileLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Profile card */}
      <Card className="p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <Skeleton className="w-20 h-20 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-4 w-full">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-56" />
                <Skeleton className="h-9 w-16" />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
        </div>
      </Card>

      {/* Achievements card */}
      <Card className="p-6 md:p-8">
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border text-center space-y-2">
              <Skeleton className="h-8 w-16 mx-auto" />
              <Skeleton className="h-4 w-20 mx-auto" />
              <Skeleton className="h-3 w-12 mx-auto" />
            </div>
          ))}
        </div>
        <div className="space-y-2 mb-6">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-3 w-full rounded-full" />
        </div>
        <Skeleton className="h-px w-full my-6" />
        <Skeleton className="h-4 w-24 mb-3" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-3 rounded-xl border text-center space-y-1.5">
              <Skeleton className="h-6 w-6 rounded mx-auto" />
              <Skeleton className="h-3 w-16 mx-auto" />
              <Skeleton className="h-2 w-20 mx-auto" />
            </div>
          ))}
        </div>
        <Skeleton className="h-px w-full my-6" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center p-3 rounded-lg space-y-1">
              <Skeleton className="h-6 w-16 mx-auto" />
              <Skeleton className="h-3 w-12 mx-auto" />
            </div>
          ))}
        </div>
      </Card>

      {/* Password card */}
      <Card className="p-6 md:p-8">
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-36" />
        </div>
        <div className="space-y-4 max-w-sm">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
          <Skeleton className="h-9 w-32" />
        </div>
      </Card>
    </div>
  );
}
