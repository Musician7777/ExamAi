import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AnalyticsLoadingSkeleton() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">📊 Performance <span className="gradient-text">Analytics</span></h1>
                <p className="text-muted-foreground mt-1">Loading your performance data...</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card className="md:col-span-2 p-6">
                    <Skeleton className="h-5 w-28 mb-4" />
                    <div className="h-64"><Skeleton className="h-full w-full rounded-lg" /></div>
                </Card>
                <Card className="p-6">
                    <Skeleton className="h-5 w-36 mb-4" />
                    <div className="h-64"><Skeleton className="h-full w-full rounded-lg" /></div>
                </Card>
                <Card className="p-6">
                    <Skeleton className="h-5 w-32 mb-4" />
                    <div className="h-64"><Skeleton className="h-full w-full rounded-lg" /></div>
                </Card>
                <Card className="md:col-span-2 p-6">
                    <Skeleton className="h-5 w-40 mb-4" />
                    <div className="h-64 max-w-[350px] mx-auto"><Skeleton className="h-full w-full rounded-lg" /></div>
                </Card>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="p-5 flex items-start gap-4">
                        <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-full" />
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
