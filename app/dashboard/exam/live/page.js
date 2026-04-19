'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { HiOutlineClock, HiOutlineFlag, HiOutlineArrowLeft, HiOutlineArrowRight, HiOutlineX } from 'react-icons/hi';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useNotification } from '@/app/components/BadgeNotification/BadgeNotification';

export default function LiveExamPage() {
    const router = useRouter();
    const { notify } = useNotification();
    const [exam, setExam] = useState(null);
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState({});
    const [marked, setMarked] = useState(new Set());
    const [timeLeft, setTimeLeft] = useState(-1);
    const [showSubmit, setShowSubmit] = useState(false);
    const [resumePrompt, setResumePrompt] = useState(false);
    const [savedSessionId, setSavedSessionId] = useState(null);
    const timerReady = useRef(false);
    const autoSaveTimerRef = useRef(null);

    // Refs to avoid stale closures when handleSubmit is called from timer
    const answersRef = useRef(answers);
    const timeLeftRef = useRef(timeLeft);
    const handleSubmitRef = useRef(null);
    useEffect(() => { answersRef.current = answers; }, [answers]);
    useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

    // On mount: load exam from sessionStorage or check for resumable session
    useEffect(() => {
        async function initExam() {
            const data = sessionStorage.getItem('currentExam');
            if (data) {
                const parsed = JSON.parse(data);
                setExam(parsed);
                const duration = (parsed.duration || 60) * 60;
                setTimeLeft(duration);
                timerReady.current = true;

                // Save session to DB for resume capability
                try {
                    const res = await fetch('/api/exam-session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ examData: parsed, timeRemaining: duration }),
                    });
                    if (res.ok) {
                        const { session } = await res.json();
                        setSavedSessionId(session._id);
                    }
                } catch (e) { console.warn('Failed to save exam session to DB:', e.message); }
            } else {
                // No exam in sessionStorage — check for resumable session in DB
                try {
                    const res = await fetch('/api/exam-session');
                    if (res.ok) {
                        const data = await res.json();
                        if (data.sessions?.length > 0) {
                            setResumePrompt(true);
                        } else {
                            router.push('/dashboard/generate');
                        }
                    } else {
                        router.push('/dashboard/generate');
                    }
                } catch (e) {
                    console.warn('Failed to check for resumable exam session:', e.message);
                    router.push('/dashboard/generate');
                }
            }
        }
        initExam();
    }, [router]);

    // Auto-save progress every 30 seconds
    useEffect(() => {
        if (!savedSessionId || !exam) return;
        autoSaveTimerRef.current = setInterval(async () => {
            try {
                await fetch('/api/exam-session', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId: savedSessionId,
                        answers,
                        markedForReview: [...marked],
                        currentQuestion: currentQ,
                        timeRemaining: timeLeft,
                    }),
                });
            } catch (e) { console.warn('Auto-save failed:', e.message); }
        }, 30000);
        return () => clearInterval(autoSaveTimerRef.current);
    }, [savedSessionId, exam, answers, marked, currentQ, timeLeft]);

    const getAllQuestions = useCallback(() => {
        if (!exam) return [];
        return exam.sections.flatMap((s) => s.questions);
    }, [exam]);

    const handleSubmit = useCallback(() => {
        // Clear auto-save on submit
        clearInterval(autoSaveTimerRef.current);

        // Use refs to always get the latest values (avoids stale closure on auto-submit)
        const currentAnswers = answersRef.current;
        const currentTimeLeft = timeLeftRef.current;

        const questions = getAllQuestions();
        const results = questions.map((q, i) => ({
            ...q,
            userAnswer: currentAnswers[i] ?? null,
            isCorrect: currentAnswers[i] === q.correct,
        }));

        const correct = results.filter(r => r.isCorrect).length;
        const wrong = results.filter(r => r.userAnswer !== null && !r.isCorrect).length;
        const unanswered = results.filter(r => r.userAnswer === null).length;
        const totalMarks = questions.reduce((s, q) => s + (q.marks || 4), 0);
        // Deduct negative marks proportional to each wrong question's marks
        const negativePenalty = results.reduce((s, r) => {
            if (r.userAnswer !== null && !r.isCorrect) return s + (r.marks || 4) * (exam.negativeMarking || 0);
            return s;
        }, 0);
        const score = results.reduce((s, r) => s + (r.isCorrect ? (r.marks || 4) : 0), 0) - negativePenalty;

        // Mark session as completed in DB
        if (savedSessionId) {
            fetch('/api/exam-session', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: savedSessionId, status: 'completed', answers: currentAnswers, timeRemaining: currentTimeLeft }),
            }).catch((e) => console.warn('Failed to mark exam session as completed:', e.message));
        }

        sessionStorage.setItem('examResults', JSON.stringify({
            exam,
            results,
            score: Math.max(0, score),
            totalMarks,
            correct,
            wrong,
            unanswered,
            timeTaken: (exam.duration || 60) * 60 - currentTimeLeft,
        }));
        router.push('/dashboard/exam/results');
    }, [exam, getAllQuestions, savedSessionId, router]);

    // Timer effect — uses handleSubmitRef to avoid stale closure
    useEffect(() => {
        if (!timerReady.current || !exam || timeLeft < 0) return;
        if (timeLeft === 0) {
            handleSubmitRef.current?.();
            return;
        }
        const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, exam]);

    // Keep handleSubmit ref in sync so timer always calls the latest version
    useEffect(() => { handleSubmitRef.current = handleSubmit; }, [handleSubmit]);

    // Resume an existing session
    async function handleResume() {
        try {
            const res = await fetch('/api/exam-session');
            if (res.ok) {
                const data = await res.json();
                const latestSession = data.sessions?.[0];
                if (latestSession) {
                    setExam(latestSession.examData);
                    setAnswers(latestSession.answers || {});
                    setMarked(new Set(latestSession.markedForReview || []));
                    setCurrentQ(latestSession.currentQuestion || 0);
                    setTimeLeft(latestSession.timeRemaining || (latestSession.examData.duration || 60) * 60);
                    setSavedSessionId(latestSession._id);
                    timerReady.current = true;
                    setResumePrompt(false);
                    return;
                }
            }
        } catch (e) { console.warn('Failed to resume exam session:', e.message); }
        router.push('/dashboard/generate');
    }

    // Discard resumable session and start fresh
    async function handleDiscardResume() {
        try {
            const res = await fetch('/api/exam-session');
            if (res.ok) {
                const data = await res.json();
                for (const s of data.sessions || []) {
                    await fetch('/api/exam-session', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sessionId: s._id, status: 'abandoned' }),
                    });
                }
            }
        } catch (e) { console.warn('Failed to discard exam session:', e.message); }
        setResumePrompt(false);
        router.push('/dashboard/generate');
    }

    // Show resume prompt if there's a resumable session
    if (resumePrompt && !exam) {
        return (
            <div className="max-w-md mx-auto py-20">
                <Card className="p-8 text-center space-y-6">
                    <span className="text-5xl">📝</span>
                    <h2 className="text-2xl font-bold">Resume Exam?</h2>
                    <p className="text-muted-foreground">You have an exam in progress. Would you like to continue where you left off?</p>
                    <div className="flex flex-col gap-3 pt-2">
                        <Button size="lg" onClick={handleResume} className="gap-2">▶ Resume Exam</Button>
                        <Button variant="outline" size="lg" onClick={handleDiscardResume} className="gap-2">🗑 Discard & Start New</Button>
                    </div>
                </Card>
            </div>
        );
    }

    if (!exam) return null;

    const questions = getAllQuestions();
    const q = questions[currentQ];
    const displayTime = Math.max(0, timeLeft);
    const mins = Math.floor(displayTime / 60);
    const secs = displayTime % 60;
    const isUrgent = timeLeft > 0 && timeLeft < 300;
    const progress = ((currentQ + 1) / questions.length) * 100;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border rounded-xl p-4 sm:p-6 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold truncate">{exam.title}</h1>
                    <p className="text-muted-foreground text-sm mt-1">Section: {exam.sections.find(s => s.questions.includes(q))?.name || 'General'}</p>
                </div>
                <div className={cn("flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xl font-bold transition-colors", isUrgent ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
                    <HiOutlineClock className="h-6 w-6" />
                    {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                </div>
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-4">
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <span className="font-semibold text-lg">Question {currentQ + 1} <span className="text-muted-foreground text-sm font-normal">of {questions.length}</span></span>
                            <Badge variant={q.difficulty === 'easy' ? 'success' : q.difficulty === 'hard' ? 'destructive' : 'warning'}>{q.difficulty}</Badge>
                        </div>
                        
                        <Progress value={progress} className="h-1 mb-6" />

                        <p className="text-lg mb-8 leading-relaxed whitespace-pre-wrap">{q.text}</p>
                        
                        <div className="space-y-3">
                            {q.options.map((opt, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                                        answers[currentQ] === i 
                                            ? "border-primary bg-primary/5 shadow-sm" 
                                            : "border-transparent bg-secondary/50 hover:bg-secondary"
                                    )}
                                    onClick={() => setAnswers({ ...answers, [currentQ]: i })}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors",
                                        answers[currentQ] === i ? "bg-primary text-primary-foreground" : "bg-background border text-muted-foreground"
                                    )}>
                                        {String.fromCharCode(65 + i)}
                                    </div>
                                    <span className={cn("text-base font-medium", answers[currentQ] === i ? "text-foreground" : "text-muted-foreground")}>{opt}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="lg" onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0} className="gap-2 shrink-0">
                                <HiOutlineArrowLeft /> <span className="hidden sm:inline">Previous</span>
                            </Button>
                            <Button variant="outline" size="lg" onClick={() => {
                                const next = new Set(marked);
                                if (next.has(currentQ)) next.delete(currentQ);
                                else next.add(currentQ);
                                setMarked(next);
                            }} className="gap-2 shrink-0">
                                <HiOutlineFlag className={cn(marked.has(currentQ) && "fill-warning text-warning")} /> 
                                <span className="hidden sm:inline">{marked.has(currentQ) ? 'Unmark' : 'Mark'}</span>
                            </Button>
                            <Button variant="outline" size="lg" onClick={() => {
                                const next = { ...answers };
                                delete next[currentQ];
                                setAnswers(next);
                            }} className="gap-2 shrink-0">
                                <HiOutlineX /> <span className="hidden sm:inline">Clear</span>
                            </Button>
                        </div>
                        {currentQ < questions.length - 1 && (
                            <Button size="lg" onClick={() => setCurrentQ(currentQ + 1)} className="gap-2 shrink-0">
                                Next <HiOutlineArrowRight />
                            </Button>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-5">
                        <h3 className="font-semibold mb-4 text-center">Question Navigator</h3>
                        <div className="grid grid-cols-5 gap-2 max-h-[300px] overflow-y-auto pr-1 pb-1">
                            {questions.map((_, i) => {
                                const isCurrent = i === currentQ;
                                const isAnswered = answers[i] !== undefined;
                                const isMarked = marked.has(i);
                                
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentQ(i)}
                                        className={cn(
                                            "h-10 rounded-md font-semibold text-sm transition-all border",
                                            isCurrent ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "",
                                            isAnswered && !isMarked ? "bg-success hover:bg-success/90 text-success-foreground border-success" : 
                                            isMarked ? "bg-warning hover:bg-warning/90 text-warning-foreground border-warning" : 
                                            "bg-background hover:bg-secondary border-border text-muted-foreground"
                                        )}
                                    >
                                        {i + 1}
                                    </button>
                                );
                            })}
                        </div>
                        
                        <div className="mt-6 space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <div className="w-3 h-3 rounded-full bg-success"></div> Answered
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <div className="w-3 h-3 rounded-full bg-warning"></div> Marked for Review
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <div className="w-3 h-3 rounded-full border border-border bg-background"></div> Not Visited
                            </div>
                        </div>

                        <Button className="w-full mt-6" size="lg" onClick={() => setShowSubmit(true)}>
                            Submit Exam
                        </Button>
                    </Card>
                </div>
            </div>

            <Dialog open={showSubmit} onOpenChange={setShowSubmit}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Submit Exam?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to submit? You cannot change your answers after submission.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-3 gap-4 py-4">
                        <div className="text-center p-4 bg-secondary/50 rounded-xl">
                            <div className="text-2xl font-bold text-success">{Object.keys(answers).length}</div>
                            <div className="text-xs text-muted-foreground mt-1">Answered</div>
                        </div>
                        <div className="text-center p-4 bg-secondary/50 rounded-xl">
                            <div className="text-2xl font-bold text-warning">{marked.size}</div>
                            <div className="text-xs text-muted-foreground mt-1">Marked</div>
                        </div>
                        <div className="text-center p-4 bg-secondary/50 rounded-xl">
                            <div className="text-2xl font-bold text-muted-foreground">{questions.length - Object.keys(answers).length}</div>
                            <div className="text-xs text-muted-foreground mt-1">Unanswered</div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSubmit(false)}>Cancel</Button>
                        <Button onClick={handleSubmit}>Confirm Submit</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
