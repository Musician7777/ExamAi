'use client';
import { useState } from 'react';
import Link from 'next/link';
import { HiOutlinePlay } from 'react-icons/hi';
import { FetchExamModal, FetchExamCard, AddPresetCard, SavedPresetCard, SavedPresetsSection, useSavedPresets } from '../../components/PresetManager/PresetManager';
import styles from './coding.module.css';

const defaultProblems = [
    { id: 1, title: 'Two Sum', tags: ['Array', 'Hash Map'], difficulty: 'easy' },
    { id: 2, title: 'Valid Parentheses', tags: ['Stack', 'String'], difficulty: 'easy' },
    { id: 3, title: 'Merge Two Sorted Lists', tags: ['Linked List'], difficulty: 'easy' },
    { id: 4, title: 'Maximum Subarray', tags: ['Array', 'DP'], difficulty: 'medium' },
    { id: 5, title: 'Binary Tree Level Order Traversal', tags: ['Tree', 'BFS'], difficulty: 'medium' },
    { id: 6, title: 'Longest Palindromic Substring', tags: ['String', 'DP'], difficulty: 'medium' },
    { id: 7, title: 'LRU Cache', tags: ['Hash Map', 'DLL'], difficulty: 'hard' },
    { id: 8, title: 'Median of Two Sorted Arrays', tags: ['Binary Search'], difficulty: 'hard' },
    { id: 9, title: 'Trapping Rain Water', tags: ['Array', 'Two Pointer'], difficulty: 'hard' },
    { id: 10, title: 'Reverse Linked List', tags: ['Linked List'], difficulty: 'easy' },
];

const codingPresets = [
    { id: 'dsa', emoji: '🧮', name: 'DSA Practice', desc: 'Arrays, Trees, Graphs, DP' },
    { id: 'system-design', emoji: '🏗️', name: 'System Design', desc: 'LLD & HLD Problems' },
    { id: 'debugging', emoji: '🐛', name: 'Debug Challenge', desc: 'Find & Fix Bugs' },
    { id: 'competitive', emoji: '🏆', name: 'Competitive', desc: 'Contest-style Problems' },
];

export default function CodingPage() {
    const [showFetchModal, setShowFetchModal] = useState(false);
    const [fetchedProblems, setFetchedProblems] = useState(null);
    const [activePreset, setActivePreset] = useState(null);
    const { presets: savedPresets, savePreset, deletePreset } = useSavedPresets('examai_coding_presets');

    const displayProblems = fetchedProblems?.problems || defaultProblems;
    const displayTitle = fetchedProblems?.title || null;

    /* ─── Handle AI-fetched coding config ─── */
    function handleUseFetchedConfig(config) {
        setFetchedProblems(config);
        setActivePreset(null);
    }

    /* ─── Handle saved preset selection ─── */
    function handleSelectSavedPreset(preset) {
        if (preset.problems) {
            setFetchedProblems(preset);
        }
        setActivePreset(preset.id);
    }

    /* ─── Save preset to localStorage ─── */
    function handleSavePreset(config) {
        savePreset({
            name: config.title || 'Custom Practice',
            emoji: config.emoji || '💻',
            desc: config.description || '',
            problems: config.problems,
        });
    }

    /* ─── Reset to defaults ─── */
    function resetToDefault() {
        setFetchedProblems(null);
        setActivePreset(null);
    }

    return (
        <div className={styles.codingPage}>
            <h1>💻 Coding <span className="gradient-text">Challenges</span></h1>
            <p>Practice DSA, debugging, and system design problems with an integrated code editor.</p>

            {/* Preset Grid */}
            <div className={styles.presetSection}>
                <div className={styles.presetGrid}>
                    {codingPresets.map((p) => (
                        <div
                            key={p.id}
                            className={`${styles.presetCard} ${activePreset === p.id ? styles.selected : ''}`}
                            onClick={() => { setActivePreset(p.id); setFetchedProblems(null); }}
                        >
                            <div className={styles.presetEmoji}>{p.emoji}</div>
                            <h4>{p.name}</h4>
                            <p>{p.desc}</p>
                        </div>
                    ))}
                    <FetchExamCard onClick={() => setShowFetchModal(true)} />
                    <AddPresetCard
                        onFetchClick={() => setShowFetchModal(true)}
                        onCustomClick={() => {}}
                    />
                </div>

                {/* Saved Presets */}
                <SavedPresetsSection count={savedPresets.length}>
                    <div className={styles.presetGrid}>
                        {savedPresets.map((p) => (
                            <SavedPresetCard
                                key={p.id}
                                preset={p}
                                isSelected={activePreset === p.id}
                                onSelect={() => handleSelectSavedPreset(p)}
                                onDelete={deletePreset}
                            />
                        ))}
                    </div>
                </SavedPresetsSection>
            </div>

            {/* Fetched config banner */}
            {fetchedProblems && (
                <div className={styles.fetchedBanner}>
                    <span>{fetchedProblems.emoji || '💻'}</span>
                    <strong>{fetchedProblems.title || 'AI-Generated Problems'}</strong>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                        — {fetchedProblems.problems?.length || 0} problems
                    </span>
                    <button className={styles.resetBtn} onClick={resetToDefault}>
                        Reset to defaults
                    </button>
                </div>
            )}

            {/* Problem List */}
            {displayTitle && (
                <div className={styles.problemListTitle}>{displayTitle}</div>
            )}
            <div className={styles.problemList}>
                {displayProblems.map((p, idx) => (
                    <Link key={p.id || idx} href={`/dashboard/coding/${p.id || idx + 1}`} className={styles.problemCard}>
                        <div className={styles.problemLeft}>
                            <div className={styles.problemNum}>{p.id || idx + 1}</div>
                            <div className={styles.problemInfo}>
                                <h4>{p.title}</h4>
                                <div className={styles.problemTags}>
                                    {(p.tags || []).map((t, i) => <span key={i} className={styles.problemTag}>{t}</span>)}
                                </div>
                            </div>
                        </div>
                        <div className={styles.problemRight}>
                            <span className={`${styles.diffBadge} ${styles[p.difficulty]}`}>{p.difficulty}</span>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Fetch Modal */}
            <FetchExamModal
                isOpen={showFetchModal}
                onClose={() => setShowFetchModal(false)}
                onUseConfig={handleUseFetchedConfig}
                onSavePreset={handleSavePreset}
                mode="coding"
            />
        </div>
    );
}
