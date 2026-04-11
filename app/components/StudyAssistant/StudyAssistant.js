'use client';
import { useState, useRef, useEffect } from 'react';
import styles from './StudyAssistant.module.css';

export default function StudyAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', text: "Hi! 👋 I'm your AI study assistant. Ask me anything about your exam prep, concepts, or problems!" },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function sendMessage() {
        if (!input.trim() || loading) return;
        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);

        try {
            const history = messages.slice(-10).map(m => ({ role: m.role, text: m.text }));
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg, history, context: {} }),
            });
            const data = await res.json();
            setMessages(prev => [...prev, {
                role: 'assistant',
                text: data.response || data.error || 'Sorry, I had trouble with that. Try again!',
                suggestedTopics: data.suggestedTopics || [],
            }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', text: 'Connection error. Please try again.' }]);
        }
        setLoading(false);
    }

    return (
        <>
            {/* Floating Button */}
            <button
                className={`${styles.fabButton} ${isOpen ? styles.fabOpen : ''}`}
                onClick={() => setIsOpen(v => !v)}
                aria-label="Study Assistant"
            >
                {isOpen ? '✕' : '🤖'}
            </button>

            {/* Chat Panel */}
            {isOpen && (
                <div className={styles.chatPanel}>
                    <div className={styles.chatHeader}>
                        <div className={styles.headerLeft}>
                            <span className={styles.headerDot} />
                            <span>AI Study Assistant</span>
                        </div>
                        <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>✕</button>
                    </div>

                    <div className={styles.chatMessages}>
                        {messages.map((msg, i) => (
                            <div key={i} className={`${styles.message} ${msg.role === 'user' ? styles.userMsg : styles.assistantMsg}`}>
                                <div className={styles.msgBubble}>
                                    {msg.text.split('\n').map((line, j) => (
                                        <span key={j}>{line}<br /></span>
                                    ))}
                                </div>
                                {msg.suggestedTopics?.length > 0 && (
                                    <div className={styles.suggestions}>
                                        {msg.suggestedTopics.map((topic, j) => (
                                            <button key={j} className={styles.suggestionChip} onClick={() => { setInput(topic); }}>
                                                {topic}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {loading && (
                            <div className={`${styles.message} ${styles.assistantMsg}`}>
                                <div className={styles.typingIndicator}>
                                    <span /><span /><span />
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <div className={styles.chatInput}>
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                            placeholder="Ask me anything..."
                            disabled={loading}
                        />
                        <button onClick={sendMessage} disabled={loading || !input.trim()}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
