'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useNotification } from '@/app/components/BadgeNotification/BadgeNotification';
import { HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineMinusCircle, HiOutlineLightBulb, HiOutlineClock } from 'react-icons/hi';
import { BarChart3 } from 'lucide-react';

export default function ResultsPage() {
    const router = useRouter();
    const { notify } = useNotification();
    const [data, setData] = useState(null);
    const savedRef = useRef(false);

    useEffect(() => {
        const stored = sessionStorage.getItem('examResults');
        if (stored) {
            const parsed = JSON.parse(stored);
            setData(parsed);
            // Save to database (once)
            if (!savedRef.current) {
                savedRef.current = true;
                const correct = parsed.results?.filter(r => r.isCorrect).length || 0;
                fetch('/api/activities', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'exam',
                        title: parsed.exam?.title || 'Untitled Exam',
                        score: parsed.score || 0,
                        totalMarks: parsed.totalMarks || 100,
                        details: {
                            correct: parsed.correct,
                            wrong: parsed.wrong,
                            unanswered: parsed.unanswered,
                            timeTaken: parsed.timeTaken,
                            sectionCount: parsed.exam?.sections?.length || 0,
                        },
                    }),
                }).then(async (res) => {
                        if (res.ok) {
                            const result = await res.json();
                            if (result.xp?.xpAwarded) {
                                notify({ emoji: '✨', title: `+${result.xp.xpAwarded} XP earned!`, description: result.xp.newBadges?.length > 0 ? `New badge: ${result.xp.newBadges.map(b => b.emoji + ' ' + b.name).join(', ')}` : undefined });
                            }
                        }
                    }).catch(err => console.error('Failed to save exam activity:', err));
            }
        } else {
            router.push('/dashboard/generate');
        }
    }, [router]);

    if (!data) return null;

    const { exam, results, score, totalMarks, correct, wrong, unanswered, timeTaken } = data;
    const percent = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
    const grade = percent >= 90 ? 'Excellent!' : percent >= 75 ? 'Great Job!' : percent >= 50 ? 'Good Effort!' : 'Keep Practicing!';
    const minsUsed = Math.floor(timeTaken / 60);

    // Section-wise breakdown
    const sectionResults = exam.sections.map(section => {
        const sectionQs = results.filter(r => section.questions.some(q => q.id === r.id));
        const sectionCorrect = sectionQs.filter(r => r.isCorrect).length;
        return { name: section.name, correct: sectionCorrect, total: sectionQs.length, percent: sectionQs.length > 0 ? Math.round((sectionCorrect / sectionQs.length) * 100) : 0 };
    });

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold">📊 Exam <span className="gradient-text">Results</span></h1>
                <p className="text-muted-foreground mt-2">Here is a detailed breakdown of your performance.</p>
            </div>

            <Card className="p-8 text-center bg-gradient-to-br from-card to-secondary/20">
                <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-primary/20 mb-6 relative">
                    <div className="absolute inset-0 rounded-full border-8 border-primary transition-all duration-1000" style={{ clipPath: `polygon(0 0, 100% 0, 100% ${percent}%, 0 ${percent}%)`, transform: 'rotate(-90deg)', transformOrigin: 'center' }} />
                    <span className="text-4xl font-bold">{percent}%</span>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-8">{grade}</h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
                    <div className="p-4 rounded-xl bg-background border flex flex-col items-center">
                        <HiOutlineCheckCircle className="h-8 w-8 text-success mb-2" />
                        <span className="text-2xl font-bold text-success">{correct}</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Correct</span>
                    </div>
                    <div className="p-4 rounded-xl bg-background border flex flex-col items-center">
                        <HiOutlineXCircle className="h-8 w-8 text-destructive mb-2" />
                        <span className="text-2xl font-bold text-destructive">{wrong}</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Wrong</span>
                    </div>
                    <div className="p-4 rounded-xl bg-background border flex flex-col items-center">
                        <HiOutlineMinusCircle className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-2xl font-bold text-foreground">{unanswered}</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Skipped</span>
                    </div>
                    <div className="p-4 rounded-xl bg-background border flex flex-col items-center">
                        <HiOutlineClock className="h-8 w-8 text-primary mb-2" />
                        <span className="text-2xl font-bold text-foreground">{minsUsed}m</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Time</span>
                    </div>
                </div>
            </Card>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Section-wise Breakdown</h2>
                <div className="grid gap-3">
                    {sectionResults.map((s, i) => (
                        <Card key={i} className="p-4 flex items-center gap-4">
                            <div className="w-1/3 font-medium truncate">{s.name}</div>
                            <div className="flex-1">
                                <Progress value={s.percent} className="h-2" />
                            </div>
                            <div className="w-16 text-right font-semibold text-sm">{s.correct}/{s.total}</div>
                        </Card>
                    ))}
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-xl font-semibold">Question Review</h2>
                <div className="space-y-4">
                    {results.map((r, i) => (
                        <Card key={i} className={cn("p-6 border-l-4", r.userAnswer === null ? "border-l-muted" : r.isCorrect ? "border-l-success" : "border-l-destructive")}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                                <span className="font-semibold text-muted-foreground">Q{i + 1} • {r.topic}</span>
                                <Badge variant={r.userAnswer === null ? "outline" : r.isCorrect ? "success" : "destructive"}>
                                    {r.userAnswer === null ? 'Skipped' : r.isCorrect ? '✓ Correct' : '✗ Wrong'}
                                </Badge>
                            </div>
                            <p className="text-lg mb-4">{r.text}</p>
                            
                            <div className="space-y-2 mb-4 text-sm bg-secondary/30 p-4 rounded-lg">
                                {r.userAnswer !== null && !r.isCorrect && (
                                    <p className="text-destructive">Your answer: <span className="font-semibold">{r.options[r.userAnswer]}</span></p>
                                )}
                                <p className="text-success">Correct answer: <span className="font-semibold">{r.options[r.correct]}</span></p>
                            </div>

                            <Alert className="bg-primary/5 text-primary-foreground/90 border-primary/20">
                                <HiOutlineLightBulb className="h-5 w-5 text-primary" />
                                <AlertTitle className="text-primary font-semibold">Explanation</AlertTitle>
                                <AlertDescription className="text-foreground mt-1 leading-relaxed">
                                    {r.explanation}
                                </AlertDescription>
                            </Alert>
                        </Card>
                    ))}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-border">
                <Button asChild size="lg" className="w-full sm:w-auto">
                    <Link href="/dashboard/generate">Generate New Exam</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                    <Link href="/dashboard/analytics">View Analytics</Link>
                </Button>
            </div>
        </div>
    );
}
