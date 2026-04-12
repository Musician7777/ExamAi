'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { HiOutlineLightningBolt, HiOutlineCode, HiOutlineChatAlt2, HiOutlineChartBar } from 'react-icons/hi';
import ExamConfigModal from '../components/ExamConfigModal/ExamConfigModal';
import styles from './dashHome.module.css';

const quickActions = [
    { icon: <HiOutlineLightningBolt />, bg: 'rgba(99,102,241,0.12)', color: '#818cf8', href: '/dashboard/generate', title: 'Generate Exam', desc: 'Create AI-powered test', mode: 'exam', emoji: '📝' },
    { icon: <HiOutlineCode />, bg: 'rgba(34,197,94,0.12)', color: '#4ade80', href: '/dashboard/coding', title: 'Coding Challenge', desc: 'Practice DSA problems', mode: 'coding', emoji: '💻' },
    { icon: <HiOutlineChatAlt2 />, bg: 'rgba(236,72,153,0.12)', color: '#f472b6', href: '/dashboard/interview', title: 'Mock Interview', desc: 'AI interview simulation', mode: 'interview', emoji: '🎤' },
    { icon: <HiOutlineChartBar />, bg: 'rgba(14,165,233,0.12)', color: '#38bdf8', href: '/dashboard/analytics', title: 'View Analytics', desc: 'Performance insights', mode: null, emoji: '📊' },
];

export default function DashboardPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const firstName = session?.user?.name?.split(' ')[0] || 'there';
    const [dashData, setDashData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Config modal state
    const [configModalOpen, setConfigModalOpen] = useState(false);
    const [configModalMode, setConfigModalMode] = useState('exam');
    const [configModalPreset, setConfigModalPreset] = useState({ name: '', emoji: '' });

    useEffect(() => {
        async function fetchDashboard() {
            try {
                const res = await fetch('/api/dashboard');
                if (res.ok) {
                    const data = await res.json();
                    setDashData(data);
                }
            } catch (err) {
                console.error('Failed to fetch dashboard:', err);
            }
            setLoading(false);
        }
        fetchDashboard();
    }, []);

    function handleQuickAction(action) {
        // Analytics has no config modal — navigate directly
        if (!action.mode) {
            router.push(action.href);
            return;
        }
        setConfigModalMode(action.mode);
        setConfigModalPreset({ name: action.title, emoji: action.emoji });
        setConfigModalOpen(true);
    }

    function handleConfigGenerate(config) {
        setConfigModalOpen(false);
        // Store config in sessionStorage so the target page can pick it up
        sessionStorage.setItem('examConfigModalResult', JSON.stringify({ mode: configModalMode, config }));
        const targetHref = quickActions.find(a => a.mode === configModalMode)?.href;
        if (targetHref) router.push(targetHref);
    }

    const stats = dashData ? [
        { icon: '📝', bg: 'rgba(99,102,241,0.12)', value: String(dashData.stats.totalActivities), label: 'Activities', change: `${dashData.stats.examCount} exams` },
        { icon: '🎯', bg: 'rgba(34,197,94,0.12)', value: `${dashData.stats.avgScore}%`, label: 'Avg. Score', change: dashData.stats.avgScore >= 70 ? 'Great!' : 'Keep going' },
        { icon: '💻', bg: 'rgba(14,165,233,0.12)', value: String(dashData.stats.codingCount), label: 'Coding Done', change: `${dashData.stats.interviewCount} interviews` },
        { icon: '🏆', bg: 'rgba(234,179,8,0.12)', value: dashData.stats.avgScore >= 80 ? 'Top 20%' : dashData.stats.avgScore >= 60 ? 'Top 50%' : '—', label: 'Ranking', change: dashData.stats.totalActivities > 0 ? 'Based on score' : 'Start practicing' },
    ] : [
        { icon: '📝', bg: 'rgba(99,102,241,0.12)', value: '0', label: 'Activities', change: 'Get started!' },
        { icon: '🎯', bg: 'rgba(34,197,94,0.12)', value: '—', label: 'Avg. Score', change: 'No data yet' },
        { icon: '💻', bg: 'rgba(14,165,233,0.12)', value: '0', label: 'Coding Done', change: 'Try a challenge' },
        { icon: '🏆', bg: 'rgba(234,179,8,0.12)', value: '—', label: 'Ranking', change: 'Start practicing' },
    ];

    return (
        <div className={styles.dashHome}>
            <div className={styles.welcome}>
                <h1>Welcome back, <span className="gradient-text">{firstName}</span> 👋</h1>
                <p>Here is your preparation overview. Keep pushing!</p>
            </div>

            <div className={styles.statsRow}>
                {stats.map((s, i) => (
                    <div key={i} className={styles.statCard}>
                        <div className={styles.statTop}>
                            <div className={styles.statIcon} style={{ background: s.bg }}>{s.icon}</div>
                            <span className={`${styles.statChange} ${styles.up}`}>{s.change}</span>
                        </div>
                        <div className={styles.statValue}>{loading ? '...' : s.value}</div>
                        <div className={styles.statLabel}>{s.label}</div>
                    </div>
                ))}
            </div>

            <div className={styles.dashGrid}>
                <div className={styles.recentExams}>
                    <h2>Recent Activity</h2>
                    {loading ? (
                        <p style={{ color: 'var(--text-tertiary)', padding: 'var(--space-4)' }}>Loading...</p>
                    ) : dashData?.recentActivities?.length > 0 ? (
                        dashData.recentActivities.map((activity, i) => (
                            <div key={i} className={styles.examRow}>
                                <div className={styles.examInfo}>
                                    <h4>
                                        {activity.type === 'coding' ? '💻' : activity.type === 'exam' ? '📝' : '🎤'}{' '}
                                        {activity.title}
                                    </h4>
                                    <p>{activity.date}</p>
                                </div>
                                <div className={styles.examScore}>
                                    <span className="gradient-text">{activity.score}</span>
                                    <p>{activity.total}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: 'var(--space-8) var(--space-4)', textAlign: 'center' }}>
                            <p style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>🚀</p>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>No activity yet</p>
                            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                                Take an exam, solve a coding challenge, or try an interview to see your progress here.
                            </p>
                        </div>
                    )}
                </div>

                <div className={styles.quickActions}>
                    {quickActions.map((action, i) => (
                        <div key={i} className={styles.actionCard} onClick={() => handleQuickAction(action)} style={{ cursor: 'pointer' }}>
                            <div className={styles.actionIcon} style={{ background: action.bg, color: action.color }}>
                                {action.icon}
                            </div>
                            <div>
                                <h4>{action.title}</h4>
                                <p>{action.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Config Modal */}
            <ExamConfigModal
                isOpen={configModalOpen}
                onClose={() => setConfigModalOpen(false)}
                onGenerate={handleConfigGenerate}
                mode={configModalMode}
                presetName={configModalPreset.name}
                presetEmoji={configModalPreset.emoji}
            />
        </div>
    );
}
