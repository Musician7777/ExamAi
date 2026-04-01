'use client';
import { useState, useRef, useEffect } from 'react';
import { HiOutlineChatAlt2, HiOutlinePlay } from 'react-icons/hi';
import { FetchExamModal, FetchExamCard, AddPresetCard, SavedPresetCard, SavedPresetsSection, useSavedPresets } from '../../components/PresetManager/PresetManager';
import styles from './interview.module.css';

const interviewTypes = [
    { id: 'technical', emoji: '💻', title: 'Technical Interview', desc: 'DSA, OS, DBMS, System Design', topics: ['DSA', 'OS', 'DBMS', 'Networking', 'System Design'] },
    { id: 'hr', emoji: '🤝', title: 'HR Interview', desc: 'Behavioral, Communication, Goals', topics: ['Behavioral', 'Communication', 'Salary', 'Teamwork'] },
    { id: 'government', emoji: '🏛️', title: 'Personality Test', desc: 'Ethics, Current Affairs, Situations', topics: ['Ethics', 'Current Affairs', 'DAF', 'Opinion'] },
];

export default function InterviewPage() {
    const [selectedType, setSelectedType] = useState(null);
    const [started, setStarted] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [scores, setScores] = useState({ knowledge: 0, communication: 0, confidence: 0 });
    const [questionCount, setQuestionCount] = useState(0);
    const [showFetchModal, setShowFetchModal] = useState(false);
    const [fetchedConfig, setFetchedConfig] = useState(null);
    const { presets: savedPresets, savePreset, deletePreset } = useSavedPresets('examai_interview_presets');
    const chatRef = useRef(null);

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    /* ─── Handle AI-fetched interview config ─── */
    function handleUseFetchedConfig(config) {
        setFetchedConfig(config);
        setSelectedType(config.interviewType || 'technical');
    }

    /* ─── Handle saved preset selection ─── */
    function handleSelectSavedPreset(preset) {
        setFetchedConfig(preset);
        setSelectedType(preset.interviewType || preset.id || 'technical');
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

    const startInterview = async () => {
        setStarted(true);
        setIsTyping(true);

        const interviewConfig = fetchedConfig ? {
            interviewType: fetchedConfig.interviewType || selectedType,
            role: fetchedConfig.role,
            company: fetchedConfig.company,
            topics: fetchedConfig.topics,
            difficulty: fetchedConfig.difficulty,
            questionCount: fetchedConfig.questionCount,
            tone: fetchedConfig.tone,
            history: [],
        } : {
            interviewType: selectedType,
            history: [],
        };

        const res = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'interview-question', config: interviewConfig }),
        });
        const data = await res.json();

        setTimeout(() => {
            setIsTyping(false);
            setMessages([{ role: 'ai', text: `Welcome! I'll be conducting your ${fetchedConfig?.title || selectedType} interview today. Let's begin.\n\n${data.question}`, data }]);
            setQuestionCount(1);
        }, 1500);
    };

    const sendAnswer = async () => {
        if (!input.trim()) return;
        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsTyping(true);

        const lastAI = messages.filter(m => m.role === 'ai').pop();
        const evalRes = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'evaluate-answer',
                config: { question: lastAI?.data?.question, answer: userMsg, expectedPoints: lastAI?.data?.expectedPoints },
            }),
        });
        const evaluation = await evalRes.json();

        setScores({
            knowledge: Math.round((scores.knowledge * questionCount + evaluation.knowledgeScore) / (questionCount + 1) * 10),
            communication: Math.round((scores.communication * questionCount + evaluation.communicationScore) / (questionCount + 1) * 10),
            confidence: Math.round((scores.confidence * questionCount + evaluation.confidenceScore) / (questionCount + 1) * 10),
        });

        const history = messages.filter(m => m.role === 'ai').map(m => m.data?.question).filter(Boolean);
        const nextRes = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'interview-question', config: { interviewType: selectedType, history, difficulty: 'medium' } }),
        });
        const nextQ = await nextRes.json();

        setTimeout(() => {
            setIsTyping(false);
            let feedback = `**Score: ${evaluation.score}/10**\n${evaluation.feedback}\n\n---\n\n`;
            feedback += `Next question:\n\n${nextQ.question}`;
            setMessages(prev => [...prev, { role: 'ai', text: feedback, data: nextQ }]);
            setQuestionCount(c => c + 1);
        }, 2000);
    };

    if (!started) {
        return (
            <div className={styles.interviewPage}>
                <h1><HiOutlineChatAlt2 style={{ display: 'inline' }} /> AI Interview <span className="gradient-text">Simulator</span></h1>
                <p>Practice interviews with AI. Get real-time feedback on your answers.</p>

                <div className={styles.typeGrid}>
                    {interviewTypes.map(t => (
                        <div
                            key={t.id}
                            className={`${styles.typeCard} ${selectedType === t.id && !fetchedConfig ? styles.selected : ''}`}
                            onClick={() => { setSelectedType(t.id); setFetchedConfig(null); }}
                        >
                            <div className={styles.typeEmoji}>{t.emoji}</div>
                            <h3>{t.title}</h3>
                            <p>{t.desc}</p>
                            <div className={styles.typeTopics}>
                                {t.topics.map((topic, i) => <span key={i} className={styles.typeTopic}>{topic}</span>)}
                            </div>
                        </div>
                    ))}
                    <FetchExamCard onClick={() => setShowFetchModal(true)} />
                    <AddPresetCard
                        onFetchClick={() => setShowFetchModal(true)}
                        onCustomClick={() => { setSelectedType('technical'); setFetchedConfig(null); }}
                    />
                </div>

                {/* Saved Presets */}
                <SavedPresetsSection count={savedPresets.length}>
                    <div className={styles.typeGrid}>
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

                <button className={styles.startBtn} disabled={!selectedType && !fetchedConfig} onClick={startInterview}>
                    <HiOutlinePlay /> Start Interview
                </button>

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

    return (
        <div className={styles.chatLayout}>
            <div className={styles.chatMain}>
                <div className={styles.chatHeader}>
                    <h3>🎤 {fetchedConfig?.title || (selectedType ? selectedType.charAt(0).toUpperCase() + selectedType.slice(1) : '')} Interview</h3>
                    <button className={styles.endBtn} onClick={() => { setStarted(false); setMessages([]); setQuestionCount(0); setFetchedConfig(null); }}>
                        End Interview
                    </button>
                </div>

                <div className={styles.chatMessages} ref={chatRef}>
                    {messages.map((msg, i) => (
                        <div key={i} className={`${styles.message} ${msg.role === 'ai' ? styles.aiMsg : styles.userMsg}`}>
                            {msg.text.split('\n').map((line, j) => (
                                <span key={j}>{line.startsWith('**') ? <strong>{line.replace(/\*\*/g, '')}</strong> : line}<br /></span>
                            ))}
                        </div>
                    ))}
                    {isTyping && (
                        <div className={styles.typing}>
                            <div className={styles.typingDot} />
                            <div className={styles.typingDot} />
                            <div className={styles.typingDot} />
                        </div>
                    )}
                </div>

                <div className={styles.chatInput}>
                    <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Type your answer..."
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAnswer(); } }}
                        disabled={isTyping}
                    />
                    <button className={styles.sendBtn} onClick={sendAnswer} disabled={isTyping || !input.trim()}>
                        Send
                    </button>
                </div>
            </div>

            <div className={styles.scoreSidebar}>
                <div className={styles.scoreCard}>
                    <h4>Live Scores</h4>
                    {[
                        { label: 'Knowledge', value: scores.knowledge, color: '#818cf8' },
                        { label: 'Communication', value: scores.communication, color: '#4ade80' },
                        { label: 'Confidence', value: scores.confidence, color: '#38bdf8' },
                    ].map((s, i) => (
                        <div key={i}>
                            <div className={styles.scoreRow}>
                                <span className={styles.scoreLabel}>{s.label}</span>
                                <span className={styles.scoreVal}>{s.value}%</span>
                            </div>
                            <div className={styles.scoreMeter}>
                                <div className={styles.scoreFill} style={{ width: `${s.value}%`, background: s.color }} />
                            </div>
                        </div>
                    ))}
                </div>
                <div className={styles.scoreCard}>
                    <div className={styles.questionCount}>
                        <span>{questionCount}</span>
                        Questions Asked
                    </div>
                </div>
            </div>
        </div>
    );
}
