'use client';
import { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
                if (res.ok) { const data = await res.json(); setActivities(data.activities || []); }
            } catch (err) { console.error('Failed to fetch activities:', err); }
            setLoading(false);
        }
        fetchActivities();
    }, []);

    const hasData = activities.length > 0;
    const scores = activities.filter(a => a.totalMarks > 0).map(a => Math.round((a.score / a.totalMarks) * 100)).reverse();
    const labels = scores.map((_, i) => `Activity ${i + 1}`);

    const topicScores = {};
    activities.forEach(a => {
        const topic = a.type === 'coding' ? 'Coding' : a.type === 'exam' ? 'Exams' : 'Interviews';
        if (!topicScores[topic]) topicScores[topic] = { total: 0, count: 0 };
        if (a.totalMarks > 0) { topicScores[topic].total += (a.score / a.totalMarks) * 100; topicScores[topic].count++; }
    });

    const topicLabels = Object.keys(topicScores).length > 0 ? Object.keys(topicScores) : ['Coding', 'Exams', 'Interviews'];
    const topicValues = topicLabels.map(t => topicScores[t] ? Math.round(topicScores[t].total / topicScores[t].count) : 0);

    const easyScores = activities.filter(a => a.details?.difficulty === 'easy' || (a.totalMarks > 0 && (a.score / a.totalMarks) >= 0.8));
    const medScores = activities.filter(a => a.details?.difficulty === 'medium' || (a.totalMarks > 0 && (a.score / a.totalMarks) >= 0.5 && (a.score / a.totalMarks) < 0.8));
    const hardScores = activities.filter(a => a.details?.difficulty === 'hard' || (a.totalMarks > 0 && (a.score / a.totalMarks) < 0.5));

    const chartColors = { grid: 'rgba(99,102,241,0.08)', tick: '#64748b', primary: '#6366f1', primaryBg: 'rgba(99,102,241,0.1)' };

    const lineConfig = {
        type: 'line',
        data: { labels: hasData ? labels : ['No data'], datasets: [{ label: 'Score %', data: hasData ? scores : [0], borderColor: chartColors.primary, backgroundColor: chartColors.primaryBg, fill: true, tension: 0.4, pointBackgroundColor: chartColors.primary, pointRadius: 5 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100, ticks: { color: chartColors.tick }, grid: { color: chartColors.grid } }, x: { ticks: { color: chartColors.tick }, grid: { display: false } } } },
    };

    const radarConfig = {
        type: 'radar',
        data: { labels: topicLabels, datasets: [{ label: 'Accuracy', data: topicValues, borderColor: chartColors.primary, backgroundColor: 'rgba(99,102,241,0.2)', pointBackgroundColor: chartColors.primary }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { r: { min: 0, max: 100, ticks: { color: chartColors.tick, stepSize: 25 }, grid: { color: 'rgba(99,102,241,0.1)' }, pointLabels: { color: '#94a3b8', font: { size: 12 } } } } },
    };

    const barConfig = {
        type: 'bar',
        data: { labels: hasData ? ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'] : ['No data'], datasets: [{ label: 'Activities', data: hasData ? [scores.filter(s => s <= 20).length, scores.filter(s => s > 20 && s <= 40).length, scores.filter(s => s > 40 && s <= 60).length, scores.filter(s => s > 60 && s <= 80).length, scores.filter(s => s > 80).length] : [0], backgroundColor: ['#ef4444', '#f59e0b', '#6366f1', '#22c55e', '#4ade80'], borderRadius: 8 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { color: chartColors.tick, stepSize: 1 }, grid: { color: chartColors.grid } }, x: { ticks: { color: chartColors.tick }, grid: { display: false } } } },
    };

    const doughnutConfig = {
        type: 'doughnut',
        data: { labels: ['High (80%+)', 'Medium (50-79%)', 'Low (<50%)'], datasets: [{ data: hasData ? [easyScores.length, medScores.length, hardScores.length] : [1, 1, 1], backgroundColor: hasData ? ['#4ade80', '#fbbf24', '#f87171'] : ['#334155', '#334155', '#334155'], borderWidth: 0, spacing: 4, borderRadius: 6 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 16, font: { size: 12 } } } }, cutout: '65%' },
    };

    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const bestTopic = Object.entries(topicScores).sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count))[0];
    const worstTopic = Object.entries(topicScores).sort((a, b) => (a[1].total / a[1].count) - (b[1].total / b[1].count))[0];

    const insights = hasData ? [
        bestTopic ? { icon: '🎯', bg: 'bg-emerald-500/10', title: `Strong in ${bestTopic[0]}`, desc: `${Math.round(bestTopic[1].total / bestTopic[1].count)}% average. Keep it up!` } : null,
        worstTopic && worstTopic[0] !== bestTopic?.[0] ? { icon: '⚠️', bg: 'bg-amber-500/10', title: `Improve ${worstTopic[0]}`, desc: `${Math.round(worstTopic[1].total / worstTopic[1].count)}% average. Focus more on this area.` } : null,
        { icon: '📊', bg: 'bg-sky-500/10', title: 'Overall Score', desc: `${avgScore}% average across ${activities.length} activities.` },
    ].filter(Boolean) : [
        { icon: '🚀', bg: 'bg-indigo-500/10', title: 'Get Started', desc: 'Complete your first activity to see personalized insights here.' },
        { icon: '💡', bg: 'bg-amber-500/10', title: 'Tip', desc: 'Try a coding challenge or generate an exam to begin tracking your progress.' },
    ];

    if (loading) {
        return (
            <div className="space-y-4">
                <h1 className="text-2xl font-bold">📊 Performance <span className="gradient-text">Analytics</span></h1>
                <p className="text-muted-foreground">Loading your performance data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">📊 Performance <span className="gradient-text">Analytics</span></h1>
                <p className="text-muted-foreground mt-1">{hasData ? 'Track your progress, identify weak areas, and improve.' : 'Complete activities to see your performance analytics here.'}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card className="md:col-span-2 p-6">
                    <h3 className="font-semibold mb-4">📈 Score Trend</h3>
                    <div className="h-64"><ChartCanvas config={lineConfig} /></div>
                </Card>
                <Card className="p-6">
                    <h3 className="font-semibold mb-4">🎯 Topic-wise Accuracy</h3>
                    <div className="h-64"><ChartCanvas config={radarConfig} /></div>
                </Card>
                <Card className="p-6">
                    <h3 className="font-semibold mb-4">📊 Score Distribution</h3>
                    <div className="h-64"><ChartCanvas config={barConfig} /></div>
                </Card>
                <Card className="md:col-span-2 p-6">
                    <h3 className="font-semibold mb-4">🎚️ Performance Breakdown</h3>
                    <div className="h-64 max-w-[350px] mx-auto"><ChartCanvas config={doughnutConfig} /></div>
                </Card>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {insights.map((ins, i) => (
                    <Card key={i} className="p-5 flex items-start gap-4">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0", ins.bg)}>{ins.icon}</div>
                        <div>
                            <h4 className="text-sm font-semibold">{ins.title}</h4>
                            <p className="text-sm text-muted-foreground mt-0.5">{ins.desc}</p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
