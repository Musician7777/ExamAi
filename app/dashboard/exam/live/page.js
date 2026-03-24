'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { HiOutlineClock, HiOutlineFlag, HiOutlineArrowLeft, HiOutlineArrowRight, HiOutlineX } from 'react-icons/hi';
import styles from '../exam.module.css';

export default function LiveExamPage() {
    const router = useRouter();
    const [exam, setExam] = useState(null);
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState({});
    const [marked, setMarked] = useState(new Set());
    const [timeLeft, setTimeLeft] = useState(-1);
    const [showSubmit, setShowSubmit] = useState(false);
    const timerReady = useRef(false);

    useEffect(() => {
        const data = sessionStorage.getItem('currentExam');
        if (data) {
            const parsed = JSON.parse(data);
            setExam(parsed);
            const duration = (parsed.duration || 60) * 60;
            setTimeLeft(duration);
            timerReady.current = true;
        } else {
            router.push('/dashboard/generate');
        }
    }, [router]);

    useEffect(() => {
        if (!timerReady.current || !exam || timeLeft < 0) return;
        if (timeLeft === 0) {
            handleSubmit();
            return;
        }
        const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, exam]);

    const getAllQuestions = useCallback(() => {
        if (!exam) return [];
        return exam.sections.flatMap((s) => s.questions);
    }, [exam]);

    const handleSubmit = () => {
        const questions = getAllQuestions();
        const results = questions.map((q, i) => ({
            ...q,
            userAnswer: answers[i] ?? null,
            isCorrect: answers[i] === q.correct,
        }));

        const correct = results.filter(r => r.isCorrect).length;
        const wrong = results.filter(r => r.userAnswer !== null && !r.isCorrect).length;
        const unanswered = results.filter(r => r.userAnswer === null).length;
        const totalMarks = questions.reduce((s, q) => s + (q.marks || 4), 0);
        const score = correct * (questions[0]?.marks || 4) - wrong * (exam.negativeMarking || 0);

        sessionStorage.setItem('examResults', JSON.stringify({
            exam,
            results,
            score: Math.max(0, score),
            totalMarks,
            correct,
            wrong,
            unanswered,
            timeTaken: (exam.duration || 60) * 60 - timeLeft,
        }));
        router.push('/dashboard/exam/results');
    };

    if (!exam) return null;

    const questions = getAllQuestions();
    const q = questions[currentQ];
    const displayTime = Math.max(0, timeLeft);
    const mins = Math.floor(displayTime / 60);
    const secs = displayTime % 60;
    const isUrgent = timeLeft > 0 && timeLeft < 300;

    return (
        <div className={styles.examPage}>
            <div className={styles.examHeader}>
                <div className={styles.examTitle}>{exam.title}</div>
                <div className={`${styles.timer} ${isUrgent ? styles.urgent : ''}`}>
                    <HiOutlineClock className={styles.timerIcon} />
                    {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                </div>
            </div>

            <div className={styles.examBody}>
                <div className={styles.questionArea}>
                    <div className={styles.qHeader}>
                        <span className={styles.qNumber}>Question {currentQ + 1} of {questions.length}</span>
                        <span className={`${styles.qBadge} ${styles[q.difficulty]}`}>{q.difficulty}</span>
                    </div>
                    <p className={styles.qText}>{q.text}</p>
                    <div className={styles.options}>
                        {q.options.map((opt, i) => (
                            <div
                                key={i}
                                className={`${styles.option} ${answers[currentQ] === i ? styles.selected : ''}`}
                                onClick={() => setAnswers({ ...answers, [currentQ]: i })}
                            >
                                <div className={styles.optionLabel}>{String.fromCharCode(65 + i)}</div>
                                <span>{opt}</span>
                            </div>
                        ))}
                    </div>
                    <div className={styles.qActions}>
                        <button
                            className={`${styles.qBtn} ${styles.qBtnOutline}`}
                            onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                            disabled={currentQ === 0}
                        >
                            <HiOutlineArrowLeft /> Previous
                        </button>
                        <button
                            className={`${styles.qBtn} ${styles.qBtnOutline}`}
                            onClick={() => {
                                const next = new Set(marked);
                                if (next.has(currentQ)) next.delete(currentQ);
                                else next.add(currentQ);
                                setMarked(next);
                            }}
                        >
                            <HiOutlineFlag /> {marked.has(currentQ) ? 'Unmark' : 'Mark for Review'}
                        </button>
                        <button
                            className={`${styles.qBtn} ${styles.qBtnOutline}`}
                            onClick={() => {
                                const next = { ...answers };
                                delete next[currentQ];
                                setAnswers(next);
                            }}
                        >
                            <HiOutlineX /> Clear
                        </button>
                        {currentQ < questions.length - 1 && (
                            <button
                                className={`${styles.qBtn} ${styles.qBtnPrimary}`}
                                onClick={() => setCurrentQ(currentQ + 1)}
                            >
                                Next <HiOutlineArrowRight />
                            </button>
                        )}
                    </div>
                </div>

                <div className={styles.navPanel}>
                    <h3>Question Navigator</h3>
                    <div className={styles.navGrid}>
                        {questions.map((_, i) => (
                            <button
                                key={i}
                                className={`${styles.navBtn} ${i === currentQ ? styles.current : ''} ${answers[i] !== undefined ? styles.answered : ''} ${marked.has(i) ? styles.marked : ''}`}
                                onClick={() => setCurrentQ(i)}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                    <div className={styles.legend}>
                        <div className={styles.legendItem}>
                            <div className={styles.legendDot} style={{ background: 'var(--success-500)' }} /> Answered
                        </div>
                        <div className={styles.legendItem}>
                            <div className={styles.legendDot} style={{ background: 'var(--warning-500)' }} /> Marked for Review
                        </div>
                        <div className={styles.legendItem}>
                            <div className={styles.legendDot} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }} /> Not Visited
                        </div>
                    </div>
                    <button className={styles.submitBtn} onClick={() => setShowSubmit(true)}>
                        Submit Exam
                    </button>
                </div>
            </div>

            {showSubmit && (
                <div className={styles.modalOverlay} onClick={() => setShowSubmit(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h3>Submit Exam?</h3>
                        <p>Are you sure you want to submit? You cannot change your answers after submission.</p>
                        <div className={styles.modalStats}>
                            <div className={styles.modalStat}>
                                <span style={{ color: 'var(--success-400)' }}>{Object.keys(answers).length}</span>
                                <small>Answered</small>
                            </div>
                            <div className={styles.modalStat}>
                                <span style={{ color: 'var(--warning-400)' }}>{marked.size}</span>
                                <small>Marked</small>
                            </div>
                            <div className={styles.modalStat}>
                                <span style={{ color: 'var(--text-tertiary)' }}>{questions.length - Object.keys(answers).length}</span>
                                <small>Unanswered</small>
                            </div>
                        </div>
                        <div className={styles.modalBtns}>
                            <button className={`${styles.qBtn} ${styles.qBtnOutline}`} onClick={() => setShowSubmit(false)}>
                                Cancel
                            </button>
                            <button className={`${styles.qBtn} ${styles.qBtnPrimary}`} onClick={handleSubmit}>
                                Confirm Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
