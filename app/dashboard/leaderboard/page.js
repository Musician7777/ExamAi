'use client';
import { useState, useEffect } from 'react';
import styles from './leaderboard.module.css';

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        async function fetchLeaderboard() {
            setLoading(true);
            try {
                const res = await fetch(`/api/leaderboard?page=${page}&limit=20`);
                const data = await res.json();
                setLeaderboard(data.users || []);
                setTotalPages(data.totalPages || 1);
            } catch (err) {
                console.error('Failed to fetch leaderboard:', err);
            }
            setLoading(false);
        }
        fetchLeaderboard();
    }, [page]);

    const rankEmoji = (rank) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    return (
        <div className={styles.leaderboardPage}>
            <h1>🏆 Global <span className="gradient-text">Leaderboard</span></h1>
            <p>Top performers ranked by experience points earned</p>

            <div className={styles.leaderboardTable}>
                <div className={styles.tableHeader}>
                    <span>Rank</span>
                    <span>User</span>
                    <span>Level</span>
                    <span>XP</span>
                    <span>Streak</span>
                    <span>Badges</span>
                </div>

                {loading ? (
                    [...Array(10)].map((_, i) => <div key={i} className={styles.skeleton} />)
                ) : leaderboard.length === 0 ? (
                    <div className={styles.emptyState}>
                        <span style={{ fontSize: '3rem' }}>🏆</span>
                        <h3>No rankings yet</h3>
                        <p>Complete activities to appear on the leaderboard!</p>
                    </div>
                ) : (
                    leaderboard.map((user) => (
                        <div key={user.rank} className={`${styles.tableRow} ${user.rank <= 3 ? styles.topThree : ''}`}>
                            <span className={styles.rank}>{rankEmoji(user.rank)}</span>
                            <span className={styles.user}>
                                <span className={styles.userAvatar}>{user.userId?.charAt(0)?.toUpperCase() || '?'}</span>
                                <span className={styles.userName}>{user.userId?.split('@')[0] || 'User'}</span>
                            </span>
                            <span className={styles.level}>
                                <span className={styles.levelBadge}>Lv.{user.level?.level || 1}</span>
                                <span className={styles.levelTitle}>{user.level?.title || 'Beginner'}</span>
                            </span>
                            <span className={styles.xp}>{(user.xp || 0).toLocaleString()} XP</span>
                            <span className={styles.streak}>{user.streak > 0 ? `🔥 ${user.streak}d` : '—'}</span>
                            <span className={styles.badges}>{user.badges > 0 ? `${user.badges} 🏅` : '—'}</span>
                        </div>
                    ))
                )}
            </div>

            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
                    <span>Page {page} of {totalPages}</span>
                    <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
                </div>
            )}
        </div>
    );
}
