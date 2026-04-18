'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { HiOutlineChatAlt2, HiOutlinePlay, HiOutlineMicrophone, HiOutlineVolumeUp, HiOutlineVolumeOff, HiOutlineRefresh, HiOutlineLogout, HiOutlineLightBulb, HiOutlineChevronDown, HiOutlineChevronUp } from 'react-icons/hi';
import { FetchExamModal, FetchExamCard, AddPresetCard, SavedPresetCard, SavedPresetsSection, useSavedPresets } from '../../components/PresetManager/PresetManager';
import ExamConfigModal from '../../components/ExamConfigModal/ExamConfigModal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Loader2, Send, AudioLines, LogOut } from 'lucide-react';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useNotification } from '@/app/components/BadgeNotification/BadgeNotification';
import { BarVisualizer } from '@/components/ui/bar-visualizer';
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from '@/components/ui/conversation';
import { Message, MessageContent } from '@/components/ui/message';
import { Response } from '@/components/ui/response';
import { ShimmeringText } from '@/components/ui/shimmering-text';

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
   MAIN COMPONENT
   ───────────────────────────────────────────── */
export default function InterviewPage() {
    const { notify } = useNotification();
    const [phase, setPhase] = useState('setup');
    // 'live' = BarVisualizer mode, 'transcript' = chat transcript mode
    const [viewMode, setViewMode] = useState('live');

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

    // Config modal state
    const [configModalOpen, setConfigModalOpen] = useState(false);
    const [configModalPreset, setConfigModalPreset] = useState({ name: '', emoji: '', initialConfig: {} });

    // Check for config passed from dashboard quick action
    useEffect(() => {
        try {
            const stored = sessionStorage.getItem('examConfigModalResult');
            if (stored) {
                const { mode, config } = JSON.parse(stored);
                sessionStorage.removeItem('examConfigModalResult');
                if (mode === 'interview' && config) {
                    handleConfigGenerate(config);
                }
            }
        } catch (e) { /* ignore */ }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    /* ─── Open config modal for a template ─── */
    function openConfigForTemplate(tmpl) {
        setSelectedTemplate(tmpl.id);
        setShowCustom(false);
        setFetchedConfig(null);
        setConfigModalPreset({
            name: tmpl.title,
            emoji: tmpl.emoji,
            initialConfig: {
                difficulty: tmpl.difficulty,
                questionCount: tmpl.questionCount,
                tone: tmpl.tone,
            },
        });
        setConfigModalOpen(true);
    }

    /* ─── Handle config modal generate ─── */
    function handleConfigGenerate(modalConfig) {
        setConfigModalOpen(false);
        // Apply modal config to interview settings
        const tmpl = interviewTemplates.find(t => t.id === selectedTemplate);
        const baseConfig = tmpl || { interviewType: 'technical', role: 'Candidate', topics: ['General'] };
        
        setVoiceEnabled(modalConfig.voiceEnabled !== undefined ? modalConfig.voiceEnabled : true);
        setMicEnabled(modalConfig.micEnabled !== undefined ? modalConfig.micEnabled : true);
        
        // Build final config and start interview directly
        const finalConfig = {
            interviewType: baseConfig.interviewType || 'technical',
            role: baseConfig.role || 'Candidate',
            company: '',
            topics: baseConfig.topics || ['General'],
            difficulty: modalConfig.difficulty || 'Medium',
            questionCount: modalConfig.questionCount || modalConfig.questions || 10,
            tone: modalConfig.tone || 'Professional',
        };
        
        startInterviewWithConfig(finalConfig, modalConfig.voiceEnabled !== false, modalConfig.micEnabled !== false);
    }

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
    const micStartTimeoutRef = useRef(null);

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
            clearTimeout(micStartTimeoutRef.current);
            micStartTimeoutRef.current = setTimeout(() => {
                console.log('[Interview] Auto-starting mic (awaitingMic)');
                startListening();
            }, 150); // Fast start — like Gemini Live
        }
        return () => clearTimeout(micStartTimeoutRef.current);
    }, [awaitingMic, isSpeaking, isThinking, micEnabled, sttSupported, phase, startListening]);

    // Watch for isSpeaking transition: was speaking → stopped → auto-start mic
    const prevSpeakingRef = useRef(false);
    useEffect(() => {
        if (prevSpeakingRef.current && !isSpeaking && phase === 'interview' && micEnabled && sttSupported) {
            // AI just finished speaking — immediately start listening
            if (!isThinking && !sendingRef.current && !isListening) {
                clearTimeout(micStartTimeoutRef.current);
                micStartTimeoutRef.current = setTimeout(() => {
                    if (!sendingRef.current && !isThinking) {
                        console.log('[Interview] Auto-starting mic after TTS ended');
                        startListening();
                    }
                }, 200);
            }
        }
        prevSpeakingRef.current = isSpeaking;
    }, [isSpeaking, isThinking, isListening, phase, micEnabled, sttSupported, startListening]);

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
                }, 800); // Faster restart
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
        await startInterviewWithConfig(config, voiceEnabled, micEnabled);
    }

    /* ─── Start Interview with explicit config ─── */
    async function startInterviewWithConfig(config, useVoice, useMic) {
        // Request mic permission NOW (user gesture context)
        if (useMic && sttSupported) {
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

            if (useVoice) {
                speak(greeting, () => {
                    // After AI finishes speaking, auto-start mic
                    console.log('[Interview] TTS ended, queuing mic');
                    if (useMic) setAwaitingMic(true);
                });
            } else if (useMic) {
                setAwaitingMic(true);
            }
        } catch (err) {
            console.error('Failed to start interview:', err);
            setIsThinking(false);
            setMessages([{ role: 'ai', text: 'Sorry, I had trouble getting started. Please try again.' }]);
            if (useMic && !useVoice) setAwaitingMic(true);
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
            const res = await fetch('/api/activities', {
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
            if (res.ok) {
                const actData = await res.json();
                if (actData.xp?.xpAwarded) {
                    notify({ emoji: '✨', title: `+${actData.xp.xpAwarded} XP earned!`, description: actData.xp.newBadges?.length > 0 ? `New badge: ${actData.xp.newBadges.map(b => b.emoji + ' ' + b.name).join(', ')}` : undefined });
                }
            }
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

    /* ─── Determine agent state for BarVisualizer ─── */
    function getAgentState() {
        if (isThinking) return 'thinking';
        if (isSpeaking) return 'speaking';
        if (isListening) return 'listening';
        if (awaitingMic) return 'initializing';
        return 'listening';
    }

    /* ─── Status label for Live view ─── */
    function getStatusLabel() {
        if (isThinking) return 'Processing...';
        if (isSpeaking) return 'Interviewer Speaking';
        if (isListening) return 'Listening...';
        if (awaitingMic) return 'Preparing Mic...';
        return 'Ready';
    }

    /* ═══════════════════════════════════════════
       RENDER: SETUP
       ═══════════════════════════════════════════ */
    if (phase === 'setup') {
        return (
            <div className="max-w-6xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500">
                <div className="text-center space-y-4">
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
                        <HiOutlineChatAlt2 className="inline-block mr-2" />
                        AI Interview <span className="gradient-text">Simulator</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Practice realistic interviews with AI. Get real-time voice feedback on your answers.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {interviewTemplates.map(t => (
                        <Card
                            key={t.id}
                            className={cn("p-6 cursor-pointer transition-all hover:border-primary/50", selectedTemplate === t.id && !showCustom && !fetchedConfig ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "")}
                            onClick={() => openConfigForTemplate(t)}
                        >
                            <div className="text-4xl mb-4">{t.emoji}</div>
                            <h3 className="font-bold text-lg mb-2">{t.title}</h3>
                            <p className="text-sm text-muted-foreground mb-4">{t.desc}</p>
                            <div className="flex flex-wrap gap-2">
                                {t.topics.slice(0, 4).map((topic, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">{topic}</Badge>
                                ))}
                                {t.topics.length > 4 && <Badge variant="secondary" className="text-xs">+{t.topics.length - 4}</Badge>}
                            </div>
                        </Card>
                    ))}
                    <Card
                        className={cn("p-6 cursor-pointer transition-all border-dashed bg-secondary/30 flex flex-col items-center justify-center text-center hover:border-primary/50", showCustom ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "")}
                        onClick={() => { setShowCustom(true); setSelectedTemplate(null); setFetchedConfig(null); }}
                    >
                        <div className="text-4xl mb-4">✨</div>
                        <h3 className="font-bold text-lg mb-2">Custom Interview</h3>
                        <p className="text-sm text-muted-foreground">Design your own</p>
                    </Card>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FetchExamCard onClick={() => setShowFetchModal(true)} />
                    <AddPresetCard
                        onFetchClick={() => setShowFetchModal(true)}
                        onCustomClick={() => { setShowCustom(true); setSelectedTemplate(null); setFetchedConfig(null); }}
                    />
                </div>

                {/* Saved Presets */}
                <SavedPresetsSection count={savedPresets.length}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

                {fetchedConfig && (
                    <Card className="flex items-center gap-4 p-4 border-primary/20 bg-primary/5">
                        <span className="text-4xl px-2">{fetchedConfig.emoji || '🎤'}</span>
                        <div>
                            <div className="font-bold text-lg">{fetchedConfig.title || fetchedConfig.name || 'Fetched Interview'}</div>
                            <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                                {fetchedConfig.role || fetchedConfig.interviewType} • <Badge variant="outline">{fetchedConfig.difficulty || 'Medium'}</Badge> • {fetchedConfig.questionCount || 10} Qs
                            </div>
                        </div>
                    </Card>
                )}

                {showCustom && !fetchedConfig && (
                    <Card className="p-6 md:p-8 space-y-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2">✨ Build Your Interview</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Role / Position *</label>
                                <Input placeholder="e.g. Senior React Developer" value={customConfig.role} onChange={e => setCustomConfig(p => ({ ...p, role: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Company (Optional)</label>
                                <Input placeholder="e.g. Google, Amazon" value={customConfig.company} onChange={e => setCustomConfig(p => ({ ...p, company: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Difficulty</label>
                                <Select value={customConfig.difficulty} onValueChange={v => setCustomConfig(p => ({ ...p, difficulty: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Easy">Easy</SelectItem><SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="Hard">Hard</SelectItem><SelectItem value="Expert">Expert</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Questions</label>
                                <Select value={customConfig.questionCount.toString()} onValueChange={v => setCustomConfig(p => ({ ...p, questionCount: parseInt(v) }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">5 Questions</SelectItem><SelectItem value="10">10 Questions</SelectItem>
                                        <SelectItem value="15">15 Questions</SelectItem><SelectItem value="20">20 Questions</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Tone</label>
                                <Select value={customConfig.tone} onValueChange={v => setCustomConfig(p => ({ ...p, tone: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Friendly">Friendly</SelectItem><SelectItem value="Professional">Professional</SelectItem>
                                        <SelectItem value="Challenging">Challenging</SelectItem><SelectItem value="Formal">Formal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-2 space-y-3 pt-2 w-full">
                                <label className="text-sm font-semibold">Topics ({customConfig.topics.length} selected)</label>
                                <div className="flex flex-wrap gap-2">
                                    {customTopicOptions.map(topic => (
                                        <Badge
                                            key={topic}
                                            variant={customConfig.topics.includes(topic) ? "default" : "outline"}
                                            className="cursor-pointer text-xs py-1"
                                            onClick={() => toggleCustomTopic(topic)}
                                        >
                                            {topic}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 bg-secondary/20 rounded-2xl border">
                    <div className="flex items-center gap-4 shrink-0">
                        <Button variant={voiceEnabled ? "default" : "outline"} onClick={() => setVoiceEnabled(v => !v)} className={cn("gap-2 w-32", voiceEnabled ? "bg-primary text-primary-foreground" : "")}>
                            {voiceEnabled ? <HiOutlineVolumeUp className="w-5 h-5"/> : <HiOutlineVolumeOff className="w-5 h-5"/>}
                            Speaker
                        </Button>
                        {sttSupported && (
                            <Button variant={micEnabled ? "default" : "outline"} onClick={() => setMicEnabled(v => !v)} className={cn("gap-2 w-32", micEnabled ? "bg-primary text-primary-foreground" : "")}>
                                <HiOutlineMicrophone className="w-5 h-5" />
                                Mic
                            </Button>
                        )}
                    </div>
                    <Button size="lg" className="w-full sm:w-auto gap-2 text-lg h-14 px-8" disabled={!canStart()} onClick={startInterview}>
                        <HiOutlinePlay className="w-6 h-6" /> Start Interview
                    </Button>
                </div>

                <FetchExamModal
                    isOpen={showFetchModal}
                    onClose={() => setShowFetchModal(false)}
                    onUseConfig={handleUseFetchedConfig}
                    onSavePreset={handleSavePreset}
                    mode="interview"
                />

                <ExamConfigModal
                    isOpen={configModalOpen}
                    onClose={() => setConfigModalOpen(false)}
                    onGenerate={handleConfigGenerate}
                    mode="interview"
                    presetName={configModalPreset.name}
                    presetEmoji={configModalPreset.emoji}
                    initialConfig={configModalPreset.initialConfig}
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
            <div className="max-w-5xl mx-auto py-8 px-4 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-4">
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight">📊 Interview <span className="gradient-text">Results</span></h1>
                    <p className="text-muted-foreground text-lg">
                        {isEarlyExit
                            ? `You exited early after answering ${questionsAnswered} of ${totalQs} questions.`
                            : `Here's your comprehensive analysis across ${questionsAnswered} questions.`
                        }
                    </p>
                </div>

                <Card className="p-8 text-center bg-card shadow-sm border-border flex flex-col items-center">
                    <div className="text-7xl font-black gradient-text mb-4">{avgScore}%</div>
                    <div className="text-2xl font-bold mb-8">{grade}</div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                        <div className="flex flex-col gap-1 p-4 rounded-xl bg-secondary/30">
                            <span className="text-2xl font-bold text-indigo-400">{scores.knowledge}%</span>
                            <span className="text-sm text-muted-foreground font-semibold">Knowledge</span>
                        </div>
                        <div className="flex flex-col gap-1 p-4 rounded-xl bg-secondary/30">
                            <span className="text-2xl font-bold text-green-400">{scores.communication}%</span>
                            <span className="text-sm text-muted-foreground font-semibold">Communication</span>
                        </div>
                        <div className="flex flex-col gap-1 p-4 rounded-xl bg-secondary/30">
                            <span className="text-2xl font-bold text-amber-400">{scores.confidence}%</span>
                            <span className="text-sm text-muted-foreground font-semibold">Confidence</span>
                        </div>
                        <div className="flex flex-col gap-1 p-4 rounded-xl bg-secondary/30">
                            <span className="text-2xl font-bold text-foreground">{questionsAnswered}/{totalQs}</span>
                            <span className="text-sm text-muted-foreground font-semibold">Answered</span>
                        </div>
                    </div>
                </Card>

                {analysisLoading && (
                    <div className="flex flex-col items-center justify-center p-12 space-y-4">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        <p className="text-muted-foreground font-medium text-lg">Generating personalized AI analysis...</p>
                    </div>
                )}

                {analysis && (
                    <div className="space-y-6">
                        <Card className="p-6 md:p-8 bg-primary/5 border-primary/20 space-y-4 shadow-inner">
                            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-primary/20 pb-4">
                                <span className="text-2xl font-bold">Verdict: {analysis.overallGrade}</span>
                                <Badge variant="secondary" className="px-4 py-1.5 text-sm uppercase tracking-wider">{analysis.readinessLevel}</Badge>
                            </div>
                            <p className="text-lg leading-relaxed text-foreground/90">{analysis.overallVerdict}</p>
                        </Card>

                        {analysis.topicBreakdown && analysis.topicBreakdown.length > 0 && (
                            <Card className="p-6 space-y-6">
                                <h2 className="text-xl font-bold">📋 Topic-wise Breakdown</h2>
                                <div className="space-y-4">
                                    {analysis.topicBreakdown.map((topic, i) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <span className="w-1/3 font-medium truncate">{topic.topic}</span>
                                            <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all duration-1000" style={{
                                                    width: `${(topic.score / topic.maxScore) * 100}%`,
                                                    background: topic.score >= 7 ? 'linear-gradient(90deg, #22c55e, #4ade80)' : topic.score >= 4 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #ef4444, #f87171)',
                                                }} />
                                            </div>
                                            <span className="w-12 text-right font-bold">{topic.score}/{topic.maxScore}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        <div className="grid md:grid-cols-2 gap-6">
                            {analysis.strengthAreas && analysis.strengthAreas.length > 0 && (
                                <Card className="p-6 space-y-4 bg-green-500/5 border-green-500/20">
                                    <h2 className="text-xl font-bold text-green-500 flex items-center gap-2">💪 Strengths</h2>
                                    <div className="space-y-4">
                                        {analysis.strengthAreas.map((s, i) => (
                                            <div key={i} className="space-y-1">
                                                <div className="font-semibold text-foreground">✓ {s.area}</div>
                                                <p className="text-sm text-muted-foreground">{s.detail}</p>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}
                            {analysis.improvementAreas && analysis.improvementAreas.length > 0 && (
                                <Card className="p-6 space-y-4 bg-amber-500/5 border-amber-500/20">
                                    <h2 className="text-xl font-bold text-amber-500 flex items-center gap-2">🎯 Areas of Improvement</h2>
                                    <div className="space-y-4">
                                        {analysis.improvementAreas.map((imp, i) => (
                                            <div key={i} className="space-y-1">
                                                <div className="font-semibold text-foreground">⚡ {imp.area}</div>
                                                <p className="text-sm text-muted-foreground">{imp.detail}</p>
                                                {imp.actionItem && (
                                                    <div className="flex items-start gap-2 mt-2 p-2 bg-amber-500/10 rounded text-sm text-amber-600 dark:text-amber-400">
                                                        <HiOutlineLightBulb className="w-5 h-5 shrink-0" />
                                                        <span>{imp.actionItem}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}
                        </div>

                        {analysis.communicationFeedback && (
                            <Card className="p-6 space-y-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">🗣️ Communication Assessment</h2>
                                <div className="grid sm:grid-cols-3 gap-4">
                                    {analysis.communicationFeedback.clarity && (
                                        <div className="p-4 bg-secondary/30 rounded-xl">
                                            <h4 className="font-semibold mb-2">Clarity</h4>
                                            <p className="text-sm text-muted-foreground">{analysis.communicationFeedback.clarity}</p>
                                        </div>
                                    )}
                                    {analysis.communicationFeedback.depth && (
                                        <div className="p-4 bg-secondary/30 rounded-xl">
                                            <h4 className="font-semibold mb-2">Depth</h4>
                                            <p className="text-sm text-muted-foreground">{analysis.communicationFeedback.depth}</p>
                                        </div>
                                    )}
                                    {analysis.communicationFeedback.examples && (
                                        <div className="p-4 bg-secondary/30 rounded-xl">
                                            <h4 className="font-semibold mb-2">Use of Examples</h4>
                                            <p className="text-sm text-muted-foreground">{analysis.communicationFeedback.examples}</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}
                        
                        {analysis.nextSteps && analysis.nextSteps.length > 0 && (
                            <Card className="p-6 space-y-4">
                                <h2 className="text-xl font-bold flex items-center gap-2">🚀 Next Steps</h2>
                                <div className="space-y-3">
                                    {analysis.nextSteps.map((step, i) => (
                                        <div key={i} className="flex gap-3 items-start">
                                            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-sm font-bold">{i + 1}</div>
                                            <p className="pt-0.5">{step}</p>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>
                )}

                <Card className="p-6 space-y-4">
                    <h2 className="text-xl font-bold mb-4">📝 Question-by-Question Review</h2>
                    <div className="space-y-3">
                        {reviewData.map((item, i) => (
                            <div key={i} className="border rounded-xl overflow-hidden bg-card transition-all">
                                <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/50" onClick={() => toggleQuestionExpand(i)}>
                                    <div className="flex items-center gap-4 min-w-0 pr-4">
                                        <span className="font-mono font-bold text-muted-foreground shrink-0 w-8">Q{i + 1}</span>
                                        <span className="truncate font-medium flex-1">{item.question}</span>
                                    </div>
                                    <div className="flex items-center gap-4 shrink-0">
                                        <Badge variant={item.score >= 7 ? 'success' : item.score >= 4 ? 'warning' : 'destructive'} className="w-12 justify-center">{item.score}/10</Badge>
                                        {expandedQuestions[i] ? <HiOutlineChevronUp className="w-5 h-5 text-muted-foreground" /> : <HiOutlineChevronDown className="w-5 h-5 text-muted-foreground" />}
                                    </div>
                                </div>
                                {expandedQuestions[i] && (
                                    <div className="p-4 bg-secondary/10 border-t space-y-4">
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Question</h4>
                                            <p className="text-sm font-medium">{item.question}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Your Answer</h4>
                                            <p className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3 py-1">{item.answer}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">AI Feedback</h4>
                                            <p className="text-sm text-foreground/90">{item.feedback}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>

                <div className="flex justify-center pt-4">
                    <Button size="lg" onClick={resetAll} className="gap-2 h-14 px-8 text-lg">
                        <HiOutlineRefresh className="w-5 h-5" /> Start New Interview
                    </Button>
                </div>
            </div>
        );
    }

    /* ═══════════════════════════════════════════
       RENDER: LIVE INTERVIEW
       ═══════════════════════════════════════════ */
    const agentState = getAgentState();
    const statusLabel = getStatusLabel();

    /* Typing-dot keyframes — injected once for transcript thinking indicator */
    const typingDotCSS = `@keyframes typing-dot { 0%, 100% { transform: translateY(0); opacity: 0.5; } 50% { transform: translateY(-5px); opacity: 1; } }`;

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] bg-background">
            <style dangerouslySetInnerHTML={{ __html: typingDotCSS }} />

            {/* ═══ Top Bar ═══ */}
            <header className="flex items-center justify-between px-4 py-3 border-b bg-card/80 backdrop-blur-sm z-10 shrink-0">
                {/* Left — Topic + Question Counter */}
                <Badge variant="outline" className="text-sm py-1.5 px-4 font-mono tracking-wide border-border/60">
                    {interviewConfig?.topics?.[0] || 'Topic'} Q {String(questionCount).padStart(2, '0')}/{interviewConfig?.questionCount || 10}
                </Badge>

                {/* Center — Live / Transcript Tabs */}
                <Tabs value={viewMode} onValueChange={setViewMode} className="">
                    <TabsList className="h-9 bg-secondary/60 backdrop-blur">
                        <TabsTrigger value="live" className="text-xs sm:text-sm px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            Live
                        </TabsTrigger>
                        <TabsTrigger value="transcript" className="text-xs sm:text-sm px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            Transcript
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Right — Exit */}
                <Button variant="ghost" size="sm" onClick={exitInterview} className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Exit</span>
                </Button>
            </header>

            {/* ═══ LIVE TAB — BarVisualizer ═══ */}
            {viewMode === 'live' && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                    {/* Centered visualizer + status */}
                    <div className="flex flex-col items-center gap-6 w-full max-w-xl">
                        {/* Bar Visualizer */}
                        <BarVisualizer
                            state={agentState}
                            demo={true}
                            barCount={24}
                            minHeight={10}
                            maxHeight={90}
                            centerAlign={false}
                            className="h-48 md:h-56 w-full"
                        />

                        {/* Status Pill */}
                        <div className="inline-flex items-center justify-center gap-2.5 px-6 py-2 rounded-full bg-secondary/60 backdrop-blur border border-border/40 text-sm font-semibold uppercase tracking-wider text-muted-foreground shadow-sm min-w-44">
                            {isThinking && <ShimmeringText text="Processing..." className="text-sm" />}
                            {isSpeaking && <ShimmeringText text="Interviewer Speaking" className="text-sm" />}
                            {isListening && (
                                <>
                                    <span className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                                    <span>Listening...</span>
                                </>
                            )}
                            {!isThinking && !isSpeaking && !isListening && (
                                <span>{awaitingMic ? 'Preparing Mic...' : 'Ready'}</span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ TRANSCRIPT TAB — Conversation UI ═══ */}
            {viewMode === 'transcript' && (
                <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full border-x border-border/40 bg-card overflow-hidden">
                    {/* Message Area */}
                    <Conversation className="flex-1">
                        <ConversationContent className="p-4 sm:p-6 pb-2">
                            {messages.length === 0 && !isThinking ? (
                                <ConversationEmptyState
                                    icon={
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-muted-foreground/60">
                                            <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.8" />
                                            <circle cx="12" cy="5" r="2" fill="currentColor" opacity="0.5" />
                                            <circle cx="5" cy="12" r="2" fill="currentColor" opacity="0.5" />
                                            <circle cx="19" cy="12" r="2" fill="currentColor" opacity="0.5" />
                                        </svg>
                                    }
                                    title={
                                        agentState === 'connecting' || agentState === 'initializing'
                                            ? <ShimmeringText text="Starting conversation" />
                                            : 'Start a conversation'
                                    }
                                    description="Type a message or tap the voice button"
                                />
                            ) : (
                                <>
                                    {messages.map((msg, i) => {
                                        /* ─── Feedback messages ─── */
                                        if (msg.role === 'feedback') {
                                            return (
                                                <div key={i} className="my-4 p-4 rounded-xl bg-secondary/20 border border-border/50 self-center mx-4 sm:mx-12 animate-in fade-in duration-300">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <Badge variant="outline" className="text-xs">📝 Feedback</Badge>
                                                        {msg.score !== undefined && (
                                                            <span className={cn("font-bold text-sm", msg.score >= 7 ? "text-success" : msg.score >= 4 ? "text-warning" : "text-destructive")}>
                                                                Score: {msg.score}/10
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground space-y-1">
                                                        {msg.text.split('\n').map((line, j) => (
                                                            <span key={j} className="block">
                                                                {line.startsWith('**') ? <strong className="text-foreground">{line.replace(/\*\*/g, '')}</strong> : line}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        /* ─── User / AI messages ─── */
                                        const role = msg.role === 'ai' ? 'assistant' : 'user';
                                        return (
                                            <Message key={i} from={role}>
                                                <MessageContent>
                                                    <Response
                                                        className={cn(
                                                            role === 'assistant'
                                                                ? 'bg-secondary/50 text-foreground rounded-tl-sm'
                                                                : 'bg-brand text-brand-foreground rounded-tr-sm'
                                                        )}
                                                    >
                                                        {msg.text.split('\n').map((line, j) => (
                                                            <span key={j} className="block">
                                                                {line.startsWith('**') ? <strong>{line.replace(/\*\*/g, '')}</strong> : line}
                                                            </span>
                                                        ))}
                                                    </Response>
                                                </MessageContent>
                                                {role === 'assistant' && (
                                                    <div className="ring-border/50 size-7 flex-shrink-0 self-end overflow-hidden rounded-full ring-1 bg-secondary/60 flex items-center justify-center">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
                                                            <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.8" />
                                                            <circle cx="12" cy="5" r="1.5" fill="currentColor" opacity="0.5" />
                                                            <circle cx="5" cy="12" r="1.5" fill="currentColor" opacity="0.5" />
                                                            <circle cx="19" cy="12" r="1.5" fill="currentColor" opacity="0.5" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </Message>
                                        );
                                    })}

                                    {/* Thinking indicator */}
                                    {isThinking && (
                                        <Message from="assistant">
                                            <MessageContent>
                                                <div className="px-4 py-4 rounded-2xl bg-secondary/50 rounded-tl-sm flex gap-1.5 items-center">
                                                    <div className="w-2 h-2 rounded-full bg-muted-foreground" style={{ animation: 'typing-dot 1.4s infinite ease-in-out' }} />
                                                    <div className="w-2 h-2 rounded-full bg-muted-foreground" style={{ animation: 'typing-dot 1.4s infinite ease-in-out 0.2s' }} />
                                                    <div className="w-2 h-2 rounded-full bg-muted-foreground" style={{ animation: 'typing-dot 1.4s infinite ease-in-out 0.4s' }} />
                                                </div>
                                            </MessageContent>
                                            <div className="ring-border/50 size-7 flex-shrink-0 self-end overflow-hidden rounded-full ring-1 bg-secondary/60 flex items-center justify-center">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-muted-foreground animate-pulse">
                                                    <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.8" />
                                                    <circle cx="12" cy="5" r="1.5" fill="currentColor" opacity="0.5" />
                                                    <circle cx="5" cy="12" r="1.5" fill="currentColor" opacity="0.5" />
                                                    <circle cx="19" cy="12" r="1.5" fill="currentColor" opacity="0.5" />
                                                </svg>
                                            </div>
                                        </Message>
                                    )}

                                    {/* Live transcript while listening */}
                                    {isListening && transcript && (
                                        <Message from="user">
                                            <MessageContent>
                                                <Response className="bg-brand/70 text-brand-foreground rounded-tr-sm italic opacity-80">
                                                    🎙️ {transcript}
                                                </Response>
                                            </MessageContent>
                                        </Message>
                                    )}
                                </>
                            )}
                        </ConversationContent>
                        <ConversationScrollButton />
                    </Conversation>

                    {/* ─── Input Footer ─── */}
                    <div className="px-4 py-3 bg-background border-t border-border/40 shrink-0">
                        <div className="flex items-center gap-2 max-w-4xl mx-auto">
                            <Input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); manualSend(); } }}
                                placeholder={isListening ? 'Listening... speak your answer' : 'Type a message...'}
                                className="h-10 flex-1 focus-visible:ring-0 focus-visible:ring-offset-0 bg-card border-border/60"
                                disabled={isThinking}
                            />
                            <Button
                                size="icon"
                                variant="ghost"
                                className="rounded-full h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground"
                                onClick={manualSend}
                                disabled={isThinking || !input.trim()}
                            >
                                <Send className="w-4 h-4" />
                                <span className="sr-only">Send message</span>
                            </Button>
                            {micEnabled && sttSupported && (
                                <Button
                                    size="icon"
                                    variant={isListening ? 'secondary' : 'ghost'}
                                    className={cn(
                                        'rounded-full h-10 w-10 shrink-0 transition-all',
                                        isListening
                                            ? 'text-destructive bg-destructive/10 animate-pulse shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                    onClick={toggleMic}
                                    disabled={isThinking}
                                >
                                    <AudioLines className="w-4 h-4" />
                                    <span className="sr-only">{isListening ? 'Stop listening' : 'Start voice'}</span>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
