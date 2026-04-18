'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function NotFound() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background px-4">
            <Card className="max-w-md w-full p-8 text-center space-y-6 border-border shadow-lg">
                <div className="text-7xl font-black gradient-text">404</div>
                <h1 className="text-2xl font-bold text-foreground">Page Not Found</h1>
                <p className="text-muted-foreground leading-relaxed">
                    Looks like this page doesn&apos;t exist. Maybe the question was too hard even for AI. 🤖
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <Button asChild size="lg" className="gap-2">
                        <Link href="/dashboard">← Back to Dashboard</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                        <Link href="/">Go Home</Link>
                    </Button>
                </div>
            </Card>
        </div>
    );
}
