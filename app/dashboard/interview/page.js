'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { HiOutlineChatAlt2, HiOutlinePlay, HiOutlineMicrophone, HiOutlineVolumeUp, HiOutlineVolumeOff, HiOutlineRefresh, HiOutlineLogout, HiOutlineLightBulb, HiOutlineChevronDown, HiOutlineChevronUp } from 'react-icons/hi';
import { FetchExamModal, FetchExamCard, AddPresetCard, SavedPresetCard, SavedPresetsSection, useSavedPresets } from '../../components/PresetManager/PresetManager';
import styles from './interview.module.css';

/* ─────────────────────────────────────────────
   INTERVIEW TEMPLATES
   ───────────────────────────────────────────── */
const interviewTemplates = [
    {
        id: 'technical',
        emoji: '💻',
        title: 'Technical Interview',
        desc: 'DSA, OS, DBMS, System Design',
        interviewType: 'technical',
        role: 'Software Engineer',
        topics: ['DSA', 'OS', 'DBMS', 'Networking', 'System Design'],
        difficulty: 'Medium',
        questionCount: 10,
        tone: 'Professional',
    },
    {
        id: 'hr',
        emoji: '🤝',
        title: 'HR / Behavioral',
        desc: 'Behavioral, Communication, Goals',
        interviewType: 'hr',
        role: 'General Candidate',
        topics: ['Behavioral', 'Communication', 'Salary Negotiation', 'Teamwork', 'Leadership'],
        difficulty: 'Medium',
        questionCount: 10,
        tone: 'Friendly',
    },
    {
        id: 'government',
        emoji: '🏛️',
        title: 'Personality Test',
        desc: 'Ethics, Current Affairs, DAF',
        interviewType: 'government',
        role: 'Civil Services Candidate',
        topics: ['Ethics', 'Current Affairs', 'DAF', 'Opinion', 'Governance'],
        difficulty: 'Hard',
        questionCount: 10,
        tone: 'Formal',
    },
    {
        id: 'frontend',
        emoji: '🎨',
        title: 'Frontend Developer',
        desc: 'React, CSS, Performance, a11y',
        interviewType: 'technical',
        role: 'Frontend Developer',
        topics: ['React', 'JavaScript', 'CSS', 'Web Performance', 'Accessibility', 'TypeScript'],
        difficulty: 'Medium',
        questionCount: 10,
        tone: 'Professional',
    },
    {
        id: 'cloud',
        emoji: '☁️',
        title: 'Cloud & DevOps',
        desc: 'AWS, Docker, CI/CD, K8s',
        interviewType: 'technical',
        role: 'DevOps Engineer',
        topics: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Linux', 'Terraform'],
        difficulty: 'Medium',
        questionCount: 10,
        tone: 'Professional',
    },
    {
        id: 'datascience',
        emoji: '📊',
        title: 'Data Science / ML',
        desc: 'ML, Statistics, Python, Models',
        interviewType: 'technical',
        role: 'Data Scientist',
        topics: ['Machine Learning', 'Statistics', 'Python', 'Deep Learning', 'NLP', 'Data Analysis'],
        difficulty: 'Medium',
        questionCount: 10,
        tone: 'Professional',
    },
    {
        id: 'consulting',
        emoji: '🏢',
        title: 'Management Consulting',
        desc: 'Case Studies, Frameworks, Strategy',
        interviewType: 'hr',
        role: 'Management Consultant',
        topics: ['Case Studies', 'Market Sizing', 'Business Strategy', 'Problem Solving', 'Communication'],
        difficulty: 'Hard',
        questionCount: 10,
        tone: 'Challenging',
    },
    {
        id: 'campus',
        emoji: '🎓',
        title: 'Campus Placement',
        desc: 'Aptitude, CS Basics, HR',
        interviewType: 'technical',
        role: 'Fresh Graduate',
        topics: ['OOP', 'Basic DSA', 'DBMS Basics', 'OS Basics', 'HR Questions'],
        difficulty: 'Easy',
        questionCount: 10,
        tone: 'Friendly',
    },
];

const customTopicOptions = [
    'DSA', 'System Design', 'OOP', 'DBMS', 'OS', 'Networking',
    'React', 'JavaScript', 'TypeScript', 'Node.js', 'Python', 'Java',
    'AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Git',
    'Machine Learning', 'Deep Learning', 'Statistics', 'NLP',
    'Behavioral', 'Leadership', 'Teamwork', 'Communication',
    'SQL', 'MongoDB', 'Redis', 'GraphQL', 'REST API',
    'Web Security', 'Performance', 'Testing', 'Agile',
];

/* ─────────────────────────────────────────────
   TTS HOOK — with onEnd callback + Chrome fix
   ───────────────────────────────────────────── */
function useSpeechSynthesis() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const onEndRef = useRef(null);
    const pollRef = useRef(null);

    const fireOnEnd = useCallback(() => {
        clearInterval(pollRef.current);
        setIsSpeaking(false);
        const cb = onEndRef.current;
        onEndRef.current = null;
        if (cb) cb();
    }, []);

    const speak = useCallback((text, onEnd) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) {
            if (onEnd) onEnd();
            return;
        }
        window.speechSynthesis.cancel();
        clearInterval(pollRef.current);
        onEndRef.current = onEnd || null;

        const clean = text.replace(/\*\*/g, '').replace(/---/g, '').replace(/\n{2,}/g, '. ').replace(/\n/g, '. ').trim();
        const utt = new SpeechSynthesisUtterance(clean);
        utt.rate = 1.05;
        utt.pitch = 1.0;
        utt.volume = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en'))
            || voices.find(v => v.name.includes('Microsoft') && v.lang.startsWith('en') && v.name.includes('Online'))
            || voices.find(v => v.lang.startsWith('en-') && v.localService === false)
            || voices.find(v => v.lang.startsWith('en'));
        if (preferred) utt.voice = preferred;

        let ended = false;
        utt.onstart = () => setIsSpeaking(true);
        utt.onend = () => { if (!ended) { ended = true; fireOnEnd(); } };
        utt.onerror = () => { if (!ended) { ended = true; fireOnEnd(); } };

        window.speechSynthesis.speak(utt);

        // Chrome bug workaround: onend sometimes never fires.
        // Poll speechSynthesis.speaking to detect when it actually stops.
        pollRef.current = setInterval(() => {
            if (!window.speechSynthesis.speaking && !ended) {
                ended = true;
                fireOnEnd();
            }
        }, 300);
    }, [fireOnEnd]);

    const stop = useCallback(() => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;
        clearInterval(pollRef.current);
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        onEndRef.current = null;
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.getVoices();
            window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
        }
        return () => {
            clearInterval(pollRef.current);
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    return { isSpeaking, speak, stop };
}

/* ─────────────────────────────────────────────
   STT HOOK — with silence detection callback
   ───────────────────────────────────────────── */
function useSpeechRecognition({ onSilence } = {}) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [supported, setSupported] = useState(true);
    const recognitionRef = useRef(null);
    const finalTranscriptRef = useRef('');
    const silenceTimerRef = useRef(null);
    const onSilenceRef = useRef(onSilence);
    const hasSpokenRef = useRef(false);

    useEffect(() => { onSilenceRef.current = onSilence; }, [onSilence]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { setSupported(false); return; }

        const recognition = new SR();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            let interim = '';
            let final = finalTranscriptRef.current;
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const t = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    final += t + ' ';
                    finalTranscriptRef.current = final;
                } else {
                    interim += t;
                }
            }
            setTranscript(final + interim);
            hasSpokenRef.current = true;

            // Reset silence timer — user is speaking
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
                // 2s of silence after speech → auto-send
                if (hasSpokenRef.current && onSilenceRef.current) {
                    const finalText = finalTranscriptRef.current.trim() || (final + interim).trim();
                    if (finalText) onSilenceRef.current(finalText);
                }
            }, 2000);
        };

        recognition.onerror = (e) => {
            if (e.error !== 'aborted' && e.error !== 'no-speech') {
                console.warn('Speech recognition error:', e.error);
            }
            clearTimeout(silenceTimerRef.current);
            setIsListening(false);
        };

        recognition.onend = () => {
            clearTimeout(silenceTimerRef.current);
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        return () => clearTimeout(silenceTimerRef.current);
    }, []);

    const startListening = useCallback(() => {
        if (!recognitionRef.current) return;
        finalTranscriptRef.current = '';
        hasSpokenRef.current = false;
        setTranscript('');
        clearTimeout(silenceTimerRef.current);
        try {
            recognitionRef.current.start();
            setIsListening(true);
        } catch (e) {
            console.warn('Could not start recognition:', e);
        }
    }, []);

    const stopListening = useCallback(() => {
        if (!recognitionRef.current) return;
        clearTimeout(silenceTimerRef.current);
        recognitionRef.current.stop();
        setIsListening(false);
        return finalTranscriptRef.current.trim() || transcript.trim();
    }, [transcript]);

    const resetTranscript = useCallback(() => {
        finalTranscriptRef.current = '';
        hasSpokenRef.current = false;
        setTranscript('');
    }, []);

    return { isListening, transcript, supported, startListening, stopListening, resetTranscript };
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */
export default function InterviewPage() {
    const [phase, setPhase] = useState('setup');
    // 'avatar' = simple AI orb mode, 'transcript' = chat transcript mode
    const [viewMode, setViewMode] = useState('avatar');

    // Setup
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [showCustom, setShowCustom] = useState(false);
    const [customConfig, setCustomConfig] = useState({
        role: '', company: '', topics: [], difficulty: 'Medium', questionCount: 10, tone: 'Professional',
    });
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [micEnabled, setMicEnabled] = useState(true);

    // Smart Presets
    const [showFetchModal, setShowFetchModal] = useState(false);
    const [fetchedConfig, setFetchedConfig] = useState(null);
    const { presets: savedPresets, savePreset, deletePreset } = useSavedPresets('examai_interview_presets');

    /* ─── Handle AI-fetched interview config ─── */
    function handleUseFetchedConfig(config) {
        setFetchedConfig(config);
        setSelectedTemplate(config.interviewType || 'technical');
        setShowCustom(false);
    }

    /* ─── Handle saved preset selection ─── */
    function handleSelectSavedPreset(preset) {
        setFetchedConfig(preset);
        setSelectedTemplate(preset.interviewType || preset.id || 'technical');
        setShowCustom(false);
    }

    /* ─── Save preset to localStorage ─── */
    function handleSavePreset(config) {
        savePreset({
            name: config.title || 'Custom Interview',
            emoji: config.emoji || '🎤',
            desc: config.description || '',
            interviewType: config.interviewType,
            role: config.role,
            company: config.company,
            topics: config.topics,
            difficulty: config.difficulty,
            questionCount: config.questionCount,
            tone: config.tone,
        });
    }

    // Interview
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [scores, setScores] = useState({ knowledge: 0, communication: 0, confidence: 0 });
    const [totalScores, setTotalScores] = useState({ knowledge: 0, communication: 0, confidence: 0 });
    const [questionCount, setQuestionCount] = useState(0);
    const [currentQ, setCurrentQ] = useState(null);
    const [interviewConfig, setInterviewConfig] = useState(null);
    const [questionHistory, setQuestionHistory] = useState([]);
    const [reviewData, setReviewData] = useState([]);
    const [lastFeedback, setLastFeedback] = useState(null);
    const [lastScore, setLastScore] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [expandedQuestions, setExpandedQuestions] = useState({});
    const activitySavedRef = useRef(false);

    // Awaiting mic (after AI finishes speaking, should we auto-start mic?)
    const [awaitingMic, setAwaitingMic] = useState(false);

    const chatRef = useRef(null);
    const sendingRef = useRef(false); // prevent double-send

    // TTS
    const { isSpeaking, speak, stop: stopSpeaking } = useSpeechSynthesis();

    // Auto-send callback for silence detection
    const handleSilenceAutoSend = useCallback((finalText) => {
        if (sendingRef.current || !finalText) return;
        submitAnswer(finalText);
    }, []); // submitAnswer will be defined via ref approach

    // We need to use a ref-based approach so the callback doesn't go stale
    const submitAnswerRef = useRef(null);
    const handleSilence = useCallback((finalText) => {
        if (submitAnswerRef.current && finalText) {
            submitAnswerRef.current(finalText);
        }
    }, []);

    // STT with auto-send on silence
    const { isListening, transcript, supported: sttSupported, startListening, stopListening, resetTranscript } =
        useSpeechRecognition({ onSilence: handleSilence });

    // Auto-scroll chat
    useEffect(() => {
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, [messages, isThinking]);

    // Sync transcript → input in transcript mode
    useEffect(() => {
        if (isListening && transcript) setInput(transcript);
    }, [transcript, isListening]);

    // Auto-start mic when awaitingMic becomes true and we're not thinking/speaking
    useEffect(() => {
        if (awaitingMic && !isSpeaking && !isThinking && micEnabled && sttSupported && phase === 'interview') {
            setAwaitingMic(false);
            // Small delay so browser doesn't choke
            const t = setTimeout(() => {
                console.log('[Interview] Auto-starting mic');
                startListening();
            }, 500);
            return () => clearTimeout(t);
        }
    }, [awaitingMic, isSpeaking, isThinking, micEnabled, sttSupported, phase, startListening]);

    // Fallback: watch isSpeaking go from true→false to trigger mic
    const wasSpeakingRef = useRef(false);
    useEffect(() => {
        if (wasSpeakingRef.current && !isSpeaking && !isThinking && micEnabled && sttSupported && phase === 'interview' && !isListening) {
            // Speech just ended — trigger mic after a moment
            const t = setTimeout(() => {
                console.log('[Interview] Fallback: speech ended, starting mic');
                startListening();
            }, 800);
            wasSpeakingRef.current = false;
            return () => clearTimeout(t);
        }
        wasSpeakingRef.current = isSpeaking;
    }, [isSpeaking, isThinking, micEnabled, sttSupported, phase, isListening, startListening]);

    // Auto-restart mic if browser stops recognition unexpectedly (e.g. silence/timeout)
    const prevListeningRef = useRef(false);
    useEffect(() => {
        // Detect transition: was listening → no longer listening
        if (prevListeningRef.current && !isListening && phase === 'interview' && micEnabled && sttSupported) {
            // Only restart if we're not in the middle of something else
            if (!isSpeaking && !isThinking && !sendingRef.current) {
                const t = setTimeout(() => {
                    // Re-check conditions at execution time (state may have changed)
                    if (!sendingRef.current && !isSpeaking && !isThinking) {
                        console.log('[Interview] Auto-restarting mic after unexpected stop');
                        startListening();
                    }
                }, 1500);
                prevListeningRef.current = isListening;
                return () => clearTimeout(t);
            }
        }
        prevListeningRef.current = isListening;
    }, [isListening, isSpeaking, isThinking, phase, micEnabled, sttSupported, startListening]);

    /* ─── Config ─── */
    function getConfig() {
        if (fetchedConfig) {
            return {
                interviewType: fetchedConfig.interviewType || 'technical',
                role: fetchedConfig.role || 'Candidate',
                company: fetchedConfig.company || '',
                topics: fetchedConfig.topics || ['General'],
                difficulty: fetchedConfig.difficulty || 'Medium',
                questionCount: fetchedConfig.questionCount || 10,
                tone: fetchedConfig.tone || 'Professional',
            };
        }
        if (showCustom) {
            return {
                interviewType: 'technical',
                role: customConfig.role || 'Software Engineer',
                company: customConfig.company || '',
                topics: customConfig.topics.length > 0 ? customConfig.topics : ['General'],
                difficulty: customConfig.difficulty,
                questionCount: customConfig.questionCount,
                tone: customConfig.tone,
            };
        }
        const tmpl = interviewTemplates.find(t => t.id === selectedTemplate);
        if (!tmpl) return null;
        return {
            interviewType: tmpl.interviewType, role: tmpl.role, company: '',
            topics: tmpl.topics, difficulty: tmpl.difficulty,
            questionCount: tmpl.questionCount, tone: tmpl.tone,
        };
    }

    /* ─── Request mic permission (must be called from a user gesture) ─── */
    async function requestMicPermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Got permission — stop tracks immediately, we just needed the grant
            stream.getTracks().forEach(t => t.stop());
            console.log('[Interview] Mic permission granted');
            return true;
        } catch (e) {
            console.warn('[Interview] Mic permission denied:', e);
            return false;
        }
    }

    /* ─── Start Interview ─── */
    async function startInterview() {
        const config = getConfig();
        if (!config) return;

        // Request mic permission NOW (user gesture context)
        if (micEnabled && sttSupported) {
            await requestMicPermission();
        }

        setInterviewConfig(config);
        setPhase('interview');
        setMessages([]);
        setScores({ knowledge: 0, communication: 0, confidence: 0 });
        setTotalScores({ knowledge: 0, communication: 0, confidence: 0 });
        setQuestionCount(0);
        setQuestionHistory([]);
        setReviewData([]);
        setIsThinking(true);
        setLastFeedback(null);
        setLastScore(null);

        try {
            const res = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'interview-question', config: { ...config, history: [] } }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            const greeting = `Hello! I'll be your interviewer today for the ${config.role} position${config.company ? ` at ${config.company}` : ''}. Let's get started.\n\n${data.question}`;

            setCurrentQ(data);
            setQuestionHistory([data.question]);
            setQuestionCount(1);
            setMessages([{ role: 'ai', text: greeting }]);
            setIsThinking(false);

            if (voiceEnabled) {
                speak(greeting, () => {
                    // After AI finishes speaking, auto-start mic
                    console.log('[Interview] TTS ended, queuing mic');
                    if (micEnabled) setAwaitingMic(true);
                });
            } else if (micEnabled) {
                setAwaitingMic(true);
            }
        } catch (err) {
            console.error('Failed to start interview:', err);
            setIsThinking(false);
            setMessages([{ role: 'ai', text: 'Sorry, I had trouble getting started. Please try again.' }]);
        }
    }

    /* ─── Submit Answer (used by both manual send and auto-send) ─── */
    async function submitAnswer(answerText) {
        const answer = (answerText || input).trim();
        if (!answer || isThinking || sendingRef.current) return;

        sendingRef.current = true;
        stopSpeaking();
        if (isListening) stopListening();
        resetTranscript();

        setInput('');
        setLastFeedback(null);
        setLastScore(null);
        setMessages(prev => [...prev, { role: 'user', text: answer }]);
        setIsThinking(true);

        const isLastQuestion = questionCount >= (interviewConfig?.questionCount || 10);

        try {
            if (isLastQuestion) {
                const evalRes = await fetch('/api/gemini', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'evaluate-answer',
                        config: { question: currentQ?.question, answer, expectedPoints: currentQ?.expectedPoints },
                    }),
                });
                const evaluation = await evalRes.json();
                if (evaluation.error) throw new Error(evaluation.error);

                updateScores(evaluation);
                setReviewData(prev => [...prev, { question: currentQ?.question, answer, score: evaluation.score, feedback: evaluation.feedback }]);

                const closingMsg = `${evaluation.feedback}\n\nThank you for completing this interview! Let me compile your results.`;
                setMessages(prev => [...prev, { role: 'feedback', text: closingMsg, score: evaluation.score }]);
                setLastFeedback(closingMsg);
                setLastScore(evaluation.score);
                setIsThinking(false);
                sendingRef.current = false;

                if (voiceEnabled) {
                    speak(closingMsg, () => setTimeout(() => setPhase('summary'), 1000));
                } else {
                    setTimeout(() => setPhase('summary'), 2500);
                }
            } else {
                const res = await fetch('/api/gemini', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'interview-respond',
                        config: {
                            ...interviewConfig,
                            question: currentQ?.question,
                            expectedPoints: currentQ?.expectedPoints,
                            answer, history: questionHistory,
                            questionNumber: questionCount,
                        },
                    }),
                });
                const data = await res.json();
                if (data.error) throw new Error(data.error);

                updateScores(data);
                setReviewData(prev => [...prev, { question: currentQ?.question, answer, score: data.score, feedback: data.feedback }]);

                const nextQ = {
                    question: data.nextQuestion,
                    expectedPoints: data.nextExpectedPoints,
                    difficulty: data.nextDifficulty,
                    topic: data.nextTopic,
                };
                setCurrentQ(nextQ);
                setQuestionHistory(prev => [...prev, data.nextQuestion]);
                setQuestionCount(c => c + 1);

                setMessages(prev => [
                    ...prev,
                    { role: 'feedback', text: data.feedback, score: data.score },
                    { role: 'ai', text: data.nextQuestion },
                ]);
                setLastFeedback(data.feedback);
                setLastScore(data.score);
                setIsThinking(false);
                sendingRef.current = false;

                if (voiceEnabled) {
                    const combined = `${data.feedback}. ${data.nextQuestion}`;
                    speak(combined, () => {
                        if (micEnabled) setAwaitingMic(true);
                    });
                } else if (micEnabled) {
                    setAwaitingMic(true);
                }
            }
        } catch (err) {
            console.error('Error processing answer:', err);
            setIsThinking(false);
            sendingRef.current = false;
            setMessages(prev => [...prev, { role: 'ai', text: 'I had a brief issue. Could you repeat your answer?' }]);
            if (micEnabled) setAwaitingMic(true);
        }
    }

    // Keep the ref updated
    submitAnswerRef.current = submitAnswer;

    /* ─── Score: divide by TOTAL expected questions, not just answered ─── */
    function updateScores(evaluation) {
        const kScore = Math.min(10, Math.max(0, evaluation.knowledgeScore ?? evaluation.score ?? 5));
        const cScore = Math.min(10, Math.max(0, evaluation.communicationScore ?? evaluation.score ?? 5));
        const confScore = Math.min(10, Math.max(0, evaluation.confidenceScore ?? evaluation.score ?? 5));

        setTotalScores(prev => ({
            knowledge: prev.knowledge + kScore,
            communication: prev.communication + cScore,
            confidence: prev.confidence + confScore,
        }));

        // Divide by TOTAL expected questions so early exit = lower score
        const totalQs = interviewConfig?.questionCount || 10;
        setScores({
            knowledge: Math.round(((totalScores.knowledge + kScore) / totalQs) * 10),
            communication: Math.round(((totalScores.communication + cScore) / totalQs) * 10),
            confidence: Math.round(((totalScores.confidence + confScore) / totalQs) * 10),
        });
    }

    /* ─── Manual mic toggle (transcript mode) ─── */
    function toggleMic() {
        if (isListening) {
            const finalText = stopListening();
            if (finalText) setInput(finalText);
        } else {
            stopSpeaking();
            resetTranscript();
            setInput('');
            startListening();
        }
    }

    /* ─── Manual send (transcript mode) ─── */
    function manualSend() {
        const text = input.trim();
        if (!text) return;
        if (isListening) stopListening();
        submitAnswer(text);
    }

    /* ─── Save interview result to DB ─── */
    async function saveInterviewActivity(data) {
        if (activitySavedRef.current) return;
        activitySavedRef.current = true;
        try {
            const totalQs = interviewConfig?.questionCount || 10;
            const totalEarned = data.reduce((s, r) => s + (r.score || 0), 0);
            const totalPossible = totalQs * 10;
            const pct = Math.round((totalEarned / totalPossible) * 100);
            await fetch('/api/activities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'interview',
                    title: `${interviewConfig?.interviewType || 'Technical'} Interview — ${interviewConfig?.role || 'General'}`,
                    score: totalEarned,
                    totalMarks: totalPossible,
                    details: {
                        role: interviewConfig?.role,
                        interviewType: interviewConfig?.interviewType,
                        difficulty: interviewConfig?.difficulty,
                        topics: interviewConfig?.topics,
                        questionsAnswered: data.length,
                        totalQuestions: totalQs,
                        knowledgeScore: scores.knowledge,
                        communicationScore: scores.communication,
                        confidenceScore: scores.confidence,
                    },
                }),
            });
        } catch (err) {
            console.error('Failed to save interview activity:', err);
        }
    }

    /* ─── Exit Interview (early exit → results) ─── */
    function exitInterview() {
        stopSpeaking();
        if (isListening) stopListening();
        sendingRef.current = false;
        if (reviewData.length > 0) {
            saveInterviewActivity(reviewData);
            setPhase('summary');
        } else {
            resetAll();
        }
    }

    /* ─── End / Reset ─── */
    function endInterview() {
        stopSpeaking();
        if (isListening) stopListening();
        sendingRef.current = false;
        if (reviewData.length > 0) {
            saveInterviewActivity(reviewData);
            setPhase('summary');
        } else {
            resetAll();
        }
    }

    function resetAll() {
        stopSpeaking();
        if (isListening) stopListening();
        sendingRef.current = false;
        setPhase('setup');
        setMessages([]);
        setQuestionCount(0);
        setCurrentQ(null);
        setInterviewConfig(null);
        setQuestionHistory([]);
        setReviewData([]);
        setScores({ knowledge: 0, communication: 0, confidence: 0 });
        setTotalScores({ knowledge: 0, communication: 0, confidence: 0 });
        setInput('');
        setIsThinking(false);
        setLastFeedback(null);
        setLastScore(null);
        setAwaitingMic(false);
        setAnalysis(null);
        setAnalysisLoading(false);
        setExpandedQuestions({});
        activitySavedRef.current = false;
    }

    /* ─── Fetch AI Analysis ─── */
    async function fetchAnalysis() {
        if (analysisLoading || analysis) return;
        setAnalysisLoading(true);
        try {
            const res = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'interview-analysis',
                    config: { reviewData, interviewConfig, scores },
                }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setAnalysis(data);
        } catch (err) {
            console.error('Failed to fetch analysis:', err);
            // Provide fallback analysis
            setAnalysis({
                overallVerdict: 'Analysis could not be generated. Review your Q&A below for self-assessment.',
                overallGrade: avgScoreForAnalysis >= 80 ? 'A' : avgScoreForAnalysis >= 60 ? 'B' : avgScoreForAnalysis >= 40 ? 'C' : 'D',
                readinessLevel: avgScoreForAnalysis >= 70 ? 'Almost Ready' : 'Needs Improvement',
                strengthAreas: [],
                improvementAreas: [],
                topicBreakdown: [],
                communicationFeedback: { clarity: '', depth: '', examples: '', tips: [] },
                nextSteps: ['Review feedback on each question', 'Practice weak areas', 'Try another mock interview'],
                mockInterviewTip: 'Consistent practice is key. Each interview teaches you something new.',
            });
        } finally {
            setAnalysisLoading(false);
        }
    }

    const avgScoreForAnalysis = reviewData.length > 0
        ? Math.round(reviewData.reduce((s, r) => s + (r.score || 0), 0) / ((interviewConfig?.questionCount || 10) * 10) * 100)
        : 0;

    function toggleQuestionExpand(idx) {
        setExpandedQuestions(prev => ({ ...prev, [idx]: !prev[idx] }));
    }

    function toggleCustomTopic(topic) {
        setCustomConfig(prev => ({
            ...prev,
            topics: prev.topics.includes(topic)
                ? prev.topics.filter(t => t !== topic)
                : [...prev.topics, topic],
        }));
    }

    function canStart() {
        if (fetchedConfig) return true;
        if (showCustom) return customConfig.role.trim().length > 0;
        return selectedTemplate !== null;
    }

    /* ─── Determine orb state ─── */
    function getOrbState() {
        if (isThinking) return 'orbThinking';
        if (isSpeaking) return 'orbSpeaking';
        if (isListening) return 'orbListening';
        return 'orbIdle';
    }

    /* ═══════════════════════════════════════════
       RENDER: SETUP
       ═══════════════════════════════════════════ */
    if (phase === 'setup') {
        return (
            <div className={styles.setupPage}>
                <h1>
                    <HiOutlineChatAlt2 style={{ display: 'inline', verticalAlign: 'middle' }} />{' '}
                    AI Interview <span className="gradient-text">Simulator</span>
                </h1>
                <p>Practice realistic interviews with AI. Get real-time voice feedback on your answers.</p>

                <div className={styles.templateGrid}>
                    {interviewTemplates.map(t => (
                        <div
                            key={t.id}
                            className={`${styles.templateCard} ${selectedTemplate === t.id && !showCustom && !fetchedConfig ? styles.selected : ''}`}
                            onClick={() => { setSelectedTemplate(t.id); setShowCustom(false); setFetchedConfig(null); }}
                        >
                            <div className={styles.templateEmoji}>{t.emoji}</div>
                            <h3>{t.title}</h3>
                            <p>{t.desc}</p>
                            <div className={styles.templateTopics}>
                                {t.topics.slice(0, 4).map((topic, i) => (
                                    <span key={i} className={styles.templateTopic}>{topic}</span>
                                ))}
                                {t.topics.length > 4 && <span className={styles.templateTopic}>+{t.topics.length - 4}</span>}
                            </div>
                        </div>
                    ))}
                    <div
                        className={`${styles.templateCard} ${styles.customCard} ${showCustom ? styles.selected : ''}`}
                        onClick={() => { setShowCustom(true); setSelectedTemplate(null); setFetchedConfig(null); }}
                    >
                        <div className={styles.templateEmoji}>✨</div>
                        <h3>Custom Interview</h3>
                        <p>Design your own interview</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
                    <FetchExamCard onClick={() => setShowFetchModal(true)} />
                    <AddPresetCard
                        onFetchClick={() => setShowFetchModal(true)}
                        onCustomClick={() => { setShowCustom(true); setSelectedTemplate(null); setFetchedConfig(null); }}
                    />
                </div>

                {/* Saved Presets */}
                <SavedPresetsSection count={savedPresets.length}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                        {savedPresets.map((p) => (
                            <SavedPresetCard
                                key={p.id}
                                preset={p}
                                isSelected={fetchedConfig?.id === p.id}
                                onSelect={() => handleSelectSavedPreset(p)}
                                onDelete={deletePreset}
                            />
                        ))}
                    </div>
                </SavedPresetsSection>

                {/* Fetched config banner */}
                {fetchedConfig && (
                    <div className={styles.fetchedBanner}>
                        <span>{fetchedConfig.emoji || '🎤'}</span>
                        <strong>{fetchedConfig.title || fetchedConfig.name || 'Fetched Interview'}</strong>
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                            — {fetchedConfig.role || fetchedConfig.interviewType} • {fetchedConfig.difficulty || 'Medium'} • {fetchedConfig.questionCount || 10} Qs
                        </span>
                    </div>
                )}

                {showCustom && !fetchedConfig && (
                    <div className={styles.customBuilder}>
                        <h2>✨ Build Your Interview</h2>
                        <div className={styles.builderGrid}>
                            <div className={styles.fieldGroup}>
                                <label>Role / Position *</label>
                                <input type="text" placeholder="e.g. Senior React Developer" value={customConfig.role}
                                    onChange={e => setCustomConfig(p => ({ ...p, role: e.target.value }))} />
                            </div>
                            <div className={styles.fieldGroup}>
                                <label>Company (Optional)</label>
                                <input type="text" placeholder="e.g. Google, Amazon" value={customConfig.company}
                                    onChange={e => setCustomConfig(p => ({ ...p, company: e.target.value }))} />
                            </div>
                            <div className={styles.fieldGroup}>
                                <label>Difficulty</label>
                                <select value={customConfig.difficulty} onChange={e => setCustomConfig(p => ({ ...p, difficulty: e.target.value }))}>
                                    <option value="Easy">Easy</option><option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option><option value="Expert">Expert</option>
                                </select>
                            </div>
                            <div className={styles.fieldGroup}>
                                <label>Questions</label>
                                <select value={customConfig.questionCount} onChange={e => setCustomConfig(p => ({ ...p, questionCount: parseInt(e.target.value) }))}>
                                    <option value={5}>5 Questions</option><option value={10}>10 Questions</option>
                                    <option value={15}>15 Questions</option><option value={20}>20 Questions</option>
                                </select>
                            </div>
                            <div className={styles.fieldGroup}>
                                <label>Tone</label>
                                <select value={customConfig.tone} onChange={e => setCustomConfig(p => ({ ...p, tone: e.target.value }))}>
                                    <option value="Friendly">Friendly</option><option value="Professional">Professional</option>
                                    <option value="Challenging">Challenging</option><option value="Formal">Formal</option>
                                </select>
                            </div>
                            <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                                <label>Topics ({customConfig.topics.length} selected)</label>
                                <div className={styles.topicChips}>
                                    {customTopicOptions.map(topic => (
                                        <button key={topic}
                                            className={`${styles.topicChip} ${customConfig.topics.includes(topic) ? styles.active : ''}`}
                                            onClick={() => toggleCustomTopic(topic)}
                                        >{topic}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className={styles.startControls}>
                    <div className={styles.voiceToggles}>
                        <button className={`${styles.voiceToggle} ${voiceEnabled ? styles.active : ''}`}
                            onClick={() => setVoiceEnabled(v => !v)}>
                            {voiceEnabled ? <HiOutlineVolumeUp /> : <HiOutlineVolumeOff />}
                            Speaker {voiceEnabled ? 'On' : 'Off'}
                        </button>
                        {sttSupported && (
                            <button className={`${styles.voiceToggle} ${micEnabled ? styles.active : ''}`}
                                onClick={() => setMicEnabled(v => !v)}>
                                <HiOutlineMicrophone />
                                Mic {micEnabled ? 'On' : 'Off'}
                            </button>
                        )}
                    </div>
                    <button className={styles.startBtn} disabled={!canStart()} onClick={startInterview}>
                        <HiOutlinePlay /> Start Interview
                    </button>
                </div>

                {/* Fetch Modal */}
                <FetchExamModal
                    isOpen={showFetchModal}
                    onClose={() => setShowFetchModal(false)}
                    onUseConfig={handleUseFetchedConfig}
                    onSavePreset={handleSavePreset}
                    mode="interview"
                />
            </div>
        );
    }

    /* ═══════════════════════════════════════════
       RENDER: SUMMARY (Comprehensive Results)
       ═══════════════════════════════════════════ */
    if (phase === 'summary') {
        const totalQs = interviewConfig?.questionCount || 10;
        const avgScore = reviewData.length > 0
            ? Math.round(reviewData.reduce((s, r) => s + (r.score || 0), 0) / (totalQs * 10) * 100)
            : 0;
        const grade = avgScore >= 90 ? 'Excellent!' : avgScore >= 75 ? 'Great Job!' : avgScore >= 50 ? 'Good Effort!' : 'Keep Practicing!';
        const questionsAnswered = reviewData.length;
        const isEarlyExit = questionsAnswered < totalQs;

        // Auto-fetch analysis on mount
        if (!analysis && !analysisLoading) {
            fetchAnalysis();
        }

        return (
            <div className={styles.summaryPage}>
                {/* Header */}
                <div className={styles.resultsHeader}>
                    <h1>📊 Interview <span className="gradient-text">Results</span></h1>
                    <p>
                        {isEarlyExit
                            ? `You exited early after answering ${questionsAnswered} of ${totalQs} questions.`
                            : `Here's your comprehensive analysis across ${questionsAnswered} questions.`
                        }
                    </p>
                </div>

                {/* Score Card — like exam results */}
                <div className={styles.resultsScoreCard}>
                    <div className={styles.resultsScorePercent}>{avgScore}%</div>
                    <div className={styles.resultsScoreGrade}>{grade}</div>
                    <div className={styles.resultsScoreStats}>
                        <div className={styles.resultsScoreStat}>
                            <span className={styles.resultsStatVal} style={{ color: '#818cf8' }}>{scores.knowledge}%</span>
                            <span className={styles.resultsStatLbl}>Knowledge</span>
                        </div>
                        <div className={styles.resultsScoreStat}>
                            <span className={styles.resultsStatVal} style={{ color: '#4ade80' }}>{scores.communication}%</span>
                            <span className={styles.resultsStatLbl}>Communication</span>
                        </div>
                        <div className={styles.resultsScoreStat}>
                            <span className={styles.resultsStatVal} style={{ color: '#fbbf24' }}>{scores.confidence}%</span>
                            <span className={styles.resultsStatLbl}>Confidence</span>
                        </div>
                        <div className={styles.resultsScoreStat}>
                            <span className={styles.resultsStatVal}>{questionsAnswered}/{totalQs}</span>
                            <span className={styles.resultsStatLbl}>Answered</span>
                        </div>
                    </div>
                </div>

                {/* AI Analysis Section */}
                {analysisLoading && (
                    <div className={styles.analysisLoading}>
                        <div className={styles.analysisSpinner} />
                        <p>Generating comprehensive analysis...</p>
                    </div>
                )}

                {analysis && (
                    <>
                        {/* Overall Verdict */}
                        <div className={styles.verdictCard}>
                            <div className={styles.verdictHeader}>
                                <span className={styles.verdictGrade}>{analysis.overallGrade}</span>
                                <span className={styles.verdictReadiness} data-level={analysis.readinessLevel?.replace(/\s+/g, '-').toLowerCase()}>
                                    {analysis.readinessLevel}
                                </span>
                            </div>
                            <p className={styles.verdictText}>{analysis.overallVerdict}</p>
                        </div>

                        {/* Topic Breakdown */}
                        {analysis.topicBreakdown && analysis.topicBreakdown.length > 0 && (
                            <div className={styles.analysisSection}>
                                <h2>📋 Topic-wise Breakdown</h2>
                                <div className={styles.topicBreakdown}>
                                    {analysis.topicBreakdown.map((topic, i) => (
                                        <div key={i} className={styles.topicRow}>
                                            <span className={styles.topicName}>{topic.topic}</span>
                                            <div className={styles.topicBar}>
                                                <div className={styles.topicFill} style={{
                                                    width: `${(topic.score / topic.maxScore) * 100}%`,
                                                    background: topic.score >= 7 ? 'linear-gradient(90deg, #22c55e, #4ade80)' : topic.score >= 4 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #ef4444, #f87171)',
                                                }} />
                                            </div>
                                            <span className={styles.topicScore}>{topic.score}/{topic.maxScore}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Strengths & Improvements */}
                        <div className={styles.strengthsImprovements}>
                            {analysis.strengthAreas && analysis.strengthAreas.length > 0 && (
                                <div className={styles.analysisSection}>
                                    <h2>💪 Strengths</h2>
                                    {analysis.strengthAreas.map((s, i) => (
                                        <div key={i} className={styles.strengthItem}>
                                            <div className={styles.strengthTitle}>✓ {s.area}</div>
                                            <p className={styles.strengthDetail}>{s.detail}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {analysis.improvementAreas && analysis.improvementAreas.length > 0 && (
                                <div className={styles.analysisSection}>
                                    <h2>🎯 Areas of Improvement</h2>
                                    {analysis.improvementAreas.map((imp, i) => (
                                        <div key={i} className={styles.improvementItem}>
                                            <div className={styles.improvementTitle}>⚡ {imp.area}</div>
                                            <p className={styles.improvementDetail}>{imp.detail}</p>
                                            {imp.actionItem && (
                                                <div className={styles.actionItem}>
                                                    <HiOutlineLightBulb style={{ flexShrink: 0 }} />
                                                    <span>{imp.actionItem}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Communication Feedback */}
                        {analysis.communicationFeedback && (
                            <div className={styles.analysisSection}>
                                <h2>🗣️ Communication Assessment</h2>
                                <div className={styles.commGrid}>
                                    {analysis.communicationFeedback.clarity && (
                                        <div className={styles.commCard}>
                                            <h4>Clarity</h4>
                                            <p>{analysis.communicationFeedback.clarity}</p>
                                        </div>
                                    )}
                                    {analysis.communicationFeedback.depth && (
                                        <div className={styles.commCard}>
                                            <h4>Depth</h4>
                                            <p>{analysis.communicationFeedback.depth}</p>
                                        </div>
                                    )}
                                    {analysis.communicationFeedback.examples && (
                                        <div className={styles.commCard}>
                                            <h4>Use of Examples</h4>
                                            <p>{analysis.communicationFeedback.examples}</p>
                                        </div>
                                    )}
                                </div>
                                {analysis.communicationFeedback.tips && analysis.communicationFeedback.tips.length > 0 && (
                                    <div className={styles.commTips}>
                                        <h4>💡 Tips</h4>
                                        <ul>
                                            {analysis.communicationFeedback.tips.map((tip, i) => (
                                                <li key={i}>{tip}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Next Steps */}
                        {analysis.nextSteps && analysis.nextSteps.length > 0 && (
                            <div className={styles.analysisSection}>
                                <h2>🚀 Next Steps</h2>
                                <div className={styles.nextStepsList}>
                                    {analysis.nextSteps.map((step, i) => (
                                        <div key={i} className={styles.nextStepItem}>
                                            <span className={styles.nextStepNum}>{i + 1}</span>
                                            <span>{step}</span>
                                        </div>
                                    ))}
                                </div>
                                {analysis.mockInterviewTip && (
                                    <div className={styles.proTip}>
                                        <strong>💎 Pro Tip:</strong> {analysis.mockInterviewTip}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* Question-by-Question Review (collapsible) */}
                <div className={styles.analysisSection}>
                    <h2>📝 Question-by-Question Review</h2>
                    {reviewData.map((item, i) => (
                        <div key={i} className={styles.summaryQItem}>
                            <div className={styles.summaryQHeader} onClick={() => toggleQuestionExpand(i)} style={{ cursor: 'pointer' }}>
                                <div className={styles.summaryQLeft}>
                                    <span className={styles.summaryQNumber}>Q{i + 1}</span>
                                    <span className={styles.summaryQPreview}>
                                        {item.question.length > 80 ? item.question.substring(0, 80) + '...' : item.question}
                                    </span>
                                </div>
                                <div className={styles.summaryQRight}>
                                    <span className={styles.summaryQScore} style={{
                                        background: item.score >= 7 ? 'rgba(34,197,94,0.12)' : item.score >= 4 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                                        color: item.score >= 7 ? '#4ade80' : item.score >= 4 ? '#fbbf24' : '#f87171',
                                    }}>{item.score}/10</span>
                                    {expandedQuestions[i] ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
                                </div>
                            </div>
                            {expandedQuestions[i] && (
                                <div className={styles.summaryQExpanded}>
                                    <div className={styles.summaryQQuestion}>{item.question}</div>
                                    <div className={styles.summaryQAnswer}>{item.answer}</div>
                                    <div className={styles.summaryQFeedback}>{item.feedback}</div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className={styles.resultActions}>
                    <button className={styles.restartBtn} onClick={resetAll}>
                        <HiOutlineRefresh /> Start New Interview
                    </button>
                </div>
            </div>
        );
    }

    /* ═══════════════════════════════════════════
       RENDER: LIVE INTERVIEW
       ═══════════════════════════════════════════ */
    const orbState = getOrbState();

    return (
        <div className={styles.interviewLayout}>
            {/* ── Top Bar ── */}
            <div className={styles.topBar}>
                <div className={styles.topBarLeft}>
                    <div className={styles.statusDot} />
                    <h3>🎤 {interviewConfig?.role || 'Interview'}</h3>
                    <span className={styles.questionBadge}>Q{questionCount}/{interviewConfig?.questionCount || 10}</span>
                </div>
                <div className={styles.topBarRight}>
                    <button className={styles.modeToggle}
                        onClick={() => setViewMode(v => v === 'avatar' ? 'transcript' : 'avatar')}>
                        {viewMode === 'avatar' ? '📝 Transcript' : '🤖 Simple'}
                    </button>
                    <button className={styles.exitBtn} onClick={exitInterview}>
                        <HiOutlineLogout /> Exit
                    </button>
                </div>
            </div>

            {/* ══ AVATAR MODE — fully automatic, no buttons ══ */}
            {viewMode === 'avatar' && (
                <div className={styles.avatarMode}>
                    {/* AI Orb */}
                    <div className={`${styles.orbContainer} ${styles[orbState]}`}>
                        <div className={styles.orbCore} />
                    </div>

                    {/* Status Label */}
                    <div className={styles.avatarStatus}>
                        {isThinking && (
                            <div className={styles.statusLabel}>Thinking...</div>
                        )}
                        {isSpeaking && (
                            <div className={styles.statusLabel}>Speaking</div>
                        )}
                        {isListening && (
                            <div className={styles.statusLabel}><span className={styles.recDot} /> Listening</div>
                        )}
                        {!isThinking && !isSpeaking && !isListening && (
                            <div className={styles.statusLabel}>Ready</div>
                        )}

                        {/* Current question */}
                        {currentQ?.question && !isThinking && (
                            <div className={styles.currentQuestion}>{currentQ.question}</div>
                        )}

                        {/* Live transcript while user speaks */}
                        {isListening && transcript && (
                            <div className={styles.liveTranscript}>
                                &ldquo;{transcript}&rdquo;
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ══ TRANSCRIPT MODE ══ */}
            {viewMode === 'transcript' && (
                <div className={styles.transcriptMode}>
                    <div className={styles.chatMessages} ref={chatRef}>
                        {messages.map((msg, i) => {
                            if (msg.role === 'feedback') {
                                return (
                                    <div key={i} className={styles.feedbackMsg}>
                                        <div className={styles.msgLabel}>📝 Feedback</div>
                                        {msg.score !== undefined && (
                                            <div className={`${styles.feedbackScore} ${
                                                msg.score >= 7 ? styles.high : msg.score >= 4 ? styles.mid : styles.low
                                            }`}>Score: {msg.score}/10</div>
                                        )}
                                        {msg.text.split('\n').map((line, j) => (
                                            <span key={j}>{line.startsWith('**') ? <strong>{line.replace(/\*\*/g, '')}</strong> : line}<br /></span>
                                        ))}
                                    </div>
                                );
                            }
                            return (
                                <div key={i} className={`${styles.message} ${msg.role === 'ai' ? styles.aiMsg : styles.userMsg}`}>
                                    <div className={styles.msgLabel}>{msg.role === 'ai' ? '🤖 Interviewer' : '👤 You'}</div>
                                    {msg.text.split('\n').map((line, j) => (
                                        <span key={j}>{line.startsWith('**') ? <strong>{line.replace(/\*\*/g, '')}</strong> : line}<br /></span>
                                    ))}
                                </div>
                            );
                        })}
                        {isThinking && (
                            <div className={styles.typing}>
                                <div className={styles.typingDot} /><div className={styles.typingDot} /><div className={styles.typingDot} />
                            </div>
                        )}
                    </div>

                    {isListening && transcript && (
                        <div className={styles.transcriptLive}>🎙️ {transcript}</div>
                    )}

                    <div className={styles.chatInputArea}>
                        <textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder={isListening ? 'Listening... speak your answer' : 'Type your answer...'}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); manualSend(); } }}
                            disabled={isThinking}
                        />
                        <div className={styles.inputActions}>
                            {micEnabled && sttSupported && (
                                <button className={`${styles.micBtn} ${isListening ? styles.recording : ''}`}
                                    onClick={toggleMic} disabled={isThinking}>
                                    <HiOutlineMicrophone />
                                </button>
                            )}
                            <button className={styles.sendBtn} onClick={manualSend}
                                disabled={isThinking || !input.trim()}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
