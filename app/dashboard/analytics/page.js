'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Chart, registerables } from 'chart.js';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useTheme } from '@/app/providers/ThemeProvider';

Chart.register(...registerables);

/**
 * Reads theme-aware CSS variable values from the document root
 * and returns a chartColors object suitable for Chart.js configs.
 */
function getThemeChartColors() {
    if (typeof document === 'undefined') {
        return { primary: '#6366f1', primaryBg: 'rgba(99,102,241,0.1)', grid: 'rgba(99,102,241,0.08)', tick: '#64748b', label: '#94a3b8' };
    }
    const style = getComputedStyle(document.documentElement);
    const primary = style.getPropertyValue('--color-primary')?.trim() || '#6366f1';
    const muted = style.getPropertyValue('--color-muted-foreground')?.trim() || '#64748b';
    const border = style.getPropertyValue('--color-border')?.trim() || 'rgba(99,102,241,0.08)';
    // Build semi-transparent versions
    const primaryBg = primary.startsWith('#')
        ? `${primary}1a` // ~10% opacity via hex
        : primary.replace(/[\d.]+\)$/, '0.1)');
    const gridBg = border.startsWith('#')
        ? `${border}14`
        : border.replace(/[\d.]+\)$/, '0.08)');
    return { primary, primaryBg, grid: gridBg, tick: muted, label: muted };
}

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

    // Type-wise scores (original)
    const typeScores = {};
    activities.forEach(a => {
        const topic = a.type === 'coding' ? 'Coding' : a.type === 'exam' ? 'Exams' : 'Interviews';
        if (!typeScores[topic]) typeScores[topic] = { total: 0, count: 0 };
        if (a.totalMarks > 0) { typeScores[topic].total += (a.score / a.totalMarks) * 100; typeScores[topic].count++; }
    });

    const topicLabels = Object.keys(typeScores).length > 0 ? Object.keys(typeScores) : ['Coding', 'Exams', 'Interviews'];
    const topicValues = topicLabels.map(t => typeScores[t] ? Math.round(typeScores[t].total / typeScores[t].count) : 0);

    // Deep topic-wise analytics from tags and section names
    const deepTopicScores = {};
    activities.forEach(a => {
        // Extract topics from tags array
        const tags = a.tags || [];
        tags.forEach(tag => {
            const t = tag.trim();
            if (!t) return;
            if (!deepTopicScores[t]) deepTopicScores[t] = { total: 0, count: 0 };
            if (a.totalMarks > 0) {
                deepTopicScores[t].total += (a.score / a.totalMarks) * 100;
                deepTopicScores[t].count++;
            }
        });
        // Also derive topic from activity title for exams (e.g., "UPSC CSE Exam" → "UPSC")
        if (tags.length === 0 && a.type === 'exam') {
            const sectionTopics = a.details?.sections || [];
            sectionTopics.forEach(s => {
                const t = typeof s === 'string' ? s.trim() : s.name?.trim();
                if (!t) return;
                if (!deepTopicScores[t]) deepTopicScores[t] = { total: 0, count: 0 };
                if (a.totalMarks > 0) {
                    deepTopicScores[t].total += (a.score / a.totalMarks) * 100;
                    deepTopicScores[t].count++;
                }
            });
        }
        // For coding, extract from title keywords
        if (tags.length === 0 && a.type === 'coding') {
            const codingTopics = ['DSA', 'Arrays', 'Strings', 'Trees', 'Graphs', 'DP', 'Sorting', 'Searching', 'Math', 'Recursion'];
            const found = codingTopics.find(t => a.title?.toLowerCase().includes(t.toLowerCase()));
            if (found) {
                if (!deepTopicScores[found]) deepTopicScores[found] = { total: 0, count: 0 };
                if (a.totalMarks > 0) {
                    deepTopicScores[found].total += (a.score / a.totalMarks) * 100;
                    deepTopicScores[found].count++;
                }
            }
        }
    });

    // Sort deep topics by count (most practiced first)
    const deepTopicEntries = Object.entries(deepTopicScores)
        .filter(([_, v]) => v.count > 0)
        .sort((a, b) => b[1].count - a[1].count);
    const deepTopicLabels = deepTopicEntries.map(([k]) => k);
    const deepTopicValues = deepTopicEntries.map(([_, v]) => Math.round(v.total / v.count));
    const deepTopicCounts = deepTopicEntries.map(([_, v]) => v.count);
    // Identify weak topics (< 50% accuracy) and strong topics (> 75%)
    const weakTopics = deepTopicEntries.filter(([_, v]) => (v.total / v.count) < 50).map(([k, v]) => ({ name: k, avg: Math.round(v.total / v.count), count: v.count }));
    const strongTopics = deepTopicEntries.filter(([_, v]) => (v.total / v.count) >= 75).map(([k, v]) => ({ name: k, avg: Math.round(v.total / v.count), count: v.count }));

    const easyScores = activities.filter(a => a.details?.difficulty === 'easy' || (a.totalMarks > 0 && (a.score / a.totalMarks) >= 0.8));
    const medScores = activities.filter(a => a.details?.difficulty === 'medium' || (a.totalMarks > 0 && (a.score / a.totalMarks) >= 0.5 && (a.score / a.totalMarks) < 0.8));
    const hardScores = activities.filter(a => a.details?.difficulty === 'hard' || (a.totalMarks > 0 && (a.score / a.totalMarks) < 0.5));

    const { theme } = useTheme();
    // Re-derive colors whenever theme changes so charts repaint correctly
    const chartColors = useMemo(() => getThemeChartColors(), [theme]);

    const lineConfig = {
        type: 'line',
        data: { labels: hasData ? labels : ['No data'], datasets: [{ label: 'Score %', data: hasData ? scores : [0], borderColor: chartColors.primary, backgroundColor: chartColors.primaryBg, fill: true, tension: 0.4, pointBackgroundColor: chartColors.primary, pointRadius: 5 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100, ticks: { color: chartColors.tick }, grid: { color: chartColors.grid } }, x: { ticks: { color: chartColors.tick }, grid: { display: false } } } },
    };

    const radarConfig = {
        type: 'radar',
        data: { labels: topicLabels, datasets: [{ label: 'Accuracy', data: topicValues, borderColor: chartColors.primary, backgroundColor: chartColors.primaryBg, pointBackgroundColor: chartColors.primary }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { r: { min: 0, max: 100, ticks: { color: chartColors.tick, stepSize: 25 }, grid: { color: chartColors.grid }, pointLabels: { color: chartColors.label, font: { size: 12 } } } } },
    };

    const barConfig = {
        type: 'bar',
        data: { labels: hasData ? ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'] : ['No data'], datasets: [{ label: 'Activities', data: hasData ? [scores.filter(s => s <= 20).length, scores.filter(s => s > 20 && s <= 40).length, scores.filter(s => s > 40 && s <= 60).length, scores.filter(s => s > 60 && s <= 80).length, scores.filter(s => s > 80).length] : [0], backgroundColor: ['#ef4444', '#f59e0b', '#6366f1', '#22c55e', '#4ade80'], borderRadius: 8 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { color: chartColors.tick, stepSize: 1 }, grid: { color: chartColors.grid } }, x: { ticks: { color: chartColors.tick }, grid: { display: false } } } },
    };

    const doughnutConfig = {
        type: 'doughnut',
        data: { labels: ['High (80%+)', 'Medium (50-79%)', 'Low (<50%)'], datasets: [{ data: hasData ? [easyScores.length, medScores.length, hardScores.length] : [1, 1, 1], backgroundColor: hasData ? ['#4ade80', '#fbbf24', '#f87171'] : ['#334155', '#334155', '#334155'], borderWidth: 0, spacing: 4, borderRadius: 6 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: chartColors.label, padding: 16, font: { size: 12 } } } }, cutout: '65%' },
    };

    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const bestTopic = Object.entries(typeScores).sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count))[0];
    const worstTopic = Object.entries(typeScores).sort((a, b) => (a[1].total / a[1].count) - (b[1].total / b[1].count))[0];

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
            <div className="space-y-8">
                <div>
                    <h1 className="text-2xl font-bold">📊 Performance <span className="gradient-text">Analytics</span></h1>
                    <p className="text-muted-foreground mt-1">Loading your performance data...</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="md:col-span-2 p-6">
                        <Skeleton className="h-5 w-28 mb-4" />
                        <div className="h-64"><Skeleton className="h-full w-full rounded-lg" /></div>
                    </Card>
                    <Card className="p-6">
                        <Skeleton className="h-5 w-36 mb-4" />
                        <div className="h-64"><Skeleton className="h-full w-full rounded-lg" /></div>
                    </Card>
                    <Card className="p-6">
                        <Skeleton className="h-5 w-32 mb-4" />
                        <div className="h-64"><Skeleton className="h-full w-full rounded-lg" /></div>
                    </Card>
                    <Card className="md:col-span-2 p-6">
                        <Skeleton className="h-5 w-40 mb-4" />
                        <div className="h-64 max-w-[350px] mx-auto"><Skeleton className="h-full w-full rounded-lg" /></div>
                    </Card>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="p-5 flex items-start gap-4">
                            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-full" />
                            </div>
                        </Card>
                    ))}
                </div>
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

            {/* Deep Topic-wise Analytics */}
            {deepTopicEntries.length > 0 && (
                <div className="space-y-6">
                    <div>
                        <h2 className="text-xl font-bold">🎯 Topic-wise <span className="gradient-text">Deep Analytics</span></h2>
                        <p className="text-muted-foreground mt-1">Breakdown by specific topics for actionable insights.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <Card className="p-6">
                            <h3 className="font-semibold mb-4">📊 Topic Accuracy</h3>
                            <div className="h-64"><ChartCanvas config={{
                                type: 'bar',
                                data: {
                                    labels: deepTopicLabels.length > 0 ? deepTopicLabels : ['No data'],
                                    datasets: [{
                                        label: 'Accuracy %',
                                        data: deepTopicValues.length > 0 ? deepTopicValues : [0],
                                        backgroundColor: deepTopicValues.map(v => v >= 75 ? '#4ade80' : v >= 50 ? '#fbbf24' : '#f87171'),
                                        borderRadius: 6,
                                    }],
                                },
                                options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { min: 0, max: 100, ticks: { color: chartColors.tick }, grid: { color: chartColors.grid } }, y: { ticks: { color: chartColors.tick, font: { size: 11 } }, grid: { display: false } } } },
                            }} /></div>
                        </Card>
                        <Card className="p-6">
                            <h3 className="font-semibold mb-4">📈 Practice Distribution</h3>
                            <div className="h-64"><ChartCanvas config={{
                                type: 'doughnut',
                                data: {
                                    labels: deepTopicLabels.length > 0 ? deepTopicLabels : ['No data'],
                                    datasets: [{
                                        data: deepTopicCounts.length > 0 ? deepTopicCounts : [1],
                                        backgroundColor: deepTopicLabels.length > 0
                                            ? deepTopicLabels.map((_, i) => {
                                                const palette = ['#6366f1', '#8b5cf6', '#a855f7', '#c084fc', '#7c3aed', '#4ade80', '#fbbf24', '#f87171', '#38bdf8', '#fb923c'];
                                                return palette[i % palette.length];
                                            })
                                            : ['#334155'],
                                        borderWidth: 0,
                                        spacing: 3,
                                        borderRadius: 4,
                                    }],
                                },
                                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: chartColors.label, padding: 12, font: { size: 11 } } } }, cutout: '60%' },
                            }} /></div>
                        </Card>
                    </div>

                    {/* Topic Detail Cards */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {deepTopicEntries.map(([topic, data]) => {
                            const avg = Math.round(data.total / data.count);
                            const isWeak = avg < 50;
                            const isStrong = avg >= 75;
                            return (
                                <Card key={topic} className={cn("p-4 space-y-2", isWeak ? "border-destructive/20" : isStrong ? "border-success/20" : "")}>
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-sm">{topic}</span>
                                        <Badge variant={isWeak ? 'destructive' : isStrong ? 'success' : 'warning'} className="text-[10px]">
                                            {isWeak ? 'Weak' : isStrong ? 'Strong' : 'Average'}
                                        </Badge>
                                    </div>
                                    <Progress value={avg} className="h-1.5" aria-label={`${topic}: ${avg}%`} />
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{avg}% accuracy</span>
                                        <span>{data.count} attempt{data.count !== 1 ? 's' : ''}</span>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Actionable Insights */}
                    {(weakTopics.length > 0 || strongTopics.length > 0) && (
                        <div className="grid sm:grid-cols-2 gap-4">
                            {weakTopics.length > 0 && (
                                <Card className="p-5 border-destructive/20">
                                    <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">🔴 Needs Improvement</h3>
                                    <div className="space-y-2">
                                        {weakTopics.map(t => (
                                            <div key={t.name} className="flex items-center justify-between text-sm">
                                                <span>{t.name}</span>
                                                <span className="text-destructive font-semibold">{t.avg}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}
                            {strongTopics.length > 0 && (
                                <Card className="p-5 border-success/20">
                                    <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">🟢 Your Strengths</h3>
                                    <div className="space-y-2">
                                        {strongTopics.map(t => (
                                            <div key={t.name} className="flex items-center justify-between text-sm">
                                                <span>{t.name}</span>
                                                <span className="text-success font-semibold">{t.avg}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}
                        </div>
                    )}
                </div>
            )}

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
