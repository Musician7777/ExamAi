'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HiOutlineLightningBolt, HiOutlinePlay } from 'react-icons/hi';
import { FetchExamModal, FetchExamCard, AddPresetCard, SavedPresetCard, SavedPresetsSection, useSavedPresets } from '../../components/PresetManager/PresetManager';
import styles from './generate.module.css';

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

    const [custom, setCustom] = useState({
        totalQuestions: 50,
        sections: 'Quant, Reasoning, English, GK',
        negativeMarking: 0.25,
        timeLimit: 120,
        easy: 30,
        medium: 50,
        hard: 20,
        questionType: 'MCQ',
    });

    /* ─── Handle AI-fetched config ─── */
    function handleUseFetchedConfig(config) {
        setFetchedConfig(config);
        setCustom({
            totalQuestions: config.totalQuestions || 50,
            sections: Array.isArray(config.sections) ? config.sections.join(', ') : (config.sections || 'General'),
            negativeMarking: config.negativeMarking || 0,
            timeLimit: config.timeLimit || 60,
            easy: 30,
            medium: 50,
            hard: 20,
            questionType: config.questionType || 'MCQ',
        });
        setActiveTab('custom');
        setSelectedPreset(null);
    }

    /* ─── Handle saved preset selection ─── */
    function handleSelectSavedPreset(preset) {
        setFetchedConfig(preset);
        setCustom({
            totalQuestions: preset.totalQuestions || 50,
            sections: Array.isArray(preset.sections) ? preset.sections.join(', ') : (preset.sections || 'General'),
            negativeMarking: preset.negativeMarking || 0,
            timeLimit: preset.timeLimit || 60,
            easy: 30,
            medium: 50,
            hard: 20,
            questionType: preset.questionType || 'MCQ',
        });
        setActiveTab('custom');
        setSelectedPreset(preset.id);
    }

    /* ─── Save preset to localStorage ─── */
    function handleSavePreset(config) {
        savePreset({
            name: config.examName || config.title || 'Custom Exam',
            emoji: config.emoji || '📄',
            desc: config.description || '',
            totalQuestions: config.totalQuestions,
            sections: config.sections,
            negativeMarking: config.negativeMarking,
            timeLimit: config.timeLimit,
            marksPerQuestion: config.marksPerQuestion,
            questionType: config.questionType,
            topics: config.topics,
        });
    }

    const handleGenerate = async (examType) => {
        setLoading(true);
        try {
            const config = activeTab === 'preset'
                ? { examType: examType || selectedPreset, totalQuestions: 20, difficulty: '30% Easy, 50% Medium, 20% Hard' }
                : {
                    examType: fetchedConfig?.examName || 'Custom',
                    totalQuestions: custom.totalQuestions,
                    sections: custom.sections.split(',').map(s => s.trim()),
                    negativeMarking: custom.negativeMarking,
                    difficulty: `${custom.easy}% Easy, ${custom.medium}% Medium, ${custom.hard}% Hard`,
                    questionTypes: custom.questionType,
                };

            const res = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'generate-exam', config }),
            });
            const exam = await res.json();

            if (exam.error) {
                alert(exam.error);
                setLoading(false);
                return;
            }

            if (!exam.sections || exam.sections.length === 0) {
                alert('Failed to generate exam. The AI returned an invalid response. Please try again.');
                setLoading(false);
                return;
            }

            sessionStorage.setItem('currentExam', JSON.stringify(exam));
            router.push('/dashboard/exam/live');
        } catch (error) {
            console.error('Error generating exam:', error);
            alert('Network error while generating exam. Please check your connection and try again.');
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className={styles.genPage}>
                <div className={styles.loading}>
                    <div className={styles.spinner} />
                    <p>AI is generating your exam...</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: 'var(--space-2)' }}>
                        Crafting questions, analyzing difficulty, structuring sections...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.genPage}>
            <h1><HiOutlineLightningBolt style={{ display: 'inline' }} /> Generate <span className="gradient-text">Exam</span></h1>
            <p>Choose a preset exam type or build your own custom structure.</p>

            <div className={styles.tabs}>
                <button className={`${styles.tab} ${activeTab === 'preset' ? styles.active : ''}`} onClick={() => setActiveTab('preset')}>
                    Preset Exams
                </button>
                <button className={`${styles.tab} ${activeTab === 'custom' ? styles.active : ''}`} onClick={() => setActiveTab('custom')}>
                    Custom Builder
                </button>
            </div>

            {activeTab === 'preset' ? (
                <div>
                    <div className={styles.categoryTitle}>🏛️ Government Exams</div>
                    <div className={styles.presetGrid}>
                        {governmentPresets.map((p) => (
                            <div
                                key={p.id}
                                className={`${styles.presetCard} ${selectedPreset === p.id ? styles.selected : ''}`}
                                onClick={() => { setSelectedPreset(p.id); setFetchedConfig(null); }}
                            >
                                <div className={styles.presetEmoji}>{p.emoji}</div>
                                <h4>{p.name}</h4>
                                <p>{p.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className={styles.categoryTitle}>💼 Private Hiring</div>
                    <div className={styles.presetGrid}>
                        {privatePresets.map((p) => (
                            <div
                                key={p.id}
                                className={`${styles.presetCard} ${selectedPreset === p.id ? styles.selected : ''}`}
                                onClick={() => { setSelectedPreset(p.id); setFetchedConfig(null); }}
                            >
                                <div className={styles.presetEmoji}>{p.emoji}</div>
                                <h4>{p.name}</h4>
                                <p>{p.desc}</p>
                            </div>
                        ))}
                        <FetchExamCard onClick={() => setShowFetchModal(true)} />
                        <AddPresetCard
                            onFetchClick={() => setShowFetchModal(true)}
                            onCustomClick={() => setActiveTab('custom')}
                        />
                    </div>

                    {/* Saved Presets */}
                    <SavedPresetsSection count={savedPresets.length}>
                        <div className={styles.presetGrid}>
                            {savedPresets.map((p) => (
                                <SavedPresetCard
                                    key={p.id}
                                    preset={p}
                                    isSelected={selectedPreset === p.id}
                                    onSelect={() => handleSelectSavedPreset(p)}
                                    onDelete={deletePreset}
                                />
                            ))}
                        </div>
                    </SavedPresetsSection>

                    <button
                        className={styles.generateBtn}
                        disabled={!selectedPreset}
                        onClick={() => handleGenerate(selectedPreset)}
                    >
                        <HiOutlinePlay /> Generate Exam
                    </button>
                </div>
            ) : (
                <div className={styles.customForm}>
                    {fetchedConfig && (
                        <div className={styles.fetchedBanner}>
                            <span>{fetchedConfig.emoji || '📄'}</span>
                            <strong>{fetchedConfig.examName || fetchedConfig.name || 'Fetched Config'}</strong>
                            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>— Modify as needed</span>
                        </div>
                    )}
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label>Total Questions</label>
                            <input
                                type="number"
                                className={styles.formInput}
                                value={custom.totalQuestions}
                                onChange={(e) => setCustom({ ...custom, totalQuestions: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Time Limit (minutes)</label>
                            <input
                                type="number"
                                className={styles.formInput}
                                value={custom.timeLimit}
                                onChange={(e) => setCustom({ ...custom, timeLimit: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className={`${styles.formGroup} ${styles.full}`}>
                            <label>Sections (comma-separated)</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                value={custom.sections}
                                onChange={(e) => setCustom({ ...custom, sections: e.target.value })}
                                placeholder="Quant, Reasoning, English, GK"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Negative Marking (per wrong answer)</label>
                            <input
                                type="number"
                                step="0.25"
                                className={styles.formInput}
                                value={custom.negativeMarking}
                                onChange={(e) => setCustom({ ...custom, negativeMarking: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Question Type</label>
                            <select
                                className={styles.formInput}
                                value={custom.questionType}
                                onChange={(e) => setCustom({ ...custom, questionType: e.target.value })}
                            >
                                <option value="MCQ">MCQ (Multiple Choice)</option>
                                <option value="Descriptive">Descriptive</option>
                                <option value="Mixed">Mixed (MCQ + Descriptive)</option>
                            </select>
                        </div>

                        <div className={`${styles.formGroup} ${styles.full}`}>
                            <div className={styles.sliderGroup}>
                                <div className={styles.sliderLabel}>
                                    <span>🟢 Easy: {custom.easy}%</span>
                                    <span>🟡 Medium: {custom.medium}%</span>
                                    <span>🔴 Hard: {custom.hard}%</span>
                                </div>
                                <div className={styles.difficultyBars} style={{ marginBottom: '1rem' }}>
                                    <div className={styles.diffBar} style={{ width: `${custom.easy}%`, background: '#4ade80' }} />
                                    <div className={styles.diffBar} style={{ width: `${custom.medium}%`, background: '#fbbf24' }} />
                                    <div className={styles.diffBar} style={{ width: `${custom.hard}%`, background: '#f87171' }} />
                                </div>
                                
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Easy</label>
                                        <input type="range" min="0" max="100" value={custom.easy} className={styles.slider}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                const rem = 100 - val;
                                                const othersTotal = custom.medium + custom.hard || 1;
                                                const mRatio = custom.medium / othersTotal;
                                                const newMedium = Math.round(rem * mRatio);
                                                const newHard = rem - newMedium;
                                                setCustom({...custom, easy: val, medium: newMedium, hard: newHard});
                                            }} 
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Medium</label>
                                        <input type="range" min="0" max="100" value={custom.medium} className={styles.slider}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                const rem = 100 - val;
                                                const othersTotal = custom.easy + custom.hard || 1;
                                                const eRatio = custom.easy / othersTotal;
                                                const newEasy = Math.round(rem * eRatio);
                                                const newHard = rem - newEasy;
                                                setCustom({...custom, medium: val, easy: newEasy, hard: newHard});
                                            }} 
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Hard</label>
                                        <input type="range" min="0" max="100" value={custom.hard} className={styles.slider}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                const rem = 100 - val;
                                                const othersTotal = custom.easy + custom.medium || 1;
                                                const eRatio = custom.easy / othersTotal;
                                                const newEasy = Math.round(rem * eRatio);
                                                const newMedium = rem - newEasy;
                                                setCustom({...custom, hard: val, easy: newEasy, medium: newMedium});
                                            }} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button className={styles.generateBtn} onClick={() => handleGenerate(fetchedConfig?.examName || 'Custom')}>
                        <HiOutlinePlay /> Generate Custom Exam
                    </button>
                </div>
            )}

            {/* Fetch Modal */}
            <FetchExamModal
                isOpen={showFetchModal}
                onClose={() => setShowFetchModal(false)}
                onUseConfig={handleUseFetchedConfig}
                onSavePreset={handleSavePreset}
                mode="exam"
            />
        </div>
    );
}
