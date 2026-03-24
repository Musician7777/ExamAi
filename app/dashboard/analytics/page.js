'use client';
import { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import styles from './analytics.module.css';

Chart.register(...registerables);

function ChartCanvas({ config }) {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (chartRef.current) chartRef.current.destroy();
        const ctx = canvasRef.current.getContext('2d');
        chartRef.current = new Chart(ctx, config);
        return () => { if (chartRef.current) chartRef.current.destroy(); };
    }, [config]);

    return <canvas ref={canvasRef} />;
}

export default function AnalyticsPage() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchActivities() {
            try {
                const res = await fetch('/api/activities?limit=50');
                if (res.ok) {
                    const data = await res.json();
                    setActivities(data.activities || []);
                }
            } catch (err) {
                console.error('Failed to fetch activities:', err);
            }
            setLoading(false);
        }
        fetchActivities();
    }, []);

    const hasData = activities.length > 0;

    // Build chart data from real activities
    const scores = activities
        .filter(a => a.totalMarks > 0)
        .map(a => Math.round((a.score / a.totalMarks) * 100))
        .reverse(); // chronological order

    const labels = scores.map((_, i) => `Activity ${i + 1}`);

    // Topic analysis from activities
    const topicScores = {};
    activities.forEach(a => {
        const topic = a.type === 'coding' ? 'Coding' : a.type === 'exam' ? 'Exams' : 'Interviews';
        if (!topicScores[topic]) topicScores[topic] = { total: 0, count: 0 };
        if (a.totalMarks > 0) {
            topicScores[topic].total += (a.score / a.totalMarks) * 100;
            topicScores[topic].count++;
        }
    });

    const topicLabels = Object.keys(topicScores).length > 0 
        ? Object.keys(topicScores) 
        : ['Coding', 'Exams', 'Interviews'];
    const topicValues = topicLabels.map(t => 
        topicScores[t] ? Math.round(topicScores[t].total / topicScores[t].count) : 0
    );

    // Score distribution
    const easyScores = activities.filter(a => a.details?.difficulty === 'easy' || (a.totalMarks > 0 && (a.score / a.totalMarks) >= 0.8));
    const medScores = activities.filter(a => a.details?.difficulty === 'medium' || (a.totalMarks > 0 && (a.score / a.totalMarks) >= 0.5 && (a.score / a.totalMarks) < 0.8));
    const hardScores = activities.filter(a => a.details?.difficulty === 'hard' || (a.totalMarks > 0 && (a.score / a.totalMarks) < 0.5));

    const lineConfig = {
        type: 'line',
        data: {
            labels: hasData ? labels : ['No data'],
            datasets: [{
                label: 'Score %',
                data: hasData ? scores : [0],
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99,102,241,0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#6366f1',
                pointRadius: 5,
            }],
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { min: 0, max: 100, ticks: { color: '#64748b' }, grid: { color: 'rgba(99,102,241,0.08)' } },
                x: { ticks: { color: '#64748b' }, grid: { display: false } },
            },
        },
    };

    const radarConfig = {
        type: 'radar',
        data: {
            labels: topicLabels,
            datasets: [{
                label: 'Accuracy',
                data: topicValues,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99,102,241,0.2)',
                pointBackgroundColor: '#6366f1',
            }],
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { r: { min: 0, max: 100, ticks: { color: '#64748b', stepSize: 25 }, grid: { color: 'rgba(99,102,241,0.1)' }, pointLabels: { color: '#94a3b8', font: { size: 12 } } } },
        },
    };

    const barConfig = {
        type: 'bar',
        data: {
            labels: hasData ? ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'] : ['No data'],
            datasets: [{
                label: 'Activities',
                data: hasData ? [
                    scores.filter(s => s <= 20).length,
                    scores.filter(s => s > 20 && s <= 40).length,
                    scores.filter(s => s > 40 && s <= 60).length,
                    scores.filter(s => s > 60 && s <= 80).length,
                    scores.filter(s => s > 80).length,
                ] : [0],
                backgroundColor: ['#ef4444', '#f59e0b', '#6366f1', '#22c55e', '#4ade80'],
                borderRadius: 8,
            }],
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { ticks: { color: '#64748b', stepSize: 1 }, grid: { color: 'rgba(99,102,241,0.08)' } },
                x: { ticks: { color: '#64748b' }, grid: { display: false } },
            },
        },
    };

    const doughnutConfig = {
        type: 'doughnut',
        data: {
            labels: ['High (80%+)', 'Medium (50-79%)', 'Low (<50%)'],
            datasets: [{
                data: hasData ? [easyScores.length, medScores.length, hardScores.length] : [1, 1, 1],
                backgroundColor: hasData ? ['#4ade80', '#fbbf24', '#f87171'] : ['#334155', '#334155', '#334155'],
                borderWidth: 0,
                spacing: 4,
                borderRadius: 6,
            }],
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 16, font: { size: 12 } } } },
            cutout: '65%',
        },
    };

    // Generate insights from real data
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const bestTopic = Object.entries(topicScores).sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count))[0];
    const worstTopic = Object.entries(topicScores).sort((a, b) => (a[1].total / a[1].count) - (b[1].total / b[1].count))[0];

    const insights = hasData ? [
        bestTopic ? { icon: '🎯', bg: 'rgba(34,197,94,0.12)', title: `Strong in ${bestTopic[0]}`, desc: `${Math.round(bestTopic[1].total / bestTopic[1].count)}% average. Keep it up!` } : null,
        worstTopic && worstTopic[0] !== bestTopic?.[0] ? { icon: '⚠️', bg: 'rgba(234,179,8,0.12)', title: `Improve ${worstTopic[0]}`, desc: `${Math.round(worstTopic[1].total / worstTopic[1].count)}% average. Focus more on this area.` } : null,
        { icon: '📊', bg: 'rgba(14,165,233,0.12)', title: 'Overall Score', desc: `${avgScore}% average across ${activities.length} activities.` },
    ].filter(Boolean) : [
        { icon: '🚀', bg: 'rgba(99,102,241,0.12)', title: 'Get Started', desc: 'Complete your first activity to see personalized insights here.' },
        { icon: '💡', bg: 'rgba(234,179,8,0.12)', title: 'Tip', desc: 'Try a coding challenge or generate an exam to begin tracking your progress.' },
    ];

    if (loading) {
        return (
            <div className={styles.analyticsPage}>
                <h1>📊 Performance <span className="gradient-text">Analytics</span></h1>
                <p>Loading your performance data...</p>
            </div>
        );
    }

    return (
        <div className={styles.analyticsPage}>
            <h1>📊 Performance <span className="gradient-text">Analytics</span></h1>
            <p>{hasData ? 'Track your progress, identify weak areas, and improve.' : 'Complete activities to see your performance analytics here.'}</p>

            <div className={styles.analyticsGrid}>
                <div className={`${styles.chartCard} ${styles.full}`}>
                    <h3>📈 Score Trend</h3>
                    <div className={styles.chartWrap}>
                        <ChartCanvas config={lineConfig} />
                    </div>
                </div>
                <div className={styles.chartCard}>
                    <h3>🎯 Topic-wise Accuracy</h3>
                    <div className={styles.chartWrap}>
                        <ChartCanvas config={radarConfig} />
                    </div>
                </div>
                <div className={styles.chartCard}>
                    <h3>📊 Score Distribution</h3>
                    <div className={styles.chartWrap}>
                        <ChartCanvas config={barConfig} />
                    </div>
                </div>
                <div className={`${styles.chartCard} ${styles.full}`}>
                    <h3>🎚️ Performance Breakdown</h3>
                    <div className={styles.chartWrap} style={{ maxWidth: 350, margin: '0 auto' }}>
                        <ChartCanvas config={doughnutConfig} />
                    </div>
                </div>
            </div>

            <div className={styles.insightsGrid}>
                {insights.map((ins, i) => (
                    <div key={i} className={styles.insightCard}>
                        <div className={styles.insightIcon} style={{ background: ins.bg }}>{ins.icon}</div>
                        <h4>{ins.title}</h4>
                        <p>{ins.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
