'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './preset.module.css';

export default function PresetImportPage() {
    const params = useParams();
    const router = useRouter();
    const [preset, setPreset] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        async function fetchPreset() {
            try {
                const res = await fetch(`/api/presets?code=${params.code}`);
                if (!res.ok) throw new Error('Preset not found');
                const data = await res.json();
                setPreset(data.preset);
            } catch (err) {
                setError(err.message);
            }
            setLoading(false);
        }
        if (params.code) fetchPreset();
    }, [params.code]);

    function handleSave() {
        if (!preset) return;
        const storageKey = preset.presetType === 'exam' ? 'examai_exam_presets' :
                           preset.presetType === 'interview' ? 'examai_interview_presets' :
                           'examai_coding_presets';
        const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
        existing.push({ id: `shared_${params.code}`, ...preset.config, name: preset.title, emoji: preset.emoji, desc: preset.description });
        localStorage.setItem(storageKey, JSON.stringify(existing));
        setSaved(true);
    }

    function handleUseNow() {
        handleSave();
        const targetPage = preset.presetType === 'exam' ? '/dashboard/generate' :
                           preset.presetType === 'interview' ? '/dashboard/interview' :
                           '/dashboard/coding';
        router.push(targetPage);
    }

    if (loading) return (
        <div className={styles.presetPage}>
            <div className={styles.loadingState}>
                <div className={styles.spinner} />
                <p>Loading preset...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className={styles.presetPage}>
            <div className={styles.errorState}>
                <span style={{ fontSize: '3rem' }}>😔</span>
                <h2>Preset Not Found</h2>
                <p>{error}</p>
                <Link href="/dashboard" className={styles.backLink}>← Back to Dashboard</Link>
            </div>
        </div>
    );

    return (
        <div className={styles.presetPage}>
            <div className={styles.presetCard}>
                <div className={styles.presetHeader}>
                    <span className={styles.emoji}>{preset.emoji || '📄'}</span>
                    <div>
                        <h1>{preset.title}</h1>
                        <p>{preset.description}</p>
                    </div>
                </div>

                <div className={styles.meta}>
                    <span className={styles.typeBadge}>{preset.presetType}</span>
                    <span>Used {preset.useCount} times</span>
                    <span>Created {new Date(preset.createdAt).toLocaleDateString()}</span>
                </div>

                <div className={styles.configPreview}>
                    <h3>Configuration</h3>
                    <div className={styles.configGrid}>
                        {Object.entries(preset.config || {}).map(([key, value]) => (
                            <div key={key} className={styles.configItem}>
                                <span className={styles.configKey}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
                                <span className={styles.configValue}>{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.actions}>
                    <button className={styles.useBtn} onClick={handleUseNow}>
                        🚀 Use Now
                    </button>
                    <button className={styles.saveBtn} onClick={handleSave} disabled={saved}>
                        {saved ? '✅ Saved' : '💾 Save to Library'}
                    </button>
                </div>
            </div>
        </div>
    );
}
