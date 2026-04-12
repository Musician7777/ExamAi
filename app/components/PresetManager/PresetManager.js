'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Trash2, Zap, Pencil, Check, X, Save, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/* ═══ FETCH EXAM MODAL ═══ */
export function FetchExamModal({ isOpen, onClose, onUseConfig, onSavePreset, mode = 'exam' }) {
    const [examName, setExamName] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [saved, setSaved] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setExamName('');
            setResult(null);
            setSaved(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const apiType = mode === 'interview' ? 'fetch-interview-config'
        : mode === 'coding' ? 'fetch-coding-config'
        : 'fetch-exam-config';

    const placeholders = {
        exam: 'e.g. JEE Mains, GATE CS, NEET, GRE...',
        interview: 'e.g. Google, Frontend Developer, UPSC...',
        coding: 'e.g. Google, Dynamic Programming, LeetCode Hard...',
    };

    async function handleFetch() {
        if (!examName.trim() || loading) return;
        setLoading(true);
        setResult(null);
        setSaved(false);
        try {
            const res = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: apiType, config: { examName: examName.trim() } }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setResult(data);
        } catch (err) {
            console.error('Fetch config error:', err);
            alert('Failed to fetch configuration. Please try again.');
        }
        setLoading(false);
    }

    function handleUse() {
        if (result) { onUseConfig(result); onClose(); }
    }

    function handleSave() {
        if (result && onSavePreset) { onSavePreset(result); setSaved(true); }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">🔍 Fetch by Name</DialogTitle>
                    <DialogDescription>Enter the name and AI will auto-detect all configurations.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <Input
                        ref={inputRef}
                        placeholder={placeholders[mode]}
                        value={examName}
                        onChange={(e) => setExamName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleFetch(); }}
                    />

                    <Button
                        className="w-full gap-2"
                        variant="brand"
                        disabled={!examName.trim() || loading}
                        onClick={handleFetch}
                    >
                        {loading ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> AI is fetching...</>
                        ) : (
                            <><Zap className="h-4 w-4" /> Fetch Configuration</>
                        )}
                    </Button>

                    {result && (
                        <Card className="p-4 space-y-3">
                            <div className="flex items-center gap-2 font-semibold">
                                <span className="text-xl">{result.emoji || '📄'}</span>
                                <span>{result.examName || result.title || examName}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                                {mode === 'exam' && (
                                    <>
                                        <span>Questions: <strong>{result.totalQuestions}</strong></span>
                                        <span>Time: <strong>{result.timeLimit} min</strong></span>
                                        <span>Type: <strong>{result.questionType || 'MCQ'}</strong></span>
                                        <span>Negative: <strong>{result.negativeMarking || 0}</strong></span>
                                        <span>Sections: <strong>{result.sections?.length || '—'}</strong></span>
                                        <span>Marks/Q: <strong>{result.marksPerQuestion || '—'}</strong></span>
                                    </>
                                )}
                                {mode === 'interview' && (
                                    <>
                                        <span>Type: <strong>{result.interviewType}</strong></span>
                                        <span>Difficulty: <strong>{result.difficulty}</strong></span>
                                        <span>Questions: <strong>{result.questionCount}</strong></span>
                                        <span>Tone: <strong>{result.tone}</strong></span>
                                        <span>Role: <strong>{result.role}</strong></span>
                                        <span>Topics: <strong>{result.topics?.length || 0}</strong></span>
                                    </>
                                )}
                                {mode === 'coding' && (
                                    <>
                                        <span>Problems: <strong>{result.problems?.length || 0}</strong></span>
                                        <span>Difficulty: <strong>Mixed</strong></span>
                                    </>
                                )}
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button variant="brand" className="flex-1 gap-2" onClick={handleUse}>
                                    <Zap className="h-4 w-4" /> Use & Generate
                                </Button>
                                {!saved ? (
                                    <Button variant="outline" onClick={handleSave} className="gap-2">
                                        <Save className="h-4 w-4" /> Save
                                    </Button>
                                ) : (
                                    <Badge variant="success" className="flex items-center gap-1 px-3">
                                        <Check className="h-3 w-3" /> Saved
                                    </Badge>
                                )}
                            </div>
                        </Card>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

/* ═══ FETCH EXAM CARD ═══ */
export function FetchExamCard({ onClick }) {
    return (
        <Card
            className="p-5 flex flex-col items-center gap-2 text-center cursor-pointer border-dashed border-2 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all"
            onClick={onClick}
        >
            <span className="text-2xl">🔍</span>
            <h4 className="text-sm font-semibold">Fetch by Name</h4>
            <p className="text-xs text-muted-foreground">AI auto-detects config</p>
        </Card>
    );
}

/* ═══ ADD PRESET CARD ═══ */
export function AddPresetCard({ onFetchClick, onCustomClick }) {
    const [showPopover, setShowPopover] = useState(false);

    return (
        <div className="relative">
            <Card
                className="p-5 flex flex-col items-center gap-2 text-center cursor-pointer border-dashed border-2 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all"
                onClick={() => setShowPopover(true)}
            >
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <Plus className="h-5 w-5 text-muted-foreground" />
                </div>
                <h4 className="text-sm font-semibold">Add Preset</h4>
            </Card>

            {showPopover && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowPopover(false)} />
                    <div className="absolute top-full left-0 mt-2 z-50 w-44 rounded-lg border bg-popover p-1 shadow-lg">
                        <button
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors cursor-pointer"
                            onClick={() => { setShowPopover(false); onFetchClick(); }}
                        >
                            <Search className="h-4 w-4" /> Fetch by Name
                        </button>
                        <button
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors cursor-pointer"
                            onClick={() => { setShowPopover(false); onCustomClick(); }}
                        >
                            <Pencil className="h-4 w-4" /> Custom
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

/* ═══ SAVED PRESET CARD ═══ */
export function SavedPresetCard({ preset, isSelected, onSelect, onDelete }) {
    return (
        <Card
            className={cn(
                "relative p-5 flex flex-col items-center gap-2 text-center cursor-pointer transition-all",
                isSelected ? "border-indigo-500/50 bg-indigo-500/5 ring-1 ring-indigo-500/30" : "hover:bg-accent/50"
            )}
            onClick={() => onSelect(preset)}
        >
            <Badge variant="secondary" className="absolute top-2 left-2 text-[10px]">Saved</Badge>
            <button
                className="absolute top-2 right-2 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                onClick={(e) => { e.stopPropagation(); onDelete(preset.id); }}
                title="Delete preset"
            >
                <Trash2 className="h-3.5 w-3.5" />
            </button>
            <span className="text-2xl mt-2">{preset.emoji || '📋'}</span>
            <h4 className="text-sm font-semibold">{preset.name || preset.examName || preset.title || 'Custom'}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">{preset.desc || preset.description || ''}</p>
        </Card>
    );
}

/* ═══ SAVED PRESETS SECTION ═══ */
export function SavedPresetsSection({ children, count }) {
    if (count === 0) return null;
    return (
        <>
            <div className="text-sm font-medium text-muted-foreground mt-6 mb-3">
                💾 Your Saved Presets ({count})
            </div>
            {children}
        </>
    );
}

/* ═══ HOOKS ═══ */
export function useSavedPresets(storageKey) {
    const [presets, setPresets] = useState([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) setPresets(JSON.parse(stored));
        } catch { /* ignore */ }
    }, [storageKey]);

    function savePreset(data) {
        const newPreset = { ...data, id: `custom_${Date.now()}`, savedAt: new Date().toISOString() };
        const updated = [...presets, newPreset];
        setPresets(updated);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return newPreset;
    }

    function deletePreset(id) {
        const updated = presets.filter(p => p.id !== id);
        setPresets(updated);
        localStorage.setItem(storageKey, JSON.stringify(updated));
    }

    return { presets, savePreset, deletePreset };
}
