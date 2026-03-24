'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../results.module.css';

export default function ResultsPage() {
    const router = useRouter();
    const [data, setData] = useState(null);

    useEffect(() => {
        const stored = sessionStorage.getItem('examResults');
        if (stored) {
            setData(JSON.parse(stored));
        } else {
            router.push('/dashboard/generate');
        }
    }, [router]);

    if (!data) return null;

    const { exam, results, score, totalMarks, correct, wrong, unanswered, timeTaken } = data;
    const percent = Math.round((score / totalMarks) * 100);
    const grade = percent >= 90 ? 'Excellent!' : percent >= 75 ? 'Great Job!' : percent >= 50 ? 'Good Effort!' : 'Keep Practicing!';
    const minsUsed = Math.floor(timeTaken / 60);

    // Section-wise breakdown
    const sectionResults = exam.sections.map(section => {
        const sectionQs = results.filter(r => section.questions.some(q => q.id === r.id));
        const sectionCorrect = sectionQs.filter(r => r.isCorrect).length;
        return { name: section.name, correct: sectionCorrect, total: sectionQs.length, percent: Math.round((sectionCorrect / sectionQs.length) * 100) || 0 };
    });

    return (
        <div className={styles.resultsPage}>
            <h1>📊 Exam <span className="gradient-text">Results</span></h1>

            <div className={styles.scoreCard}>
                <div className={styles.scorePercent}>{percent}%</div>
                <div className={styles.scoreGrade}>{grade}</div>
                <div className={styles.scoreStats}>
                    <div className={styles.scoreStat}>
                        <span className={`${styles.val} ${styles.correct}`}>{correct}</span>
                        <span className={styles.lbl}>Correct</span>
                    </div>
                    <div className={styles.scoreStat}>
                        <span className={`${styles.val} ${styles.wrong}`}>{wrong}</span>
                        <span className={styles.lbl}>Wrong</span>
                    </div>
                    <div className={styles.scoreStat}>
                        <span className={`${styles.val} ${styles.skip}`}>{unanswered}</span>
                        <span className={styles.lbl}>Skipped</span>
                    </div>
                    <div className={styles.scoreStat}>
                        <span className={styles.val}>{minsUsed}m</span>
                        <span className={styles.lbl}>Time Used</span>
                    </div>
                </div>
            </div>

            <div className={styles.sectionBreakdown}>
                <h2>Section-wise Breakdown</h2>
                {sectionResults.map((s, i) => (
                    <div key={i} className={styles.sectionRow}>
                        <span className={styles.sectionName}>{s.name}</span>
                        <div className={styles.sectionBar}>
                            <div className={styles.sectionFill} style={{ width: `${s.percent}%` }} />
                        </div>
                        <span className={styles.sectionScore}>{s.correct}/{s.total}</span>
                    </div>
                ))}
            </div>

            <div className={styles.reviewSection}>
                <h2>Question Review</h2>
                {results.map((r, i) => (
                    <div key={i} className={styles.reviewItem}>
                        <div className={styles.reviewHeader}>
                            <span className={styles.reviewQ}>Q{i + 1} • {r.topic}</span>
                            <span className={`${styles.reviewBadge} ${r.userAnswer === null ? styles.skipped : r.isCorrect ? styles.correct : styles.wrong}`}>
                                {r.userAnswer === null ? 'Skipped' : r.isCorrect ? '✓ Correct' : '✗ Wrong'}
                            </span>
                        </div>
                        <p className={styles.reviewText}>{r.text}</p>
                        {r.userAnswer !== null && !r.isCorrect && (
                            <p className={styles.reviewAnswer}>Your answer: <strong>{r.options[r.userAnswer]}</strong></p>
                        )}
                        <p className={styles.reviewAnswer}>Correct answer: <strong style={{ color: 'var(--success-400)' }}>{r.options[r.correct]}</strong></p>
                        <div className={styles.reviewExplanation}>💡 {r.explanation}</div>
                    </div>
                ))}
            </div>

            <div className={styles.resultActions}>
                <Link href="/dashboard/generate" className={`${styles.resultBtn} ${styles.resultBtnPrimary}`}>
                    Generate New Exam
                </Link>
                <Link href="/dashboard/analytics" className={`${styles.resultBtn} ${styles.resultBtnOutline}`}>
                    View Analytics
                </Link>
            </div>
        </div>
    );
}
