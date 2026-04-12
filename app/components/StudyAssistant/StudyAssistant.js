'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, X, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

import { cn } from '@/lib/utils';

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
                className={cn(
                    "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-300 hover:scale-110",
                    isOpen
                        ? "bg-muted text-foreground rotate-0"
                        : "bg-gradient-to-br from-indigo-500 to-indigo-600"
                )}
                onClick={() => setIsOpen(v => !v)}
                aria-label="Study Assistant"
            >
                {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-6 w-6" />}
            </button>

            {/* Chat Panel */}
            {isOpen && (
                <Card className="fixed bottom-24 right-6 z-50 w-[380px] h-[520px] flex flex-col shadow-2xl border animate-in slide-in-from-bottom-5 fade-in duration-300">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-sm font-semibold">AI Study Assistant</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => setIsOpen(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-4 overflow-y-auto scroll-smooth">
                        <div className="space-y-4">
                            {messages.map((msg, i) => (
                                <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                                    <div className="space-y-1 max-w-[85%]">
                                        <div className={cn(
                                            "rounded-xl px-3 py-2 text-sm leading-relaxed",
                                            msg.role === 'user'
                                                ? "bg-indigo-500 text-white rounded-br-sm"
                                                : "bg-secondary text-foreground rounded-bl-sm"
                                        )}>
                                            {msg.text.split('\n').map((line, j) => (
                                                <span key={j}>{line}<br /></span>
                                            ))}
                                        </div>
                                        {msg.suggestedTopics?.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {msg.suggestedTopics.map((topic, j) => (
                                                    <button
                                                        key={j}
                                                        className="text-xs px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors cursor-pointer"
                                                        onClick={() => setInput(topic)}
                                                    >
                                                        {topic}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-secondary rounded-xl px-4 py-3 rounded-bl-sm">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                                            <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                                            <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                    </div>

                    {/* Input */}
                    <div className="flex items-center gap-2 p-3 border-t">
                        <Input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                            placeholder="Ask me anything..."
                            disabled={loading}
                            className="flex-1"
                        />
                        <Button size="icon" variant="brand" onClick={sendMessage} disabled={loading || !input.trim()} className="shrink-0">
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </Card>
            )}
        </>
    );
}
