'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FetchExamModal, FetchExamCard, AddPresetCard, SavedPresetCard, SavedPresetsSection, useSavedPresets } from '../../components/PresetManager/PresetManager';
import ExamConfigModal from '../../components/ExamConfigModal/ExamConfigModal';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

const diffBadgeVariant = { easy: 'success', medium: 'warning', hard: 'destructive' };

export default function CodingPage() {
    const router = useRouter();
    const [showFetchModal, setShowFetchModal] = useState(false);
    const [fetchedProblems, setFetchedProblems] = useState(null);
    const [activePreset, setActivePreset] = useState(null);
    const { presets: savedPresets, savePreset, deletePreset } = useSavedPresets('examai_coding_presets');
    const [configModalOpen, setConfigModalOpen] = useState(false);
    const [configModalPreset, setConfigModalPreset] = useState({ name: '', emoji: '' });

    useEffect(() => {
        try {
            const stored = sessionStorage.getItem('examConfigModalResult');
            if (stored) {
                const { mode, config } = JSON.parse(stored);
                sessionStorage.removeItem('examConfigModalResult');
                if (mode === 'coding' && config) {
                    sessionStorage.setItem('codingConfig', JSON.stringify(config));
                    router.push('/dashboard/coding/1');
                }
            }
        } catch (e) { /* ignore */ }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    function openConfigForPreset(preset) {
        setActivePreset(preset.id); setFetchedProblems(null);
        setConfigModalPreset({ name: preset.name, emoji: preset.emoji });
        setConfigModalOpen(true);
    }

    function handleConfigGenerate(config) {
        setConfigModalOpen(false);
        sessionStorage.setItem('codingConfig', JSON.stringify(config));
        router.push('/dashboard/coding/1');
    }

    const displayProblems = fetchedProblems?.problems || defaultProblems;
    const displayTitle = fetchedProblems?.title || null;

    function handleUseFetchedConfig(config) { setFetchedProblems(config); setActivePreset(null); }
    function handleSelectSavedPreset(preset) { if (preset.problems) setFetchedProblems(preset); setActivePreset(preset.id); }
    function handleSavePreset(config) { savePreset({ name: config.title || 'Custom Practice', emoji: config.emoji || '💻', desc: config.description || '', problems: config.problems }); }
    function resetToDefault() { setFetchedProblems(null); setActivePreset(null); }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">💻 Coding <span className="gradient-text">Challenges</span></h1>
                <p className="text-muted-foreground mt-1">Practice DSA, debugging, and system design problems with an integrated code editor.</p>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {codingPresets.map((p) => (
                    <Card
                        key={p.id}
                        className={cn("p-5 flex flex-col items-center gap-2 text-center cursor-pointer transition-all hover:shadow-md",
                            activePreset === p.id ? "border-indigo-500/50 bg-indigo-500/5 ring-1 ring-indigo-500/30" : "hover:border-indigo-500/20"
                        )}
                        onClick={() => openConfigForPreset(p)}
                    >
                        <span className="text-2xl">{p.emoji}</span>
                        <h4 className="text-sm font-semibold">{p.name}</h4>
                        <p className="text-xs text-muted-foreground">{p.desc}</p>
                    </Card>
                ))}
                <FetchExamCard onClick={() => setShowFetchModal(true)} />
                <AddPresetCard onFetchClick={() => setShowFetchModal(true)} onCustomClick={() => {}} />
            </div>

            <SavedPresetsSection count={savedPresets.length}>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {savedPresets.map((p) => (
                        <SavedPresetCard key={p.id} preset={p} isSelected={activePreset === p.id} onSelect={() => handleSelectSavedPreset(p)} onDelete={deletePreset} />
                    ))}
                </div>
            </SavedPresetsSection>

            {fetchedProblems && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                    <span className="text-xl">{fetchedProblems.emoji || '💻'}</span>
                    <strong>{fetchedProblems.title || 'AI-Generated Problems'}</strong>
                    <span className="text-sm text-muted-foreground">— {fetchedProblems.problems?.length || 0} problems</span>
                    <Button variant="ghost" size="sm" onClick={resetToDefault}>Reset to defaults</Button>
                </div>
            )}

            {displayTitle && <h3 className="text-lg font-semibold">{displayTitle}</h3>}

            <div className="space-y-2">
                {displayProblems.map((p, idx) => (
                    <Link key={p.id || idx} href={`/dashboard/coding/${p.id || idx + 1}`}>
                        <Card className="p-4 flex items-center justify-between hover:shadow-md hover:border-indigo-500/20 transition-all cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-sm font-medium text-muted-foreground">
                                    {p.id || idx + 1}
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold">{p.title}</h4>
                                    <div className="flex gap-1.5 mt-1">
                                        {(p.tags || []).map((t, i) => (
                                            <Badge key={i} variant="secondary" className="text-[10px]">{t}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <Badge variant={diffBadgeVariant[p.difficulty] || 'secondary'}>{p.difficulty}</Badge>
                        </Card>
                    </Link>
                ))}
            </div>

            <FetchExamModal isOpen={showFetchModal} onClose={() => setShowFetchModal(false)} onUseConfig={handleUseFetchedConfig} onSavePreset={handleSavePreset} mode="coding" />
            <ExamConfigModal isOpen={configModalOpen} onClose={() => setConfigModalOpen(false)} onGenerate={handleConfigGenerate} mode="coding" presetName={configModalPreset.name} presetEmoji={configModalPreset.emoji} />
        </div>
    );
}
