'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { HiOutlineClock, HiOutlineFlag, HiOutlineArrowLeft, HiOutlineArrowRight, HiOutlineX } from 'react-icons/hi';
import { CheckCircle2, Hash, AlignLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import clientLogger from '@/lib/client-logger';
import { trackExamSubmit } from '@/lib/ga';
import { useNotification } from '@/app/components/BadgeNotification/BadgeNotification';
import QuestionTypeBadge from '@/app/components/QuestionTypeBadge/QuestionTypeBadge';

/* ─── Answer checking helpers (outside component to avoid stale closures) ─── */
function isAnswerCorrect(question, userAnswer) {
  const qType = question.type || 'MCQ';

  if (userAnswer === null || userAnswer === undefined || userAnswer === '') return false;

  if (qType === 'MCQ') {
    return userAnswer === question.correct;
  }
  if (qType === 'MSQ') {
    if (!Array.isArray(userAnswer) || !Array.isArray(question.correct)) return false;
    if (userAnswer.length !== question.correct.length) return false;
    const sortedUser = [...userAnswer].sort();
    const sortedCorrect = [...question.correct].sort();
    return sortedUser.every((v, i) => v === sortedCorrect[i]);
  }
  if (qType === 'NAT') {
    const tolerance = question.tolerance || 0;
    const correctVal = typeof question.correct === 'string' ? parseFloat(question.correct) : question.correct;
    const userVal = typeof userAnswer === 'string' ? parseFloat(userAnswer) : userAnswer;
    if (isNaN(userVal) || isNaN(correctVal)) return false;
    return Math.abs(userVal - correctVal) <= tolerance;
  }
  if (qType === 'Descriptive') {
    const keywords = question.keywords || [];
    if (keywords.length === 0) return false;
    const answerLower = (userAnswer || '').toLowerCase();
    const matchedKeywords = keywords.filter((k) => answerLower.includes(k.toLowerCase()));
    return matchedKeywords.length / keywords.length >= 0.6;
  }
  return false;
}

function isQuestionAnswered(answer, type) {
  if (answer === null || answer === undefined || answer === '') return false;
  if (type === 'MSQ') return Array.isArray(answer) && answer.length > 0;
  return true; // MCQ, NAT, Descriptive with non-empty answer
}

function getDescriptiveMatchInfo(question, userAnswer) {
  const keywords = question.keywords || [];
  if (keywords.length === 0) return { matched: [], unmatched: [], coverage: 0 };
  const answerLower = (userAnswer || '').toLowerCase();
  const matched = keywords.filter((k) => answerLower.includes(k.toLowerCase()));
  const unmatched = keywords.filter((k) => !answerLower.includes(k.toLowerCase()));
  const coverage = Math.round((matched.length / keywords.length) * 100);
  return { matched, unmatched, coverage };
}

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

  // Time-per-question tracking
  const [questionTimes, setQuestionTimes] = useState({});
  const questionStartRef = useRef(0);
  const currentQRef = useRef(0);

  // Refs to avoid stale closures when handleSubmit is called from timer
  const answersRef = useRef(answers);
  const timeLeftRef = useRef(timeLeft);
  const handleSubmitRef = useRef(null);
  const questionTimesRef = useRef(questionTimes);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);
  useEffect(() => {
    questionTimesRef.current = questionTimes;
  }, [questionTimes]);
  useEffect(() => {
    currentQRef.current = currentQ;
  }, [currentQ]);

  // Track time when switching questions
  const trackQuestionTime = useCallback((fromQ) => {
    const now = Date.now();
    const elapsed = Math.round((now - questionStartRef.current) / 1000);
    setQuestionTimes((prev) => ({
      ...prev,
      [fromQ]: (prev[fromQ] || 0) + elapsed,
    }));
    questionStartRef.current = now;
  }, []);

  // Navigate to a specific question with time tracking
  const navigateToQuestion = useCallback(
    (targetQ) => {
      trackQuestionTime(currentQRef.current);
      setCurrentQ(targetQ);
    },
    [trackQuestionTime]
  );

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
        questionStartRef.current = Date.now();

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
        } catch (e) {
          clientLogger.warn('Failed to save exam session to DB:', e.message);
        }
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
          clientLogger.warn('Failed to check for resumable exam session:', e.message);
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
      } catch (e) {
        clientLogger.warn('Auto-save failed:', e.message);
      }
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

    // Track time for the last question
    trackQuestionTime(currentQRef.current);

    // Use refs to always get the latest values
    const currentAnswers = answersRef.current;
    const currentTimeLeft = timeLeftRef.current;
    const currentQuestionTimes = questionTimesRef.current;

    const questions = getAllQuestions();
    const results = questions.map((q, i) => {
      const userAnswer = currentAnswers[i] ?? null;
      const qType = q.type || 'MCQ';
      const correct = isAnswerCorrect(q, userAnswer);

      const result = {
        ...q,
        type: qType,
        userAnswer,
        isCorrect: correct,
        timeSpent: currentQuestionTimes[i] || 0,
      };

      // For descriptive, include keyword match info
      if (qType === 'Descriptive' && userAnswer) {
        result.keywordMatch = getDescriptiveMatchInfo(q, userAnswer);
      }

      return result;
    });

    const correct = results.filter((r) => r.isCorrect).length;
    const answered = results.filter((r) => isQuestionAnswered(r.userAnswer, r.type || 'MCQ')).length;
    const wrong = results.filter((r) => isQuestionAnswered(r.userAnswer, r.type || 'MCQ') && !r.isCorrect).length;
    const unanswered = results.length - answered;
    const totalMarks = questions.reduce((s, q) => s + (q.marks || 4), 0);
    // Deduct negative marks only for answered-but-wrong questions (not unanswered ones like empty MSQ [])
    const negativePenalty = results.reduce((s, r) => {
      if (isQuestionAnswered(r.userAnswer, r.type || 'MCQ') && !r.isCorrect)
        return s + (r.marks || 4) * (exam.negativeMarking || 0);
      return s;
    }, 0);
    const score = results.reduce((s, r) => s + (r.isCorrect ? r.marks || 4 : 0), 0) - negativePenalty;

    // Mark session as completed in DB
    if (savedSessionId) {
      fetch('/api/exam-session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: savedSessionId,
          status: 'completed',
          answers: currentAnswers,
          timeRemaining: currentTimeLeft,
        }),
      }).catch((e) => clientLogger.warn('Failed to mark exam session as completed:', e.message));
    }

    const timeTaken = (exam.duration || 60) * 60 - currentTimeLeft;
    const percent = totalMarks > 0 ? Math.round((Math.max(0, score) / totalMarks) * 100) : 0;
    // Track exam submission in GA4
    trackExamSubmit({
      score: Math.max(0, score),
      totalMarks,
      percent,
      correct,
      wrong,
      unanswered,
      timeTaken,
      questionType: exam.questionType || 'MCQ',
    });
    sessionStorage.setItem(
      'examResults',
      JSON.stringify({
        exam,
        results,
        score: Math.max(0, score),
        totalMarks,
        correct,
        wrong,
        unanswered,
        timeTaken,
        questionTimes: currentQuestionTimes,
      })
    );
    router.push('/dashboard/exam/results');
  }, [exam, getAllQuestions, savedSessionId, router, trackQuestionTime]);

  // Timer effect
  useEffect(() => {
    if (!timerReady.current || !exam || timeLeft < 0) return;
    if (timeLeft === 0) {
      handleSubmitRef.current?.();
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, exam]);

  // Keep handleSubmit ref in sync
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!exam || showSubmit) return;
    const questions = exam.sections.flatMap((s) => s.questions);

    function handleKeyDown(e) {
      const interactiveTags = ['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT'];
      const isInteractive = e.target.tagName && interactiveTags.includes(e.target.tagName);
      const isRadio = e.target.getAttribute('role') === 'radio';
      if (isInteractive || isRadio) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          if (currentQRef.current > 0) navigateToQuestion(currentQRef.current - 1);
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          if (currentQRef.current < questions.length - 1) navigateToQuestion(currentQRef.current + 1);
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5': {
          const q = questions[currentQRef.current];
          const qType = q?.type || 'MCQ';
          const optIdx = parseInt(e.key) - 1;
          if (qType === 'MCQ' && q && optIdx < q.options.length) {
            e.preventDefault();
            setAnswers((prev) => ({ ...prev, [currentQRef.current]: optIdx }));
          } else if (qType === 'MSQ' && q && optIdx < q.options.length) {
            e.preventDefault();
            setAnswers((prev) => {
              const current = prev[currentQRef.current] || [];
              const arr = Array.isArray(current) ? [...current] : [];
              const idx = arr.indexOf(optIdx);
              if (idx >= 0) arr.splice(idx, 1);
              else arr.push(optIdx);
              arr.sort();
              return { ...prev, [currentQRef.current]: arr };
            });
          }
          break;
        }
        case 'm':
        case 'M': {
          e.preventDefault();
          setMarked((prev) => {
            const next = new Set(prev);
            if (next.has(currentQRef.current)) next.delete(currentQRef.current);
            else next.add(currentQRef.current);
            return next;
          });
          break;
        }
        case 'x':
        case 'X': {
          e.preventDefault();
          setAnswers((prev) => {
            const next = { ...prev };
            delete next[currentQRef.current];
            return next;
          });
          break;
        }
        case 'Enter': {
          e.preventDefault();
          setShowSubmit(true);
          break;
        }
        case 'Escape': {
          e.preventDefault();
          setShowSubmit(false);
          break;
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [exam, showSubmit, navigateToQuestion]);

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
          questionStartRef.current = Date.now();
          return;
        }
      }
    } catch (e) {
      clientLogger.warn('Failed to resume exam session:', e.message);
    }
    router.push('/dashboard/generate');
  }

  // Discard resumable session
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
    } catch (e) {
      clientLogger.warn('Failed to discard exam session:', e.message);
    }
    setResumePrompt(false);
    router.push('/dashboard/generate');
  }

  // Show resume prompt
  if (resumePrompt && !exam) {
    return (
      <div className="max-w-md mx-auto py-20">
        <Card className="p-8 text-center space-y-6">
          <span className="text-5xl">📝</span>
          <h2 className="text-2xl font-bold">Resume Exam?</h2>
          <p className="text-muted-foreground">
            You have an exam in progress. Would you like to continue where you left off?
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <Button size="lg" onClick={handleResume} className="gap-2">
              ▶ Resume Exam
            </Button>
            <Button variant="outline" size="lg" onClick={handleDiscardResume} className="gap-2">
              🗑 Discard & Start New
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!exam) return null;

  const questions = getAllQuestions();
  const q = questions[currentQ];
  const qType = q.type || 'MCQ';
  const displayTime = Math.max(0, timeLeft);
  const mins = Math.floor(displayTime / 60);
  const secs = displayTime % 60;
  const isUrgent = timeLeft > 0 && timeLeft < 300;
  const progress = ((currentQ + 1) / questions.length) * 100;

  /* ─── Question type-specific answer UIs ─── */
  function renderAnswerArea() {
    if (qType === 'MCQ') {
      return (
        <div className="space-y-3" role="radiogroup" aria-label="Answer options">
          {q.options.map((opt, i) => (
            <div
              key={i}
              role="radio"
              aria-checked={answers[currentQ] === i}
              tabIndex={0}
              className={cn(
                'flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                answers[currentQ] === i
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-transparent bg-secondary/50 hover:bg-secondary'
              )}
              onClick={() => setAnswers({ ...answers, [currentQ]: i })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setAnswers({ ...answers, [currentQ]: i });
                }
              }}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors',
                  answers[currentQ] === i
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background border text-muted-foreground'
                )}
              >
                {String.fromCharCode(65 + i)}
              </div>
              <span
                className={cn(
                  'text-base font-medium',
                  answers[currentQ] === i ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {opt}
              </span>
              <span className="ml-auto text-xs text-muted-foreground font-mono opacity-50">{i + 1}</span>
            </div>
          ))}
        </div>
      );
    }

    if (qType === 'MSQ') {
      const selected = Array.isArray(answers[currentQ]) ? answers[currentQ] : [];
      return (
        <div className="space-y-3" role="group" aria-label="Select all correct options">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Select all correct answers (multiple options can be correct)
          </div>
          {q.options.map((opt, i) => {
            const isSelected = selected.includes(i);
            return (
              <div
                key={i}
                role="checkbox"
                aria-checked={isSelected}
                tabIndex={0}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                  isSelected
                    ? 'border-purple-500/50 bg-purple-500/5 shadow-sm'
                    : 'border-transparent bg-secondary/50 hover:bg-secondary'
                )}
                onClick={() => {
                  const current = Array.isArray(answers[currentQ]) ? [...answers[currentQ]] : [];
                  const idx = current.indexOf(i);
                  if (idx >= 0) current.splice(idx, 1);
                  else current.push(i);
                  current.sort();
                  setAnswers({ ...answers, [currentQ]: current });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const current = Array.isArray(answers[currentQ]) ? [...answers[currentQ]] : [];
                    const idx = current.indexOf(i);
                    if (idx >= 0) current.splice(idx, 1);
                    else current.push(i);
                    current.sort();
                    setAnswers({ ...answers, [currentQ]: current });
                  }
                }}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors',
                    isSelected
                      ? 'bg-purple-500 text-white'
                      : 'bg-background border-2 border-border text-muted-foreground'
                  )}
                >
                  {isSelected ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-bold">{String.fromCharCode(65 + i)}</span>
                  )}
                </div>
                <span className={cn('text-base font-medium', isSelected ? 'text-foreground' : 'text-muted-foreground')}>
                  {opt}
                </span>
                <span className="ml-auto text-xs text-muted-foreground font-mono opacity-50">{i + 1}</span>
              </div>
            );
          })}
          {selected.length > 0 && (
            <p className="text-xs text-purple-300 mt-2">
              {selected.length} option{selected.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>
      );
    }

    if (qType === 'NAT') {
      return (
        <div className="space-y-4" role="group" aria-label="Numerical answer input">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
            <Hash className="h-3.5 w-3.5" />
            Enter a numerical value (integer or decimal)
          </div>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex-1 relative rounded-xl border-2 transition-all',
                answers[currentQ] !== undefined && answers[currentQ] !== ''
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-border bg-secondary/50'
              )}
            >
              <Input
                type="number"
                step="any"
                placeholder="Enter your numerical answer..."
                value={answers[currentQ] ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setAnswers({ ...answers, [currentQ]: val === '' ? '' : val });
                }}
                className="text-lg font-mono h-14 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter the exact numerical value. For integer answers, enter a whole number (e.g., 42). For decimals, use
            decimal point (e.g., 3.14).
          </p>
        </div>
      );
    }

    if (qType === 'Descriptive') {
      const charCount = (answers[currentQ] || '').length;
      return (
        <div className="space-y-4" role="group" aria-label="Descriptive answer input">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
            <AlignLeft className="h-3.5 w-3.5" />
            Write a detailed answer in your own words
          </div>
          <div
            className={cn(
              'relative rounded-xl border-2 transition-all',
              charCount > 0 ? 'border-amber-500/50 bg-amber-500/5' : 'border-border bg-secondary/50'
            )}
          >
            <textarea
              placeholder="Type your answer here... Include key concepts and explanations."
              value={answers[currentQ] || ''}
              onChange={(e) => setAnswers({ ...answers, [currentQ]: e.target.value })}
              rows={6}
              className="w-full p-4 bg-transparent text-base leading-relaxed resize-y rounded-xl focus:outline-none min-h-[150px]"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{charCount} characters</span>
            <span>Tip: Include relevant keywords and concepts for better scoring</span>
          </div>
        </div>
      );
    }

    // Fallback to MCQ
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border rounded-xl p-4 sm:p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold truncate">{exam.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Section: {exam.sections.find((s) => s.questions.includes(q))?.name || 'General'}
          </p>
        </div>
        <div
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xl font-bold transition-colors',
            isUrgent ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
          )}
        >
          <HiOutlineClock className="h-6 w-6" />
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground" role="note" aria-label="Keyboard shortcuts">
        <span className="px-2 py-1 rounded bg-secondary/50 border">← → Navigate</span>
        {qType === 'MCQ' && <span className="px-2 py-1 rounded bg-secondary/50 border">1-4 Select option</span>}
        {qType === 'MSQ' && <span className="px-2 py-1 rounded bg-secondary/50 border">1-5 Toggle option</span>}
        <span className="px-2 py-1 rounded bg-secondary/50 border">M Mark for review</span>
        <span className="px-2 py-1 rounded bg-secondary/50 border">X Clear answer</span>
        <span className="px-2 py-1 rounded bg-secondary/50 border">Enter Submit</span>
        <span className="px-2 py-1 rounded bg-secondary/50 border">Esc Cancel</span>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-lg">
                  Question {currentQ + 1}{' '}
                  <span className="text-muted-foreground text-sm font-normal">of {questions.length}</span>
                </span>
                <QuestionTypeBadge type={qType} />
              </div>
              <div className="flex items-center gap-2">
                {questionTimes[currentQ] > 0 && (
                  <span
                    className="text-xs text-muted-foreground flex items-center gap-1"
                    aria-label={`Time spent on this question: ${questionTimes[currentQ]}s`}
                  >
                    <HiOutlineClock className="h-3 w-3" /> {Math.floor(questionTimes[currentQ] / 60)}m
                    {questionTimes[currentQ] % 60}s
                  </span>
                )}
                <Badge
                  variant={q.difficulty === 'easy' ? 'success' : q.difficulty === 'hard' ? 'destructive' : 'warning'}
                >
                  {q.difficulty}
                </Badge>
                {q.marks && (
                  <Badge variant="outline" className="text-xs">
                    {q.marks} marks
                  </Badge>
                )}
              </div>
            </div>

            <Progress
              value={progress}
              className="h-1 mb-6"
              aria-label={`Progress: ${currentQ + 1} of ${questions.length}`}
            />

            <p className="text-lg mb-8 leading-relaxed whitespace-pre-wrap">{q.text}</p>

            {renderAnswerArea()}
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigateToQuestion(Math.max(0, currentQ - 1))}
                disabled={currentQ === 0}
                className="gap-2 shrink-0"
                aria-label="Previous question"
              >
                <HiOutlineArrowLeft /> <span className="hidden sm:inline">Previous</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  const next = new Set(marked);
                  if (next.has(currentQ)) next.delete(currentQ);
                  else next.add(currentQ);
                  setMarked(next);
                }}
                className={cn('gap-2 shrink-0', marked.has(currentQ) && 'ring-1 ring-warning')}
                aria-label={marked.has(currentQ) ? 'Unmark for review' : 'Mark for review'}
              >
                <HiOutlineFlag className={cn(marked.has(currentQ) && 'fill-warning text-warning')} />
                <span className="hidden sm:inline">{marked.has(currentQ) ? 'Unmark' : 'Mark'}</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  const next = { ...answers };
                  delete next[currentQ];
                  setAnswers(next);
                }}
                className="gap-2 shrink-0"
                aria-label="Clear answer"
              >
                <HiOutlineX /> <span className="hidden sm:inline">Clear</span>
              </Button>
            </div>
            {currentQ < questions.length - 1 && (
              <Button
                size="lg"
                onClick={() => navigateToQuestion(currentQ + 1)}
                className="gap-2 shrink-0"
                aria-label="Next question"
              >
                Next <HiOutlineArrowRight />
              </Button>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="p-5">
            <h3 className="font-semibold mb-4 text-center">Question Navigator</h3>
            <div
              className="grid grid-cols-5 gap-2 max-h-[300px] overflow-y-auto pr-1 pb-1"
              role="navigation"
              aria-label="Question navigator"
            >
              {questions.map((qItem, i) => {
                const isCurrent = i === currentQ;
                const qItemType = qItem.type || 'MCQ';
                const isAnswered = isQuestionAnswered(answers[i], qItemType);
                const isMarked = marked.has(i);

                return (
                  <button
                    key={i}
                    onClick={() => navigateToQuestion(i)}
                    aria-label={`Question ${i + 1}${isAnswered ? ', answered' : ''}${isMarked ? ', marked for review' : ''}${isCurrent ? ', current' : ''}`}
                    className={cn(
                      'h-10 rounded-md font-semibold text-sm transition-all border',
                      isCurrent ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : '',
                      isAnswered && !isMarked
                        ? 'bg-success hover:bg-success/90 text-success-foreground border-success'
                        : isMarked
                          ? 'bg-warning hover:bg-warning/90 text-warning-foreground border-warning'
                          : 'bg-background hover:bg-secondary border-border text-muted-foreground'
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
              <div className="text-2xl font-bold text-success">
                {questions.filter((qItem, i) => isQuestionAnswered(answers[i], qItem.type || 'MCQ')).length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Answered</div>
            </div>
            <div className="text-center p-4 bg-secondary/50 rounded-xl">
              <div className="text-2xl font-bold text-warning">{marked.size}</div>
              <div className="text-xs text-muted-foreground mt-1">Marked</div>
            </div>
            <div className="text-center p-4 bg-secondary/50 rounded-xl">
              <div className="text-2xl font-bold text-muted-foreground">
                {questions.length -
                  questions.filter((qItem, i) => isQuestionAnswered(answers[i], qItem.type || 'MCQ')).length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Unanswered</div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmit(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Confirm Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
