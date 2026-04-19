'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useNotification } from '@/app/components/BadgeNotification/BadgeNotification';
import { HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineMinusCircle, HiOutlineLightBulb, HiOutlineClock } from 'react-icons/hi';
import { BarChart3, RotateCcw, Share2, Copy, CheckCircle2 } from 'lucide-react';

export default function ResultsPage() {
    const router = useRouter();
    const { notify } = useNotification();
    const [data, setData] = useState(null);
    const savedRef = useRef(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [shareLoading, setShareLoading] = useState(false);
    const [copied, setCopied] = useState(false);

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
                            sections: parsed.exam?.sections?.map(s => s.name) || [],
                        },
                        tags: parsed.exam?.sections?.map(s => s.name) || [],
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
        const sectionTime = sectionQs.reduce((s, r) => s + (r.timeSpent || 0), 0);
        return { name: section.name, correct: sectionCorrect, total: sectionQs.length, percent: sectionQs.length > 0 ? Math.round((sectionCorrect / sectionQs.length) * 100) : 0, avgTime: sectionQs.length > 0 ? Math.round(sectionTime / sectionQs.length) : 0 };
    });

    // Average time per question
    const totalTimeSpent = results.reduce((s, r) => s + (r.timeSpent || 0), 0);
    const avgTimePerQ = results.length > 0 ? Math.round(totalTimeSpent / results.length) : 0;

    // Find fastest and slowest questions
    const questionsWithTime = results.map((r, i) => ({ ...r, index: i, timeSpent: r.timeSpent || 0 })).filter(q => q.timeSpent > 0);
    const fastestQ = questionsWithTime.length > 0 ? questionsWithTime.reduce((min, q) => q.timeSpent < min.timeSpent ? q : min, questionsWithTime[0]) : null;
    const slowestQ = questionsWithTime.length > 0 ? questionsWithTime.reduce((max, q) => q.timeSpent > max.timeSpent ? q : max, questionsWithTime[0]) : null;

    // Retry exam — regenerate with same config
    function handleRetry() {
        const config = {
            examType: exam.title || exam.examType || 'Custom',
            totalQuestions: results.length,
            sections: exam.sections.map(s => s.name),
            difficulty: '30% Easy, 50% Medium, 20% Hard',
            negativeMarking: exam.negativeMarking || 0,
            timeLimit: exam.duration || 60,
        };
        sessionStorage.setItem('examConfigModalResult', JSON.stringify({ mode: 'exam', config }));
        router.push('/dashboard/generate');
    }

    // Share results
    async function handleShare() {
        setShareLoading(true);
        setShareOpen(true);
        setCopied(false);
        try {
            const res = await fetch('/api/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'exam',
                    title: exam.title || 'Exam Results',
                    data: {
                        score,
                        totalMarks,
                        percent,
                        correct,
                        wrong,
                        unanswered,
                        timeTaken,
                        sectionResults,
                        grade,
                    },
                }),
            });
            const result = await res.json();
            if (res.ok && result.shareUrl) {
                setShareUrl(result.shareUrl);
            } else {
                setShareUrl('');
                notify({ emoji: '❌', title: 'Share failed', description: result.error || 'Could not generate share link' });
            }
        } catch (err) {
            console.error('Share error:', err);
            notify({ emoji: '❌', title: 'Share failed', description: 'Network error' });
        }
        setShareLoading(false);
    }

    function formatTime(seconds) {
        if (!seconds || seconds <= 0) return '—';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return m > 0 ? `${m}m ${s}s` : `${s}s`;
    }

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

            {/* Time Analysis */}
            {questionsWithTime.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2"><HiOutlineClock className="h-5 w-5 text-primary" /> Time Analysis</h2>
                    <div className="grid sm:grid-cols-3 gap-4">
                        <Card className="p-4 text-center">
                            <div className="text-2xl font-bold text-primary">{formatTime(avgTimePerQ)}</div>
                            <div className="text-xs text-muted-foreground mt-1">Avg. Time / Question</div>
                        </Card>
                        {fastestQ && (
                            <Card className="p-4 text-center">
                                <div className="text-2xl font-bold text-emerald-400">{formatTime(fastestQ.timeSpent)}</div>
                                <div className="text-xs text-muted-foreground mt-1">Fastest (Q{fastestQ.index + 1})</div>
                            </Card>
                        )}
                        {slowestQ && (
                            <Card className="p-4 text-center">
                                <div className="text-2xl font-bold text-amber-400">{formatTime(slowestQ.timeSpent)}</div>
                                <div className="text-xs text-muted-foreground mt-1">Slowest (Q{slowestQ.index + 1})</div>
                            </Card>
                        )}
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Section-wise Breakdown</h2>
                <div className="grid gap-3">
                    {sectionResults.map((s, i) => (
                        <Card key={i} className="p-4 flex items-center gap-4">
                            <div className="w-1/3 font-medium truncate">{s.name}</div>
                            <div className="flex-1">
                                <Progress value={s.percent} className="h-2" aria-label={`${s.name}: ${s.percent}%`} />
                            </div>
                            <div className="w-16 text-right font-semibold text-sm">{s.correct}/{s.total}</div>
                            {s.avgTime > 0 && (
                                <div className="w-16 text-right text-xs text-muted-foreground">~{formatTime(s.avgTime)}</div>
                            )}
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
                                <div className="flex items-center gap-2">
                                    {r.timeSpent > 0 && (
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <HiOutlineClock className="h-3 w-3" /> {formatTime(r.timeSpent)}
                                        </span>
                                    )}
                                    <Badge variant={r.userAnswer === null ? "outline" : r.isCorrect ? "success" : "destructive"}>
                                        {r.userAnswer === null ? 'Skipped' : r.isCorrect ? '✓ Correct' : '✗ Wrong'}
                                    </Badge>
                                </div>
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
                <Button size="lg" onClick={handleRetry} className="gap-2" aria-label="Retry this exam with same configuration but different questions">
                    <RotateCcw className="h-4 w-4" /> Retry This Exam
                </Button>
                <Button variant="outline" size="lg" onClick={handleShare} className="gap-2" aria-label="Share your exam results">
                    <Share2 className="h-4 w-4" /> Share Results
                </Button>
                <Button asChild variant="outline" size="lg" className="gap-2">
                    <Link href="/dashboard/analytics">View Analytics</Link>
                </Button>
                <Button asChild variant="ghost" size="lg" className="gap-2">
                    <Link href="/dashboard/generate">Generate New Exam</Link>
                </Button>
            </div>

            {/* Share Dialog */}
            <Dialog open={shareOpen} onOpenChange={setShareOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Share2 className="h-5 w-5" /> Share Results</DialogTitle>
                        <DialogDescription>Share your exam results with others via a link.</DialogDescription>
                    </DialogHeader>
                    {shareLoading ? (
                        <div className="py-8 text-center text-muted-foreground">Generating share link...</div>
                    ) : shareUrl ? (
                        <div className="space-y-4 py-4">
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border">
                                <input
                                    type="text"
                                    readOnly
                                    value={shareUrl}
                                    className="flex-1 bg-transparent text-sm font-mono outline-none"
                                    aria-label="Share URL"
                                />
                                <Button
                                    size="sm"
                                    variant={copied ? 'brand' : 'outline'}
                                    onClick={() => {
                                        navigator.clipboard.writeText(shareUrl);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000);
                                    }}
                                    className="gap-1 shrink-0"
                                >
                                    {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">Anyone with this link can view your results summary (no answers shown).</p>
                        </div>
                    ) : (
                        <div className="py-8 text-center text-muted-foreground">Failed to generate share link.</div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShareOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
