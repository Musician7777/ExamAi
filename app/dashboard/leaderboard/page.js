'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

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
            } catch (err) { console.error('Failed to fetch leaderboard:', err); }
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
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">🏆 Global <span className="gradient-text">Leaderboard</span></h1>
                <p className="text-muted-foreground mt-1">Top performers ranked by experience points earned</p>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-16">Rank</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Level</TableHead>
                            <TableHead>XP</TableHead>
                            <TableHead>Streak</TableHead>
                            <TableHead>Badges</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 10 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={6}><Skeleton className="h-8" /></TableCell>
                                </TableRow>
                            ))
                        ) : leaderboard.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-16">
                                    <span className="text-4xl">🏆</span>
                                    <h3 className="text-lg font-semibold mt-4">No rankings yet</h3>
                                    <p className="text-muted-foreground mt-1">Complete activities to appear on the leaderboard!</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            leaderboard.map((user) => (
                                <TableRow key={user.rank} className={cn(user.rank <= 3 && "bg-indigo-500/5")}>
                                    <TableCell className="font-bold text-lg">{rankEmoji(user.rank)}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="text-xs">{user.displayName?.charAt(0)?.toUpperCase() || '?'}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{user.displayName || 'User'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="brand" className="text-[10px]">Lv.{user.level?.level || 1}</Badge>
                                            <span className="text-sm text-muted-foreground">{user.level?.title || 'Beginner'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-semibold">{(user.xp || 0).toLocaleString()} XP</TableCell>
                                    <TableCell>{user.streak > 0 ? `🔥 ${user.streak}d` : '—'}</TableCell>
                                    <TableCell>{user.badges > 0 ? `${user.badges} 🏅` : '—'}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Previous</Button>
                    <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</Button>
                </div>
            )}
        </div>
    );
}
