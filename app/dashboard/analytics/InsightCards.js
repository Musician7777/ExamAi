'use client';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function InsightCards({ insights }) {
    return (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((ins, i) => (
                <Card key={i} className="p-5 flex items-start gap-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0", ins.bg)}>{ins.icon}</div>
                    <div>
                        <h4 className="text-sm font-semibold">{ins.title}</h4>
                        <p className="text-sm text-muted-foreground mt-0.5">{ins.desc}</p>
                    </div>
                </Card>
            ))}
        </div>
    );
}
