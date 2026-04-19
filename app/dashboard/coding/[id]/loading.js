import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function CodingEditorLoading() {
  return (
    <div className="h-[calc(100vh-theme(spacing.16))] flex flex-col lg:flex-row p-4 gap-4 bg-background">
      {/* Problem description panel */}
      <Card className="flex-1 flex flex-col overflow-hidden border-border bg-card/50">
        <div className="p-4 border-b flex items-center justify-between">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-5 w-16 rounded-md" />
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div>
            <Skeleton className="h-7 w-48 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-4/5 mb-2" />
            <Skeleton className="h-4 w-3/5" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-5 w-20" />
            <div className="grid gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="bg-secondary/30 p-4 rounded-xl border space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-5 w-24" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-32 rounded-md" />
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Editor panel */}
      <div className="flex-1 lg:flex-[1.5] xl:flex-[2] flex flex-col gap-4">
        <Card className="flex-[2] flex flex-col overflow-hidden border-border shadow-sm bg-card">
          <div className="flex items-center justify-between p-2 border-b bg-muted/20">
            <Skeleton className="h-9 w-[180px] rounded-md" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24 rounded-md" />
              <Skeleton className="h-9 w-28 rounded-md" />
            </div>
          </div>
          <div className="flex-1 bg-[#1e1e1e] p-4 space-y-3">
            {['40%', '70%', '55%', '65%', '45%', '60%', '50%', '35%', '68%', '42%', '58%', '33%'].map((w, i) => (
              <Skeleton key={i} className="h-4" style={{ width: w }} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
