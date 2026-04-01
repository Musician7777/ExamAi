'use client';
import { useState, useEffect, useRef } from 'react';
import { HiOutlineSearch, HiOutlinePlus, HiOutlineTrash, HiOutlineLightningBolt, HiOutlinePencil, HiOutlineCheck, HiOutlineX, HiOutlineSave } from 'react-icons/hi';
import styles from './PresetManager.module.css';

/* ═══════════════════════════════════════════
   FETCH EXAM MODAL
   ═══════════════════════════════════════════ */
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

    if (!isOpen) return null;

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
        if (result) {
            onUseConfig(result);
            onClose();
        }
    }

    function handleSave() {
        if (result && onSavePreset) {
            onSavePreset(result);
            setSaved(true);
        }
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter') handleFetch();
    }

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.modalClose} onClick={onClose}>
                    <HiOutlineX />
                </button>
                <h2>🔍 Fetch by Name</h2>
                <p>Enter the name and AI will auto-detect all configurations.</p>

                <input
                    ref={inputRef}
                    className={styles.fetchInput}
                    type="text"
                    placeholder={placeholders[mode]}
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    onKeyDown={handleKeyDown}
                />

                <button
                    className={styles.fetchBtn}
                    disabled={!examName.trim() || loading}
                    onClick={handleFetch}
                >
                    {loading ? (
                        <>
                            <div className={styles.fetchSpinner} />
                            AI is fetching...
                        </>
                    ) : (
                        <>
                            <HiOutlineLightningBolt />
                            Fetch Configuration
                        </>
                    )}
                </button>

                {result && (
                    <div className={styles.fetchResult}>
                        <div className={styles.fetchResultTitle}>
                            <span className={styles.emoji}>{result.emoji || '📄'}</span>
                            <span>{result.examName || result.title || examName}</span>
                        </div>

                        {mode === 'exam' && (
                            <div className={styles.fetchResultDetail}>
                                <span>Questions: <strong>{result.totalQuestions}</strong></span>
                                <span>Time: <strong>{result.timeLimit} min</strong></span>
                                <span>Type: <strong>{result.questionType || 'MCQ'}</strong></span>
                                <span>Negative: <strong>{result.negativeMarking || 0}</strong></span>
                                <span>Sections: <strong>{result.sections?.length || '—'}</strong></span>
                                <span>Marks/Q: <strong>{result.marksPerQuestion || '—'}</strong></span>
                            </div>
                        )}

                        {mode === 'interview' && (
                            <div className={styles.fetchResultDetail}>
                                <span>Type: <strong>{result.interviewType}</strong></span>
                                <span>Difficulty: <strong>{result.difficulty}</strong></span>
                                <span>Questions: <strong>{result.questionCount}</strong></span>
                                <span>Tone: <strong>{result.tone}</strong></span>
                                <span>Role: <strong>{result.role}</strong></span>
                                <span>Topics: <strong>{result.topics?.length || 0}</strong></span>
                            </div>
                        )}

                        {mode === 'coding' && (
                            <div className={styles.fetchResultDetail}>
                                <span>Problems: <strong>{result.problems?.length || 0}</strong></span>
                                <span>Difficulty: <strong>Mixed</strong></span>
                            </div>
                        )}

                        <div className={styles.fetchResultActions}>
                            <button className={styles.useBtn} onClick={handleUse}>
                                <HiOutlineLightningBolt /> Use & Generate
                            </button>
                            {!saved ? (
                                <button className={styles.saveBtn} onClick={handleSave}>
                                    <HiOutlineSave /> Save
                                </button>
                            ) : (
                                <span className={styles.savedBadge}>
                                    <HiOutlineCheck /> Saved
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════
   FETCH EXAM CARD (goes in preset grid)
   ═══════════════════════════════════════════ */
export function FetchExamCard({ onClick }) {
    return (
        <div className={styles.fetchCard} onClick={onClick}>
            <div className={styles.fetchCardIcon}>🔍</div>
            <h4>Fetch by Name</h4>
            <p>AI auto-detects config</p>
        </div>
    );
}

/* ═══════════════════════════════════════════
   ADD PRESET CARD (the + card with popover)
   ═══════════════════════════════════════════ */
export function AddPresetCard({ onFetchClick, onCustomClick }) {
    const [showPopover, setShowPopover] = useState(false);

    return (
        <div className={styles.addCard} onClick={() => setShowPopover(true)}>
            <div className={styles.addCardIcon}>
                <HiOutlinePlus />
            </div>
            <h4>Add Preset</h4>

            {showPopover && (
                <>
                    <div className={styles.popoverOverlay} onClick={(e) => { e.stopPropagation(); setShowPopover(false); }} />
                    <div className={styles.popover} onClick={(e) => e.stopPropagation()}>
                        <button
                            className={styles.popoverOption}
                            onClick={() => { setShowPopover(false); onFetchClick(); }}
                        >
                            <HiOutlineSearch className={styles.popoverIcon} />
                            Fetch by Name
                        </button>
                        <button
                            className={styles.popoverOption}
                            onClick={() => { setShowPopover(false); onCustomClick(); }}
                        >
                            <HiOutlinePencil className={styles.popoverIcon} />
                            Custom
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════
   SAVED PRESET CARD
   ═══════════════════════════════════════════ */
export function SavedPresetCard({ preset, isSelected, onSelect, onDelete }) {
    return (
        <div
            className={`${styles.savedPresetCard} ${isSelected ? styles.selected : ''}`}
            onClick={() => onSelect(preset)}
        >
            <span className={styles.savedBadgeSmall}>Saved</span>
            <button
                className={styles.deleteBtn}
                onClick={(e) => { e.stopPropagation(); onDelete(preset.id); }}
                title="Delete preset"
            >
                <HiOutlineTrash />
            </button>
            <div className={styles.savedPresetEmoji}>{preset.emoji || '📋'}</div>
            <h4>{preset.name || preset.examName || preset.title || 'Custom'}</h4>
            <p>{preset.desc || preset.description || ''}</p>
        </div>
    );
}

/* ═══════════════════════════════════════════
   SAVED PRESETS SECTION (label + grid)
   ═══════════════════════════════════════════ */
export function SavedPresetsSection({ children, count }) {
    if (count === 0) return null;
    return (
        <>
            <div className={styles.savedPresetsLabel}>
                💾 Your Saved Presets ({count})
            </div>
            {children}
        </>
    );
}

/* ═══════════════════════════════════════════
   HOOKS: localStorage preset management
   ═══════════════════════════════════════════ */
export function useSavedPresets(storageKey) {
    const [presets, setPresets] = useState([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) setPresets(JSON.parse(stored));
        } catch { /* ignore */ }
    }, [storageKey]);

    function savePreset(data) {
        const newPreset = {
            ...data,
            id: `custom_${Date.now()}`,
            savedAt: new Date().toISOString(),
        };
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
