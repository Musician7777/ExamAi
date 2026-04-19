'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { User, Shield, Trophy, Flame, Star, Lock, Mail, Calendar, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfilePage() {
    const { data: session, update: updateSession } = useSession();
    const [userData, setUserData] = useState(null);
    const [gamification, setGamification] = useState(null);
    const [loading, setLoading] = useState(true);

    // Edit state
    const [editName, setEditName] = useState('');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    // Password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const [userRes, gamRes] = await Promise.all([
                    fetch('/api/user'),
                    fetch('/api/gamification'),
                ]);
                if (userRes.ok) {
                    const data = await userRes.json();
                    setUserData(data.user);
                    setEditName(data.user.name || '');
                }
                if (gamRes.ok) {
                    const data = await gamRes.json();
                    setGamification(data.profile);
                }
            } catch (err) {
                console.error('Failed to fetch profile data:', err);
            }
            setLoading(false);
        }
        fetchData();
    }, []);

    async function handleSaveName() {
        if (!editName.trim()) return;
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/user', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName.trim() }),
            });
            const data = await res.json();
            if (res.ok) {
                setUserData(data.user);
                setMessage({ type: 'success', text: 'Name updated successfully!' });
                await updateSession({ name: editName.trim() });
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to update name' });
            }
        } catch (err) {
            console.error('Profile update error:', err);
            setMessage({ type: 'error', text: 'Network error. Please try again.' });
        }
        setSaving(false);
    }

    async function handleChangePassword(e) {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }
        if (newPassword.length < 8) {
            setPasswordMessage({ type: 'error', text: 'Password must be at least 8 characters' });
            return;
        }
        setChangingPassword(true);
        setPasswordMessage(null);
        try {
            const res = await fetch('/api/user', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
            } else {
                setPasswordMessage({ type: 'error', text: data.error || 'Failed to change password' });
            }
        } catch (err) {
            console.error('Password change error:', err);
            setPasswordMessage({ type: 'error', text: 'Network error. Please try again.' });
        }
        setChangingPassword(false);
    }

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-2xl font-bold">👤 Profile & <span className="gradient-text">Settings</span></h1>
                    <p className="text-muted-foreground mt-1">Loading your profile...</p>
                </div>

                {/* Profile Card Skeleton */}
                <Card className="p-6 md:p-8">
                    <div className="flex flex-col sm:flex-row items-start gap-6">
                        <Skeleton className="w-20 h-20 rounded-2xl shrink-0" />
                        <div className="flex-1 space-y-4 w-full">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-9 w-56" />
                                    <Skeleton className="h-9 w-16" />
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-36" />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Achievements Card Skeleton */}
                <Card className="p-6 md:p-8">
                    <div className="flex items-center gap-2 mb-6">
                        <Skeleton className="h-5 w-5 rounded" />
                        <Skeleton className="h-6 w-32" />
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4 mb-6">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="p-4 rounded-xl border text-center space-y-2">
                                <Skeleton className="h-8 w-16 mx-auto" />
                                <Skeleton className="h-4 w-20 mx-auto" />
                                <Skeleton className="h-3 w-12 mx-auto" />
                            </div>
                        ))}
                    </div>
                    <div className="space-y-2 mb-6">
                        <div className="flex justify-between">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-3 w-full" />
                    </div>
                    <Skeleton className="h-px w-full my-6" />
                    <Skeleton className="h-4 w-24 mb-3" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="p-3 rounded-xl border text-center space-y-1.5">
                                <Skeleton className="h-6 w-6 rounded mx-auto" />
                                <Skeleton className="h-3 w-16 mx-auto" />
                                <Skeleton className="h-2 w-20 mx-auto" />
                            </div>
                        ))}
                    </div>
                    <Skeleton className="h-px w-full my-6" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="text-center p-3 rounded-lg space-y-1">
                                <Skeleton className="h-6 w-16 mx-auto" />
                                <Skeleton className="h-3 w-12 mx-auto" />
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Password Card Skeleton */}
                <Card className="p-6 md:p-8">
                    <div className="flex items-center gap-2 mb-6">
                        <Skeleton className="h-5 w-5 rounded" />
                        <Skeleton className="h-6 w-36" />
                    </div>
                    <div className="space-y-4 max-w-sm">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-9 w-full" />
                            </div>
                        ))}
                        <Skeleton className="h-9 w-32" />
                    </div>
                </Card>
            </div>
        );
    }

    const levelInfo = gamification?.levelInfo || { level: 1, title: 'Beginner', xp: 0, xpForNext: 100, progress: 0 };
    const badges = gamification?.badgeDetails || [];
    const streak = gamification?.currentStreak || 0;
    const longestStreak = gamification?.longestStreak || 0;
    const isGoogleUser = userData?.authProvider === 'google';

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold">👤 Profile & <span className="gradient-text">Settings</span></h1>
                <p className="text-muted-foreground mt-1">Manage your account, view achievements, and update settings.</p>
            </div>

            {/* Profile Card */}
            <Card className="p-6 md:p-8">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shrink-0">
                        {userData?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 space-y-4 w-full">
                        <div>
                            <Label htmlFor="edit-name" className="text-sm font-semibold">Display Name</Label>
                            <div className="flex gap-2 mt-1">
                                <Input
                                    id="edit-name"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Your name"
                                    className="max-w-sm"
                                    aria-label="Display name"
                                />
                                <Button onClick={handleSaveName} disabled={saving || editName.trim() === userData?.name} size="sm">
                                    {saving ? 'Saving...' : 'Save'}
                                </Button>
                            </div>
                            {message && (
                                <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mt-2 max-w-sm">
                                    <AlertDescription className={cn('text-sm', message.type === 'success' && 'text-success')}>
                                        {message.text}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {userData?.email}</span>
                            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Joined {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}</span>
                            <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> {isGoogleUser ? 'Google Sign-In' : 'Email & Password'}</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Gamification Overview */}
            <Card className="p-6 md:p-8">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-6"><Trophy className="h-5 w-5 text-amber-400" /> Achievements</h2>

                <div className="grid sm:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-center">
                        <div className="text-3xl font-bold gradient-text">Lv.{levelInfo.level}</div>
                        <div className="text-sm font-semibold text-foreground mt-1">{levelInfo.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{levelInfo.xp} XP</div>
                    </div>
                    <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 text-center">
                        <div className="text-3xl font-bold text-orange-400">🔥 {streak}</div>
                        <div className="text-sm font-semibold text-foreground mt-1">Current Streak</div>
                        <div className="text-xs text-muted-foreground mt-0.5">Best: {longestStreak} days</div>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
                        <div className="text-3xl font-bold text-emerald-400">{badges.length}</div>
                        <div className="text-sm font-semibold text-foreground mt-1">Badges Earned</div>
                        <div className="text-xs text-muted-foreground mt-0.5">Keep going!</div>
                    </div>
                </div>

                {/* XP Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Level {levelInfo.level} — {levelInfo.title}</span>
                        {levelInfo.nextLevel && <span className="text-muted-foreground">{levelInfo.xpForNext} XP to Level {levelInfo.level + 1}</span>}
                    </div>
                    <Progress value={levelInfo.progress} className="h-3" aria-label={`XP progress: ${Math.round(levelInfo.progress)}% to next level`} />
                </div>

                <Separator className="my-6" />

                {/* Badges Grid */}
                <h3 className="font-semibold mb-3">🏅 Badges ({badges.length})</h3>
                {badges.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {badges.map((badge) => (
                            <div key={badge.id} className="p-3 rounded-xl bg-secondary/30 border border-border/50 text-center hover:bg-secondary/50 transition-colors">
                                <div className="text-2xl mb-1">{badge.emoji}</div>
                                <div className="text-xs font-semibold">{badge.name}</div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">{badge.description}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">Complete activities to earn badges! Your first badge is just one exam away.</p>
                )}

                {/* Stats */}
                <Separator className="my-6" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="text-center p-3 rounded-lg bg-secondary/20">
                        <div className="text-xl font-bold">📝 {gamification?.totalExams || 0}</div>
                        <div className="text-xs text-muted-foreground">Exams</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-secondary/20">
                        <div className="text-xl font-bold">💻 {gamification?.totalCoding || 0}</div>
                        <div className="text-xs text-muted-foreground">Coding</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-secondary/20">
                        <div className="text-xl font-bold">🎤 {gamification?.totalInterviews || 0}</div>
                        <div className="text-xs text-muted-foreground">Interviews</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-secondary/20">
                        <div className="text-xl font-bold">🎯 {gamification?.bestScore || 0}%</div>
                        <div className="text-xs text-muted-foreground">Best Score</div>
                    </div>
                </div>
            </Card>

            {/* Change Password */}
            {!isGoogleUser && (
                <Card className="p-6 md:p-8">
                    <h2 className="text-xl font-bold flex items-center gap-2 mb-6"><Lock className="h-5 w-5" /> Change Password</h2>
                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
                        <div className="space-y-2">
                            <Label htmlFor="current-password">Current Password</Label>
                            <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} />
                        </div>
                        {passwordMessage && (
                            <Alert variant={passwordMessage.type === 'error' ? 'destructive' : 'default'}>
                                <AlertDescription className={cn('text-sm', passwordMessage.type === 'success' && 'text-success')}>
                                    {passwordMessage.text}
                                </AlertDescription>
                            </Alert>
                        )}
                        <Button type="submit" disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}>
                            {changingPassword ? 'Changing...' : 'Change Password'}
                        </Button>
                    </form>
                </Card>
            )}

            {isGoogleUser && (
                <Card className="p-6 md:p-8">
                    <h2 className="text-xl font-bold flex items-center gap-2 mb-4"><Lock className="h-5 w-5" /> Password</h2>
                    <p className="text-muted-foreground text-sm">Your account uses Google Sign-In. Password changes are managed through your Google account settings.</p>
                </Card>
            )}
        </div>
    );
}
