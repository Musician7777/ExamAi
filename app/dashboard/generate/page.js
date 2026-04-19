'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Play, Loader2 } from 'lucide-react';
import { FetchExamModal, FetchExamCard, AddPresetCard, SavedPresetCard, SavedPresetsSection, useSavedPresets } from '../../components/PresetManager/PresetManager';
import ExamConfigModal from '../../components/ExamConfigModal/ExamConfigModal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const governmentPresets = [
    { id: 'upsc', emoji: '🏛️', name: 'UPSC CSE', desc: 'Civil Services Prelims' },
    { id: 'ssc', emoji: '📋', name: 'SSC CGL', desc: 'Combined Graduate Level' },
    { id: 'banking', emoji: '🏦', name: 'Banking PO', desc: 'IBPS PO / SBI PO' },
    { id: 'railways', emoji: '🚂', name: 'Railways', desc: 'RRB NTPC' },
    { id: 'state-psc', emoji: '🗳️', name: 'State PSC', desc: 'State Level Exams' },
];

const privatePresets = [
    { id: 'software', emoji: '💻', name: 'Software Eng.', desc: 'Tech Company Hiring' },
    { id: 'product', emoji: '📦', name: 'Product Company', desc: 'Google, Amazon, etc.' },
    { id: 'startup', emoji: '🚀', name: 'Startup Hiring', desc: 'Fast-Paced Tests' },
    { id: 'campus', emoji: '🎓', name: 'Campus Placement', desc: 'College Placements' },
    { id: 'mba', emoji: '📊', name: 'MBA Entrance', desc: 'CAT / XAT / GMAT' },
];

export default function GeneratePage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('preset');
    const [selectedPreset, setSelectedPreset] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showFetchModal, setShowFetchModal] = useState(false);
    const [fetchedConfig, setFetchedConfig] = useState(null);
    const { presets: savedPresets, savePreset, deletePreset } = useSavedPresets('examai_exam_presets');

    const [configModalOpen, setConfigModalOpen] = useState(false);
    const [configModalPreset, setConfigModalPreset] = useState({ name: '', emoji: '' });

    useEffect(() => {
        try {
            const stored = sessionStorage.getItem('examConfigModalResult');
            if (stored) {
                const { mode, config } = JSON.parse(stored);
                sessionStorage.removeItem('examConfigModalResult');
                if (mode === 'exam' && config) handleGenerateFromModal(config);
            }
        } catch (e) { console.warn('Failed to read examConfigModalResult from sessionStorage:', e.message); }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    function openConfigForPreset(preset) {
        setSelectedPreset(preset.id);
        setFetchedConfig(null);
        setConfigModalPreset({ name: preset.name, emoji: preset.emoji });
        setConfigModalOpen(true);
    }

    async function handleGenerateFromModal(modalConfig) {
        setConfigModalOpen(false);
        setLoading(true);
        try {
            const config = {
                examType: selectedPreset || 'Custom',
                totalQuestions: modalConfig.totalQuestions || modalConfig.questions || 20,
                difficulty: modalConfig.difficulty || 'Medium',
                questionTypes: modalConfig.questionType || 'MCQ',
                negativeMarking: modalConfig.negativeMarking ?? 0.25,
                timeLimit: modalConfig.timeLimit || modalConfig.time || 60,
            };
            const res = await fetch('/api/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'generate-exam', config }) });
            const exam = await res.json();
            if (exam.error) { alert(exam.error); setLoading(false); return; }
            if (!exam.sections || exam.sections.length === 0) { alert('Failed to generate exam. Please try again.'); setLoading(false); return; }
            sessionStorage.setItem('currentExam', JSON.stringify(exam));
            router.push('/dashboard/exam/live');
        } catch (error) { console.error('Error generating exam:', error); alert('Network error. Please try again.'); }
        setLoading(false);
    }

    const [custom, setCustom] = useState({
        totalQuestions: 50, sections: 'Quant, Reasoning, English, GK', negativeMarking: 0.25,
        timeLimit: 120, easy: 30, medium: 50, hard: 20, questionType: 'MCQ',
    });

    function handleUseFetchedConfig(config) {
        setFetchedConfig(config);
        setCustom({
            totalQuestions: config.totalQuestions || 50,
            sections: Array.isArray(config.sections) ? config.sections.join(', ') : (config.sections || 'General'),
            negativeMarking: config.negativeMarking || 0, timeLimit: config.timeLimit || 60,
            easy: 30, medium: 50, hard: 20, questionType: config.questionType || 'MCQ',
        });
        setActiveTab('custom');
        setSelectedPreset(null);
    }

    function handleSelectSavedPreset(preset) {
        setFetchedConfig(preset);
        setCustom({
            totalQuestions: preset.totalQuestions || 50,
            sections: Array.isArray(preset.sections) ? preset.sections.join(', ') : (preset.sections || 'General'),
            negativeMarking: preset.negativeMarking || 0, timeLimit: preset.timeLimit || 60,
            easy: 30, medium: 50, hard: 20, questionType: preset.questionType || 'MCQ',
        });
        setActiveTab('custom');
        setSelectedPreset(preset.id);
    }

    function handleSavePreset(config) {
        savePreset({
            name: config.examName || config.title || 'Custom Exam', emoji: config.emoji || '📄',
            desc: config.description || '', totalQuestions: config.totalQuestions, sections: config.sections,
            negativeMarking: config.negativeMarking, timeLimit: config.timeLimit,
            marksPerQuestion: config.marksPerQuestion, questionType: config.questionType, topics: config.topics,
        });
    }

    const handleGenerate = async (examType) => {
        setLoading(true);
        try {
            const config = activeTab === 'preset'
                ? { examType: examType || selectedPreset, totalQuestions: 20, difficulty: '30% Easy, 50% Medium, 20% Hard' }
                : {
                    examType: fetchedConfig?.examName || 'Custom', totalQuestions: custom.totalQuestions,
                    sections: custom.sections.split(',').map(s => s.trim()),
                    negativeMarking: custom.negativeMarking,
                    difficulty: `${custom.easy}% Easy, ${custom.medium}% Medium, ${custom.hard}% Hard`,
                    questionTypes: custom.questionType,
                };
            const res = await fetch('/api/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'generate-exam', config }) });
            const exam = await res.json();
            if (exam.error) { alert(exam.error); setLoading(false); return; }
            if (!exam.sections || exam.sections.length === 0) { alert('Failed to generate exam. Please try again.'); setLoading(false); return; }
            sessionStorage.setItem('currentExam', JSON.stringify(exam));
            router.push('/dashboard/exam/live');
        } catch (error) { console.error('Error generating exam:', error); alert('Network error. Please try again.'); }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
                <p className="text-lg font-semibold">AI is generating your exam...</p>
                <p className="text-sm text-muted-foreground">Crafting questions, analyzing difficulty, structuring sections...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Zap className="h-6 w-6 text-indigo-400" /> Generate <span className="gradient-text">Exam</span>
                </h1>
                <p className="text-muted-foreground mt-1">Choose a preset exam type or build your own custom structure.</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full sm:w-auto">
                    <TabsTrigger value="preset" className="flex-1 sm:flex-initial">Preset Exams</TabsTrigger>
                    <TabsTrigger value="custom" className="flex-1 sm:flex-initial">Custom Builder</TabsTrigger>
                </TabsList>

                <TabsContent value="preset" className="space-y-6 mt-6">
                    <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3">🏛️ Government Exams</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            {governmentPresets.map((p) => (
                                <Card
                                    key={p.id}
                                    className={cn("p-5 flex flex-col items-center gap-2 text-center cursor-pointer transition-all hover:shadow-md",
                                        selectedPreset === p.id ? "border-indigo-500/50 bg-indigo-500/5 ring-1 ring-indigo-500/30" : "hover:border-indigo-500/20"
                                    )}
                                    onClick={() => openConfigForPreset(p)}
                                >
                                    <span className="text-2xl">{p.emoji}</span>
                                    <h4 className="text-sm font-semibold">{p.name}</h4>
                                    <p className="text-xs text-muted-foreground">{p.desc}</p>
                                </Card>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3">💼 Private Hiring</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            {privatePresets.map((p) => (
                                <Card
                                    key={p.id}
                                    className={cn("p-5 flex flex-col items-center gap-2 text-center cursor-pointer transition-all hover:shadow-md",
                                        selectedPreset === p.id ? "border-indigo-500/50 bg-indigo-500/5 ring-1 ring-indigo-500/30" : "hover:border-indigo-500/20"
                                    )}
                                    onClick={() => openConfigForPreset(p)}
                                >
                                    <span className="text-2xl">{p.emoji}</span>
                                    <h4 className="text-sm font-semibold">{p.name}</h4>
                                    <p className="text-xs text-muted-foreground">{p.desc}</p>
                                </Card>
                            ))}
                            <FetchExamCard onClick={() => setShowFetchModal(true)} />
                            <AddPresetCard onFetchClick={() => setShowFetchModal(true)} onCustomClick={() => setActiveTab('custom')} />
                        </div>
                    </div>

                    <SavedPresetsSection count={savedPresets.length}>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            {savedPresets.map((p) => (
                                <SavedPresetCard key={p.id} preset={p} isSelected={selectedPreset === p.id} onSelect={() => handleSelectSavedPreset(p)} onDelete={deletePreset} />
                            ))}
                        </div>
                    </SavedPresetsSection>

                    <Button variant="brand" size="lg" disabled={!selectedPreset} onClick={() => handleGenerate(selectedPreset)} className="gap-2">
                        <Play className="h-4 w-4" /> Generate Exam
                    </Button>
                </TabsContent>

                <TabsContent value="custom" className="mt-6">
                    <Card className="p-6 space-y-6">
                        {fetchedConfig && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                <span className="text-xl">{fetchedConfig.emoji || '📄'}</span>
                                <strong>{fetchedConfig.examName || fetchedConfig.name || 'Fetched Config'}</strong>
                                <span className="text-muted-foreground text-sm">— Modify as needed</span>
                            </div>
                        )}

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Total Questions</Label>
                                <Input type="number" value={custom.totalQuestions} onChange={(e) => setCustom({ ...custom, totalQuestions: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Time Limit (minutes)</Label>
                                <Input type="number" value={custom.timeLimit} onChange={(e) => setCustom({ ...custom, timeLimit: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label>Sections (comma-separated)</Label>
                                <Input value={custom.sections} onChange={(e) => setCustom({ ...custom, sections: e.target.value })} placeholder="Quant, Reasoning, English, GK" />
                            </div>
                            <div className="space-y-2">
                                <Label>Negative Marking</Label>
                                <Input type="number" step="0.25" value={custom.negativeMarking} onChange={(e) => setCustom({ ...custom, negativeMarking: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Question Type</Label>
                                <Select value={custom.questionType} onValueChange={(v) => setCustom({ ...custom, questionType: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MCQ">MCQ (Multiple Choice)</SelectItem>
                                        <SelectItem value="Descriptive">Descriptive</SelectItem>
                                        <SelectItem value="Mixed">Mixed (MCQ + Descriptive)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="sm:col-span-2 space-y-3">
                                <Label>Difficulty Distribution</Label>
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="text-emerald-400">🟢 Easy: {custom.easy}%</span>
                                    <span className="text-amber-400">🟡 Medium: {custom.medium}%</span>
                                    <span className="text-red-400">🔴 Hard: {custom.hard}%</span>
                                </div>
                                <div className="flex h-2 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 transition-all" style={{ width: `${custom.easy}%` }} />
                                    <div className="bg-amber-500 transition-all" style={{ width: `${custom.medium}%` }} />
                                    <div className="bg-red-500 transition-all" style={{ width: `${custom.hard}%` }} />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { key: 'easy', label: 'Easy', others: ['medium', 'hard'] },
                                        { key: 'medium', label: 'Medium', others: ['easy', 'hard'] },
                                        { key: 'hard', label: 'Hard', others: ['easy', 'medium'] },
                                    ].map(({ key, label, others }) => (
                                        <div key={key}>
                                            <label className="text-xs text-muted-foreground">{label}</label>
                                            <input type="range" min="0" max="100" value={custom[key]} className="w-full accent-indigo-500"
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value);
                                                    const rem = 100 - val;
                                                    const othersTotal = custom[others[0]] + custom[others[1]] || 1;
                                                    const ratio = custom[others[0]] / othersTotal;
                                                    const v1 = Math.round(rem * ratio);
                                                    setCustom({ ...custom, [key]: val, [others[0]]: v1, [others[1]]: rem - v1 });
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <Button variant="brand" size="lg" onClick={() => handleGenerate(fetchedConfig?.examName || 'Custom')} className="gap-2">
                            <Play className="h-4 w-4" /> Generate Custom Exam
                        </Button>
                    </Card>
                </TabsContent>
            </Tabs>

            <FetchExamModal isOpen={showFetchModal} onClose={() => setShowFetchModal(false)} onUseConfig={handleUseFetchedConfig} onSavePreset={handleSavePreset} mode="exam" />
            <ExamConfigModal isOpen={configModalOpen} onClose={() => setConfigModalOpen(false)} onGenerate={handleGenerateFromModal} mode="exam" presetName={configModalPreset.name} presetEmoji={configModalPreset.emoji} />
        </div>
    );
}
