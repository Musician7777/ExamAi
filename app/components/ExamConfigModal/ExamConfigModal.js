'use client';
import { useState, useEffect, useCallback } from 'react';
import { HiOutlinePlay, HiOutlineX } from 'react-icons/hi';
import styles from './ExamConfigModal.module.css';

/* ─────────────────────────────────────────────
   AI RECOMMENDED DEFAULTS per mode
   ───────────────────────────────────────────── */
const RECOMMENDATIONS = {
    exam: {
        difficulty: 'Medium',
        time: 60,
        questions: 20,
        questionType: 'MCQ',
        negativeMarking: 0.25,
    },
    coding: {
        difficulty: 'Medium',
        time: 45,
        questions: 5,
        language: 'JavaScript',
    },
    interview: {
        difficulty: 'Medium',
        time: 10, // questions, not minutes
        questions: 10,
        tone: 'Professional',
    },
};

/* ─────────────────────────────────────────────
   MODE CONFIGS — defines what each mode shows
   ───────────────────────────────────────────── */
const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard', 'Expert'];

const EXAM_TIME_OPTIONS = [15, 30, 45, 60, 90, 120, 180];
const EXAM_QUESTION_OPTIONS = [10, 15, 20, 30, 50, 75, 100];
const EXAM_TYPE_OPTIONS = ['MCQ', 'Descriptive', 'Mixed'];
const EXAM_NEG_OPTIONS = [0, 0.25, 0.33, 0.5, 1];

const CODING_TIME_OPTIONS = [15, 30, 45, 60, 90];
const CODING_QUESTION_OPTIONS = [1, 3, 5, 8, 10];
const CODING_LANG_OPTIONS = ['JavaScript', 'Python', 'Java', 'C++', 'Go'];

const INTERVIEW_Q_OPTIONS = [5, 8, 10, 15, 20];
const INTERVIEW_TONE_OPTIONS = ['Friendly', 'Professional', 'Challenging', 'Formal'];

/* ─────────────────────────────────────────────
   RecommendedBadge sub‑component
   ───────────────────────────────────────────── */
function AiBadge() {
    return (
        <span className={styles.recommendedBadge}>
            <span className={styles.sparkle}>✨</span> AI Pick
        </span>
    );
}

/* ─────────────────────────────────────────────
   Pill sub‑component
   ───────────────────────────────────────────── */
function Pill({ label, value, active, recommended, onClick }) {
    return (
        <button
            className={`${styles.pill} ${active ? styles.active : ''} ${recommended ? styles.recommended : ''}`}
            onClick={() => onClick(value)}
            type="button"
        >
            {label}
            {recommended && <AiBadge />}
        </button>
    );
}

/* ─────────────────────────────────────────────
   MODE HEADER INFO
   ───────────────────────────────────────────── */
const MODE_INFO = {
    exam: { emoji: '📝', title: 'Configure Exam', desc: 'Set your exam preferences. AI-recommended options are highlighted for the best experience.' },
    coding: { emoji: '💻', title: 'Configure Challenge', desc: 'Customize your coding challenge. AI picks the optimal settings for effective practice.' },
    interview: { emoji: '🎤', title: 'Configure Interview', desc: 'Tune your mock interview. AI-recommended settings ensure a realistic experience.' },
};

/* ═════════════════════════════════════════════
   MAIN COMPONENT
   ═════════════════════════════════════════════ */
export default function ExamConfigModal({
    isOpen,
    onClose,
    onGenerate,
    mode = 'exam',         // 'exam' | 'coding' | 'interview'
    presetName = '',       // optional preset/template name
    presetEmoji = '',      // optional emoji
    initialConfig = {},    // pre-fill values from template
}) {
    const rec = RECOMMENDATIONS[mode] || RECOMMENDATIONS.exam;

    // State
    const [difficulty, setDifficulty] = useState(initialConfig.difficulty || rec.difficulty);
    const [time, setTime] = useState(initialConfig.time || initialConfig.timeLimit || rec.time);
    const [questions, setQuestions] = useState(initialConfig.questions || initialConfig.questionCount || initialConfig.totalQuestions || rec.questions);
    const [questionType, setQuestionType] = useState(initialConfig.questionType || rec.questionType || 'MCQ');
    const [negativeMarking, setNegativeMarking] = useState(initialConfig.negativeMarking ?? rec.negativeMarking ?? 0);
    const [language, setLanguage] = useState(initialConfig.language || rec.language || 'JavaScript');
    const [tone, setTone] = useState(initialConfig.tone || rec.tone || 'Professional');
    const [voiceEnabled, setVoiceEnabled] = useState(initialConfig.voiceEnabled !== undefined ? initialConfig.voiceEnabled : true);
    const [micEnabled, setMicEnabled] = useState(initialConfig.micEnabled !== undefined ? initialConfig.micEnabled : true);

    // Reset state when modal opens with new config
    useEffect(() => {
        if (isOpen) {
            setDifficulty(initialConfig.difficulty || rec.difficulty);
            setTime(initialConfig.time || initialConfig.timeLimit || rec.time);
            setQuestions(initialConfig.questions || initialConfig.questionCount || initialConfig.totalQuestions || rec.questions);
            setQuestionType(initialConfig.questionType || rec.questionType || 'MCQ');
            setNegativeMarking(initialConfig.negativeMarking ?? rec.negativeMarking ?? 0);
            setLanguage(initialConfig.language || rec.language || 'JavaScript');
            setTone(initialConfig.tone || rec.tone || 'Professional');
            setVoiceEnabled(initialConfig.voiceEnabled !== undefined ? initialConfig.voiceEnabled : true);
            setMicEnabled(initialConfig.micEnabled !== undefined ? initialConfig.micEnabled : true);
        }
    }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const handleGenerate = useCallback(() => {
        const config = { difficulty, questions, time };

        if (mode === 'exam') {
            config.questionType = questionType;
            config.negativeMarking = negativeMarking;
            config.timeLimit = time;
            config.totalQuestions = questions;
        } else if (mode === 'coding') {
            config.language = language;
            config.timeLimit = time;
        } else if (mode === 'interview') {
            config.tone = tone;
            config.questionCount = questions;
            config.voiceEnabled = voiceEnabled;
            config.micEnabled = micEnabled;
        }

        onGenerate(config);
    }, [difficulty, questions, time, questionType, negativeMarking, language, tone, voiceEnabled, micEnabled, mode, onGenerate]);

    if (!isOpen) return null;

    const info = MODE_INFO[mode] || MODE_INFO.exam;
    const displayEmoji = presetEmoji || info.emoji;
    const displayTitle = presetName ? `${presetName}` : info.title;
    const displayDesc = presetName ? info.desc : info.desc;

    return (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className={styles.modal} role="dialog" aria-modal="true" id="exam-config-modal">
                {/* ─── Header ─── */}
                <div className={styles.header}>
                    <div className={styles.headerTop}>
                        <div className={styles.headerEmoji}>{displayEmoji}</div>
                        <div>
                            <div className={styles.headerTitle}>{displayTitle}</div>
                        </div>
                    </div>
                    <div className={styles.headerDesc}>{displayDesc}</div>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close" id="config-modal-close">
                        <HiOutlineX />
                    </button>
                </div>

                {/* ─── Body ─── */}
                <div className={styles.body}>

                    {/* ── Difficulty (all modes) ── */}
                    <div className={styles.optionGroup}>
                        <div className={styles.optionLabel}>Difficulty</div>
                        <div className={styles.pillGrid}>
                            {DIFFICULTY_OPTIONS.map(opt => (
                                <Pill
                                    key={opt}
                                    label={opt}
                                    value={opt}
                                    active={difficulty === opt}
                                    recommended={opt === rec.difficulty}
                                    onClick={setDifficulty}
                                />
                            ))}
                        </div>
                    </div>

                    {/* ── Time (exam & coding) ── */}
                    {(mode === 'exam' || mode === 'coding') && (
                        <div className={styles.optionGroup}>
                            <div className={styles.optionLabel}>
                                Time Limit {mode === 'exam' ? '(minutes)' : '(mins total)'}
                            </div>
                            <div className={styles.pillGrid}>
                                {(mode === 'exam' ? EXAM_TIME_OPTIONS : CODING_TIME_OPTIONS).map(opt => (
                                    <Pill
                                        key={opt}
                                        label={`${opt} min`}
                                        value={opt}
                                        active={time === opt}
                                        recommended={opt === rec.time}
                                        onClick={setTime}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Questions Count ── */}
                    <div className={styles.optionGroup}>
                        <div className={styles.optionLabel}>
                            {mode === 'interview' ? 'Number of Questions' : mode === 'coding' ? 'Problems' : 'Total Questions'}
                        </div>
                        <div className={styles.pillGrid}>
                            {(mode === 'exam' ? EXAM_QUESTION_OPTIONS : mode === 'coding' ? CODING_QUESTION_OPTIONS : INTERVIEW_Q_OPTIONS).map(opt => (
                                <Pill
                                    key={opt}
                                    label={`${opt}`}
                                    value={opt}
                                    active={questions === opt}
                                    recommended={opt === rec.questions}
                                    onClick={setQuestions}
                                />
                            ))}
                        </div>
                    </div>

                    {/* ── Question Type (exam only) ── */}
                    {mode === 'exam' && (
                        <div className={styles.optionGroup}>
                            <div className={styles.optionLabel}>Question Type</div>
                            <div className={styles.pillGrid}>
                                {EXAM_TYPE_OPTIONS.map(opt => (
                                    <Pill
                                        key={opt}
                                        label={opt}
                                        value={opt}
                                        active={questionType === opt}
                                        recommended={opt === rec.questionType}
                                        onClick={setQuestionType}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Negative Marking (exam only) ── */}
                    {mode === 'exam' && (
                        <div className={styles.optionGroup}>
                            <div className={styles.optionLabel}>Negative Marking</div>
                            <div className={styles.pillGrid}>
                                {EXAM_NEG_OPTIONS.map(opt => (
                                    <Pill
                                        key={opt}
                                        label={opt === 0 ? 'None' : `-${opt}`}
                                        value={opt}
                                        active={negativeMarking === opt}
                                        recommended={opt === rec.negativeMarking}
                                        onClick={setNegativeMarking}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Language (coding only) ── */}
                    {mode === 'coding' && (
                        <div className={styles.optionGroup}>
                            <div className={styles.optionLabel}>Preferred Language</div>
                            <div className={styles.pillGrid}>
                                {CODING_LANG_OPTIONS.map(opt => (
                                    <Pill
                                        key={opt}
                                        label={opt}
                                        value={opt}
                                        active={language === opt}
                                        recommended={opt === rec.language}
                                        onClick={setLanguage}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Tone (interview only) ── */}
                    {mode === 'interview' && (
                        <div className={styles.optionGroup}>
                            <div className={styles.optionLabel}>Interview Tone</div>
                            <div className={styles.pillGrid}>
                                {INTERVIEW_TONE_OPTIONS.map(opt => (
                                    <Pill
                                        key={opt}
                                        label={opt}
                                        value={opt}
                                        active={tone === opt}
                                        recommended={opt === rec.tone}
                                        onClick={setTone}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Voice / Mic Toggles (interview only) ── */}
                    {mode === 'interview' && (
                        <>
                            <div className={styles.toggleRow}>
                                <div className={styles.toggleLabel}>
                                    <span className={styles.toggleLabelIcon}>🔊</span>
                                    AI Voice Response
                                </div>
                                <button
                                    className={`${styles.toggleSwitch} ${voiceEnabled ? styles.on : ''}`}
                                    onClick={() => setVoiceEnabled(v => !v)}
                                    type="button"
                                    id="toggle-voice"
                                />
                            </div>
                            <div className={styles.toggleRow}>
                                <div className={styles.toggleLabel}>
                                    <span className={styles.toggleLabelIcon}>🎙️</span>
                                    Microphone Input
                                </div>
                                <button
                                    className={`${styles.toggleSwitch} ${micEnabled ? styles.on : ''}`}
                                    onClick={() => setMicEnabled(v => !v)}
                                    type="button"
                                    id="toggle-mic"
                                />
                            </div>
                        </>
                    )}

                    {/* ── Summary Preview ── */}
                    <div className={styles.summaryPreview}>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>Difficulty</span>
                            <span className={styles.summaryValue}>{difficulty}</span>
                        </div>
                        {(mode === 'exam' || mode === 'coding') && (
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>Time</span>
                                <span className={styles.summaryValue}>{time} min</span>
                            </div>
                        )}
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>{mode === 'coding' ? 'Problems' : 'Questions'}</span>
                            <span className={styles.summaryValue}>{questions}</span>
                        </div>
                        {mode === 'exam' && (
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>Type</span>
                                <span className={styles.summaryValue}>{questionType}</span>
                            </div>
                        )}
                        {mode === 'interview' && (
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>Tone</span>
                                <span className={styles.summaryValue}>{tone}</span>
                            </div>
                        )}
                        {mode === 'coding' && (
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>Language</span>
                                <span className={styles.summaryValue}>{language}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── Footer ─── */}
                <div className={styles.footer}>
                    <button className={styles.cancelBtn} onClick={onClose} id="config-modal-cancel">
                        Cancel
                    </button>
                    <button className={styles.generateBtn} onClick={handleGenerate} id="config-modal-generate">
                        <HiOutlinePlay className={styles.btnIcon} />
                        {mode === 'interview' ? 'Start Interview' : mode === 'coding' ? 'Start Challenge' : 'Generate Exam'}
                    </button>
                </div>
            </div>
        </div>
    );
}
