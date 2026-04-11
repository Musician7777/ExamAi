'use client';
import { useState, useEffect, useCallback } from 'react';
import { HiOutlineCalendar, HiOutlineFilter, HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineSearch } from 'react-icons/hi';
import styles from './activity.module.css';

export default function ActivityPage() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [filters, setFilters] = useState({ type: '', dateFrom: '', dateTo: '', minScore: '', difficulty: '' });
    const [showFilters, setShowFilters] = useState(false);
    const [expandedId, setExpandedId] = useState(null);

    const fetchActivities = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 15 });
            if (filters.type) params.set('type', filters.type);
            if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
            if (filters.dateTo) params.set('dateTo', filters.dateTo);
            if (filters.minScore) params.set('minScore', filters.minScore);
            if (filters.difficulty) params.set('difficulty', filters.difficulty);

            const res = await fetch(`/api/activities?${params}`);
            const data = await res.json();
            setActivities(data.activities || []);
            setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
        } catch (err) {
            console.error('Failed to fetch activities:', err);
        }
        setLoading(false);
    }, [filters]);

    useEffect(() => { fetchActivities(); }, [fetchActivities]);

    const typeIcon = (type) => ({ exam: '📝', coding: '💻', interview: '🎤' }[type] || '📄');
    const scoreColor = (score, total) => {
        const pct = total > 0 ? (score / total) * 100 : 0;
        return pct >= 70 ? '#4ade80' : pct >= 40 ? '#fbbf24' : '#f87171';
    };

    return (
        <div className={styles.activityPage}>
            <div className={styles.header}>
                <div>
                    <h1>📊 Activity <span className="gradient-text">History</span></h1>
                    <p>Track your progress across exams, coding challenges, and interviews</p>
                </div>
                <button className={styles.filterToggle} onClick={() => setShowFilters(v => !v)}>
                    <HiOutlineFilter /> Filters {showFilters ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
                </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className={styles.filtersPanel}>
                    <div className={styles.filterGrid}>
                        <div className={styles.filterGroup}>
                            <label>Type</label>
                            <select value={filters.type} onChange={e => setFilters(p => ({ ...p, type: e.target.value }))}>
                                <option value="">All Types</option>
                                <option value="exam">📝 Exams</option>
                                <option value="coding">💻 Coding</option>
                                <option value="interview">🎤 Interviews</option>
                            </select>
                        </div>
                        <div className={styles.filterGroup}>
                            <label>From Date</label>
                            <input type="date" value={filters.dateFrom} onChange={e => setFilters(p => ({ ...p, dateFrom: e.target.value }))} />
                        </div>
                        <div className={styles.filterGroup}>
                            <label>To Date</label>
                            <input type="date" value={filters.dateTo} onChange={e => setFilters(p => ({ ...p, dateTo: e.target.value }))} />
                        </div>
                        <div className={styles.filterGroup}>
                            <label>Min Score</label>
                            <input type="number" placeholder="0" value={filters.minScore} onChange={e => setFilters(p => ({ ...p, minScore: e.target.value }))} />
                        </div>
                        <div className={styles.filterGroup}>
                            <label>Difficulty</label>
                            <select value={filters.difficulty} onChange={e => setFilters(p => ({ ...p, difficulty: e.target.value }))}>
                                <option value="">All</option>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                    </div>
                    <button className={styles.clearFilters} onClick={() => setFilters({ type: '', dateFrom: '', dateTo: '', minScore: '', difficulty: '' })}>
                        Clear All
                    </button>
                </div>
            )}

            {/* Stats Summary */}
            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>{pagination.total}</span>
                    <span className={styles.statLabel}>Total Activities</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>{activities.filter(a => a.type === 'exam').length}</span>
                    <span className={styles.statLabel}>Exams</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>{activities.filter(a => a.type === 'coding').length}</span>
                    <span className={styles.statLabel}>Coding</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>{activities.filter(a => a.type === 'interview').length}</span>
                    <span className={styles.statLabel}>Interviews</span>
                </div>
            </div>

            {/* Activity List */}
            <div className={styles.activityList}>
                {loading ? (
                    <div className={styles.loadingState}>
                        {[...Array(5)].map((_, i) => <div key={i} className={styles.skeleton} />)}
                    </div>
                ) : activities.length === 0 ? (
                    <div className={styles.emptyState}>
                        <span style={{ fontSize: '3rem' }}>🔍</span>
                        <h3>No activities found</h3>
                        <p>Try adjusting your filters or start a new exam!</p>
                    </div>
                ) : (
                    activities.map((activity) => (
                        <div
                            key={activity._id}
                            className={`${styles.activityCard} ${expandedId === activity._id ? styles.expanded : ''}`}
                            onClick={() => setExpandedId(expandedId === activity._id ? null : activity._id)}
                        >
                            <div className={styles.activityMain}>
                                <div className={styles.activityLeft}>
                                    <span className={styles.activityIcon}>{typeIcon(activity.type)}</span>
                                    <div>
                                        <h4>{activity.title}</h4>
                                        <div className={styles.activityMeta}>
                                            <span><HiOutlineCalendar /> {new Date(activity.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            <span className={styles.typeBadge}>{activity.type}</span>
                                            {activity.difficulty && <span className={`${styles.diffBadge} ${styles[activity.difficulty]}`}>{activity.difficulty}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.activityRight}>
                                    <span className={styles.scoreValue} style={{ color: scoreColor(activity.score, activity.totalMarks) }}>
                                        {activity.score}/{activity.totalMarks}
                                    </span>
                                    <span className={styles.scorePct}>
                                        {activity.totalMarks > 0 ? Math.round((activity.score / activity.totalMarks) * 100) : 0}%
                                    </span>
                                    {expandedId === activity._id ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
                                </div>
                            </div>

                            {expandedId === activity._id && activity.details && (
                                <div className={styles.activityDetails}>
                                    {Object.entries(activity.details).map(([key, value]) => (
                                        <div key={key} className={styles.detailItem}>
                                            <span className={styles.detailKey}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
                                            <span className={styles.detailValue}>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className={styles.pagination}>
                    <button disabled={pagination.page <= 1} onClick={() => fetchActivities(pagination.page - 1)}>← Previous</button>
                    <span>Page {pagination.page} of {pagination.totalPages}</span>
                    <button disabled={pagination.page >= pagination.totalPages} onClick={() => fetchActivities(pagination.page + 1)}>Next →</button>
                </div>
            )}
        </div>
    );
}
