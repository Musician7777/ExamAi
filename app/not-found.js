'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GraduationCap, Code, MessageSquare, BarChart3, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4 py-16">
      <div className="max-w-2xl w-full space-y-8">
        <Card className="p-8 text-center space-y-6 border-border shadow-lg">
          <div className="text-7xl font-black gradient-text">404</div>
          <h1 className="text-2xl font-bold text-foreground">Page Not Found</h1>
          <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
            The page you are looking for does not exist or may have been moved. Don&apos;t worry — there is plenty to
            explore on ExamAI.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild size="lg" className="gap-2">
              <Link href="/dashboard">
                <Home className="h-4 w-4" /> Go to Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="/">
                <Search className="h-4 w-4" /> Back to Home
              </Link>
            </Button>
          </div>
        </Card>

        {/* Helpful links with publisher content */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-center">Popular Sections</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              {
                icon: GraduationCap,
                title: 'Generate Exams',
                desc: 'Create AI-powered exam papers for UPSC, SSC, Banking, and more.',
                href: '/dashboard/generate',
              },
              {
                icon: Code,
                title: 'Coding Tests',
                desc: 'Practice DSA, debugging, and system design problems.',
                href: '/dashboard/coding',
              },
              {
                icon: MessageSquare,
                title: 'Interview Simulator',
                desc: 'Prepare with AI-powered technical and HR interviews.',
                href: '/dashboard/interview',
              },
              {
                icon: BarChart3,
                title: 'Analytics',
                desc: 'Track your performance and identify improvement areas.',
                href: '/dashboard/analytics',
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <Link key={i} href={item.href}>
                  <Card className="p-4 flex items-start gap-3 hover:shadow-md hover:border-indigo-500/20 transition-all duration-300 h-full">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{item.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          ExamAI — AI-powered exam generation and interview simulation platform.{' '}
          <Link href="/about" className="text-indigo-400 hover:underline">
            Learn more about us
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
