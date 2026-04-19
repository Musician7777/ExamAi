'use client';
import { useState, useEffect, useRef, useId, Suspense } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useCachedFetch } from '@/hooks/useCachedFetch';
import clientLogger from '@/lib/client-logger';
import { cacheInvalidate } from '@/lib/clientCache';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  Shield,
  Trophy,
  Lock,
  Mail,
  Calendar,
  Settings,
  Pencil,
  Share2,
  Trash2,
  X,
  Check,
  AlertTriangle,
  Copy,
  CheckCircle2,
  Camera,
  Loader2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshShimmer } from '@/components/ui/refresh-shimmer';
import ThemePicker from '../../components/ThemePicker/ThemePicker';

/* ─── Animated count-up hook ─── */
function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = performance.now();
    const to = target;

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setValue(Math.round(to * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (to === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset to 0 is synchronous by design when target is 0
      setValue(0);
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}

/* ─── Circular level ring component ─── */
function LevelRing({ progress, size = 96, strokeWidth = 5, children }) {
  const uid = useId();
  const gradientId = `levelGradient-${uid}`;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Level progress: ${Math.round(progress)}%`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={mounted ? offset : circumference}
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(280 80% 60%)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

/* ─── Stat counter card with animation ─── */
function StatCounter({ emoji, target, label, suffix = '' }) {
  const count = useCountUp(target);
  return (
    <div className="text-center p-3 rounded-lg bg-secondary/20">
      <div className="text-xl font-bold">
        {emoji} {count}
        {suffix}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

/* ─── Achievement card with animated number ─── */
function AchievementCard({
  className,
  value,
  label,
  sub,
  subValue,
  subPrefix = '',
  subSuffix = '',
  valueClass,
  prefix = '',
  suffix = '',
}) {
  const count = useCountUp(value);
  const subCount = useCountUp(subValue ?? 0);
  return (
    <div className={cn('p-4 rounded-xl text-center', className)}>
      <div className={cn('text-3xl font-bold', valueClass)}>
        {prefix}
        {count}
        {suffix}
      </div>
      <div className="text-sm font-semibold text-foreground mt-1">{label}</div>
      <div className="text-xs text-muted-foreground mt-0.5">
        {sub != null ? sub : subValue != null ? `${subPrefix}${subCount}${subSuffix}` : ''}
      </div>
    </div>
  );
}

/* ─── Confirm Dialog (reusable) ─── */
function ConfirmDialog({ trigger, title, description, confirmLabel, onConfirm, loading, destructive, children }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {destructive && <AlertTriangle className="h-5 w-5 text-destructive" />}
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            onClick={async () => {
              await onConfirm();
              setOpen(false);
            }}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ──────────────────────────────────────────── */
/*  Main Profile Page                           */
/* ──────────────────────────────────────────── */
function ProfilePageInner() {
  const { data: session, update: updateSession } = useSession();
  const searchParams = useSearchParams();

  const {
    data: userData,
    loading: userLoading,
    revalidating: userRevalidating,
    refetch: refetchUser,
  } = useCachedFetch('/api/user', {
    ttl: 60_000,
    selector: (json) => json.user,
  });

  const {
    data: gamification,
    loading: gamLoading,
    revalidating: gamRevalidating,
  } = useCachedFetch('/api/gamification', {
    ttl: 60_000,
    selector: (json) => ({ ...json.profile, allBadges: json.allBadges }),
  });

  const loading = userLoading || gamLoading;
  const revalidating = !loading && (userRevalidating || gamRevalidating);

  // Edit state
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [nameEdited, setNameEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);

  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [changingEmail, setChangingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState(null);

  // Account deletion state
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Avatar upload state
  const avatarInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Share state
  const [shareUrl, setShareUrl] = useState('');
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Detect email changed via verification redirect
  const emailChangedParam = searchParams.get('emailChanged');

  // Sync editName from server data
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing local state from server data on change
    if (userData && !nameEdited) setEditName(userData.name || '');
  }, [userData, nameEdited]);

  // Show message from verification redirect
  const errorParam = searchParams.get('error');
  useEffect(() => {
    if (emailChangedParam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- responding to URL param change is legitimate
      setMessage({ type: 'success', text: 'Email changed successfully!' });
      refetchUser();
    } else if (errorParam === 'email-taken') {
      setMessage({ type: 'error', text: 'That email is already in use by another account.' });
    }
  }, [emailChangedParam, errorParam, refetchUser]);

  const xpForNextCount = useCountUp(gamification?.levelInfo?.xpForNext ?? 100);

  /* ─── Handlers ─── */

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
        cacheInvalidate('/api/user');
        cacheInvalidate('/api/dashboard');
        cacheInvalidate('/api/gamification');
        setMessage({ type: 'success', text: 'Name updated successfully!' });
        setNameEdited(false);
        await updateSession({ name: editName.trim() });
        refetchUser();
        setTimeout(() => setEditingProfile(false), 800);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update name' });
      }
    } catch (err) {
      clientLogger.error('Profile update error:', err);
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
        cacheInvalidate('/api/user');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
      } else {
        setPasswordMessage({ type: 'error', text: data.error || 'Failed to change password' });
      }
    } catch (err) {
      clientLogger.error('Password change error:', err);
      setPasswordMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
    setChangingPassword(false);
  }

  async function handleEmailChange(e) {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setChangingEmail(true);
    setEmailMessage(null);
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail: newEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewEmail('');
        setEmailMessage({
          type: 'success',
          text: data.message || 'Verification email sent! Check your inbox.',
        });
      } else {
        setEmailMessage({ type: 'error', text: data.error || 'Failed to request email change' });
      }
    } catch (err) {
      clientLogger.error('Email change error:', err);
      setEmailMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
    setChangingEmail(false);
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const res = await fetch('/api/user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        await signOut({ callbackUrl: '/' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete account' });
      }
    } catch (err) {
      clientLogger.error('Account deletion error:', err);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
    setDeleting(false);
    setDeletePassword('');
  }

  async function handleShareProfile() {
    setSharing(true);
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'profile',
          title: `${userData?.name || 'User'}'s Profile`,
          data: {
            name: userData?.name,
            levelInfo: gamification?.levelInfo,
            badges: gamification?.badgeDetails,
            streak: gamification?.currentStreak,
            totalExams: gamification?.totalExams,
            totalCoding: gamification?.totalCoding,
            totalInterviews: gamification?.totalInterviews,
            bestScore: gamification?.bestScore,
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShareUrl(data.shareUrl);
      }
    } catch (err) {
      clientLogger.error('Share profile error:', err);
    }
    setSharing(false);
  }

  function handleCopyUrl() {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  /* ─── Client-side image resize via Canvas ─── */
  function resizeImage(file, maxW, maxH) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        // Fill white background so transparent PNGs don't render as black in JPEG
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(img.src);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            else reject(new Error('Canvas toBlob failed'));
          },
          'image/jpeg',
          0.85
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image'));
      };
      img.src = URL.createObjectURL(file);
    });
  }

  /* ─── Avatar Upload ─── */
  async function handleAvatarSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      setMessage({ type: 'error', text: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File too large. Maximum size is 2MB.' });
      return;
    }

    setUploadingAvatar(true);
    setMessage(null);

    try {
      // Client-side resize using Canvas
      const resized = await resizeImage(file, 256, 256);

      const formData = new FormData();
      formData.append('avatar', resized);

      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        cacheInvalidate('/api/user');
        cacheInvalidate('/api/dashboard');
        cacheInvalidate('/api/gamification');
        await updateSession({ image: data.image });
        refetchUser();
        setMessage({ type: 'success', text: 'Avatar updated!' });
        setTimeout(() => setMessage(null), 2000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to upload avatar' });
      }
    } catch (err) {
      clientLogger.error('Avatar upload error:', err);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }

    setUploadingAvatar(false);
    // Reset file input so re-selecting the same file works
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  }

  async function handleRemoveAvatar() {
    setUploadingAvatar(true);
    setMessage(null);
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: null }),
      });
      const data = await res.json();
      if (res.ok) {
        cacheInvalidate('/api/user');
        cacheInvalidate('/api/dashboard');
        cacheInvalidate('/api/gamification');
        await updateSession({ image: null });
        refetchUser();
        setMessage({ type: 'success', text: 'Avatar removed.' });
        setTimeout(() => setMessage(null), 2000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to remove avatar' });
      }
    } catch (err) {
      clientLogger.error('Avatar remove error:', err);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
    setUploadingAvatar(false);
  }

  /* ─── Loading State ─── */
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold">
            👤 Profile & <span className="gradient-text">Settings</span>
          </h1>
          <p className="text-muted-foreground mt-1">Loading your profile...</p>
        </div>

        <Card className="p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Skeleton className="w-24 h-24 rounded-full shrink-0" />
            <div className="flex-1 space-y-3 w-full text-center sm:text-left">
              <Skeleton className="h-7 w-40 mx-auto sm:mx-0" />
              <Skeleton className="h-4 w-56 mx-auto sm:mx-0" />
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        </Card>

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
              </div>
            ))}
          </div>
          <Skeleton className="h-3 w-full rounded-full mb-2" />
          <Skeleton className="h-px w-full my-6" />
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="text-center p-3 rounded-lg space-y-1">
                <Skeleton className="h-6 w-16 mx-auto" />
                <Skeleton className="h-3 w-12 mx-auto" />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-4 w-12 mb-3" />
          <div className="flex flex-wrap gap-2 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-7 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-px w-full my-6" />
          <div className="space-y-4 max-w-sm">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  const levelInfo = gamification?.levelInfo || { level: 1, title: 'Beginner', xp: 0, xpForNext: 100, progress: 0 };
  const badges = gamification?.badgeDetails || [];
  const streak = gamification?.currentStreak || 0;
  const longestStreak = gamification?.longestStreak || 0;

  // Compute locked badges from allBadges
  const allBadgesMap = gamification?.allBadges || {};
  const totalBadgeCount = Object.keys(allBadgesMap).length;
  const earnedIds = new Set(badges.map((b) => b.id));
  const lockedBadges = Object.values(allBadgesMap).filter((b) => !earnedIds.has(b.id));
  const isGoogleUser = userData?.authProvider === 'google';
  const userImage = userData?.image || session?.user?.image || null;
  const displayName = userData?.name || session?.user?.name || 'User';

  return (
    <div className="max-w-4xl mx-auto space-y-8 relative">
      <RefreshShimmer active={revalidating} />

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            👤 Profile & <span className="gradient-text">Settings</span>
          </h1>
          <p className="text-muted-foreground mt-1">Manage your account, view achievements, and update settings.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleShareProfile} disabled={sharing} className="gap-1.5">
          <Share2 className="h-3.5 w-3.5" />
          {sharing ? 'Sharing...' : 'Share'}
        </Button>
      </div>

      {/* Share URL toast */}
      {shareUrl && (
        <Card className="p-4 flex items-center gap-3 border-primary/30 bg-primary/5">
          <Share2 className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm flex-1 truncate">{shareUrl}</span>
          <Button variant="outline" size="sm" onClick={handleCopyUrl} className="gap-1.5 shrink-0">
            {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </Card>
      )}

      {/* ─── Profile Card ─── */}
      <Card className="p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar with upload overlay */}
          <div className="relative group">
            <LevelRing progress={levelInfo.progress} size={96} strokeWidth={5}>
              <Avatar className="w-16 h-16 rounded-2xl border-2 border-background">
                {userImage ? <AvatarImage src={userImage} alt={displayName} className="object-cover" /> : null}
                <AvatarFallback className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl font-bold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </LevelRing>

            {/* Camera overlay */}
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className={cn(
                'absolute inset-0 flex items-center justify-center rounded-full transition-colors cursor-pointer group/avatar-btn',
                uploadingAvatar
                  ? 'bg-black/40'
                  : 'bg-black/0 group-hover:bg-black/40 focus-visible:bg-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
              )}
              aria-label="Change profile photo"
            >
              {uploadingAvatar ? (
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              ) : (
                <Camera className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 group-focus-visible/avatar-btn:opacity-100 transition-opacity" />
              )}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleAvatarSelect}
              className="hidden"
              aria-hidden="true"
            />
            {/* Remove photo button */}
            {userImage && !isGoogleUser && !uploadingAvatar && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/80 transition-colors shadow-sm"
                aria-label="Remove profile photo"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex-1 w-full text-center sm:text-left">
            {editingProfile ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => {
                      setEditName(e.target.value);
                      setNameEdited(true);
                    }}
                    placeholder="Your name"
                    className="max-w-xs"
                    aria-label="Display name"
                    autoFocus
                  />
                  <Button
                    onClick={handleSaveName}
                    disabled={saving || editName.trim() === userData?.name}
                    size="icon"
                    className="h-9 w-9"
                  >
                    {saving ? <Skeleton className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => {
                      setEditingProfile(false);
                      setEditName(userData?.name || '');
                      setNameEdited(false);
                      setMessage(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {message && (
                  <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="max-w-xs">
                    <AlertDescription className={cn('text-sm', message.type === 'success' && 'text-success')}>
                      {message.text}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h2 className="text-xl font-bold">{displayName}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setEditingProfile(true)}
                  aria-label="Edit name"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-2 justify-center sm:justify-start">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {userData?.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Joined{' '}
                {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" /> {isGoogleUser ? 'Google Sign-In' : 'Email & Password'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* ─── Achievements ─── */}
      <Card className="p-6 md:p-8">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
          <Trophy className="h-5 w-5 text-amber-400" /> Achievements
        </h2>

        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <AchievementCard
            className="bg-primary/5 border border-primary/10"
            value={levelInfo.level}
            label={levelInfo.title}
            subValue={levelInfo.xp}
            subSuffix=" XP"
            valueClass="gradient-text"
            prefix="Lv."
          />
          <AchievementCard
            className="bg-orange-500/5 border border-orange-500/10"
            value={streak}
            label="Current Streak"
            subValue={longestStreak}
            subPrefix="Best: "
            subSuffix=" days"
            valueClass="text-orange-400"
            prefix="🔥 "
          />
          <AchievementCard
            className="bg-emerald-500/5 border border-emerald-500/10"
            value={badges.length}
            label="Badges Earned"
            sub="Keep going!"
            valueClass="text-emerald-400"
          />
        </div>

        {/* XP Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Level {levelInfo.level} — {levelInfo.title}
            </span>
            {levelInfo.nextLevel && (
              <span className="text-muted-foreground">
                {xpForNextCount} XP to Level {levelInfo.level + 1}
              </span>
            )}
          </div>
          <div
            className="h-3 w-full rounded-full bg-muted/30 overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(levelInfo.progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`XP progress: ${Math.round(levelInfo.progress)}% to next level`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
              style={{ width: `${levelInfo.progress}%` }}
            />
          </div>
        </div>

        <Separator className="my-6" />

        {/* Earned Badges Grid */}
        <h3 className="font-semibold mb-3">
          🏅 Badges ({badges.length}/{totalBadgeCount})
        </h3>
        {badges.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className="p-3 rounded-xl bg-secondary/30 border border-border/50 text-center hover:bg-secondary/50 transition-colors"
              >
                <div className="text-2xl mb-1">{badge.emoji}</div>
                <div className="text-xs font-semibold">{badge.name}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{badge.description}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Complete activities to earn badges! Your first badge is just one exam away.
          </p>
        )}

        {/* Locked Badges */}
        {lockedBadges.length > 0 && (
          <>
            <Separator className="my-5" />
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
              <Lock className="h-3.5 w-3.5" /> Locked ({lockedBadges.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {lockedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="p-3 rounded-xl bg-muted/20 border border-border/30 text-center opacity-50 grayscale hover:opacity-70 hover:grayscale-[0.5] transition-all duration-200"
                  aria-disabled="true"
                  aria-label={`${badge.name} — locked: ${badge.description}`}
                >
                  <div className="text-2xl mb-1">{badge.emoji}</div>
                  <div className="text-xs font-semibold text-muted-foreground">{badge.name}</div>
                  <div className="text-[10px] text-muted-foreground/70 mt-0.5">{badge.description}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Stats */}
        <Separator className="my-6" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCounter emoji="📝" target={gamification?.totalExams || 0} label="Exams" />
          <StatCounter emoji="💻" target={gamification?.totalCoding || 0} label="Coding" />
          <StatCounter emoji="🎤" target={gamification?.totalInterviews || 0} label="Interviews" />
          <StatCounter emoji="🎯" target={gamification?.bestScore || 0} label="Best Score" suffix="%" />
        </div>
      </Card>

      {/* ─── Settings Card ─── */}
      <Card className="p-6 md:p-8">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
          <Settings className="h-5 w-5" /> Settings
        </h2>

        {/* Theme */}
        <div className="mb-8">
          <Label className="text-sm font-semibold mb-3 block">Appearance</Label>
          <ThemePicker isSidebar />
        </div>

        <Separator className="my-6" />

        {/* Email Change */}
        <div className="mb-8">
          <Label className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Mail className="h-4 w-4" /> Email Address
          </Label>
          <p className="text-sm text-muted-foreground mb-3">
            Current: <span className="text-foreground font-medium">{userData?.email}</span>
          </p>
          <form onSubmit={handleEmailChange} className="flex items-end gap-2 max-w-md">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="new-email" className="text-xs">
                New Email
              </Label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new@email.com"
                required
                className="h-9"
              />
            </div>
            <Button type="submit" size="sm" disabled={changingEmail || !newEmail.trim()} className="h-9">
              {changingEmail ? 'Sending...' : 'Verify'}
            </Button>
          </form>
          {emailMessage && (
            <Alert variant={emailMessage.type === 'error' ? 'destructive' : 'default'} className="mt-2 max-w-md">
              <AlertDescription className={cn('text-sm', emailMessage.type === 'success' && 'text-success')}>
                {emailMessage.text}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Separator className="my-6" />

        {/* Password */}
        {!isGoogleUser ? (
          <div className="mb-8">
            <Label className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Lock className="h-4 w-4" /> Password
            </Label>
            <form onSubmit={handleChangePassword} className="space-y-3 max-w-sm">
              <div className="space-y-1.5">
                <Label htmlFor="current-password" className="text-xs">
                  Current Password
                </Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-password" className="text-xs">
                  New Password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" className="text-xs">
                  Confirm New Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="h-9"
                />
              </div>
              {passwordMessage && (
                <Alert variant={passwordMessage.type === 'error' ? 'destructive' : 'default'}>
                  <AlertDescription className={cn('text-sm', passwordMessage.type === 'success' && 'text-success')}>
                    {passwordMessage.text}
                  </AlertDescription>
                </Alert>
              )}
              <Button
                type="submit"
                disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                size="sm"
              >
                {changingPassword ? 'Changing...' : 'Change Password'}
              </Button>
            </form>
          </div>
        ) : (
          <div className="mb-8">
            <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Lock className="h-4 w-4" /> Password
            </Label>
            <p className="text-muted-foreground text-sm mt-2">
              Your account uses Google Sign-In. Password changes are managed through your Google account settings.
            </p>
          </div>
        )}

        <Separator className="my-6" />

        {/* Danger Zone */}
        <div>
          <Label className="text-sm font-semibold text-destructive mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Danger Zone
          </Label>
          <p className="text-sm text-muted-foreground mb-3">
            Once you delete your account, there is no going back. All your data will be permanently removed.
          </p>
          <ConfirmDialog
            trigger={
              <Button variant="destructive" size="sm" className="gap-1.5">
                <Trash2 className="h-3.5 w-3.5" /> Delete Account
              </Button>
            }
            title="Delete Your Account"
            description={
              isGoogleUser
                ? 'Are you sure you want to delete your account? This action cannot be undone.'
                : 'Are you sure you want to delete your account? This action cannot be undone. Please enter your password to confirm.'
            }
            confirmLabel="Delete Account"
            destructive
            loading={deleting}
            onConfirm={handleDeleteAccount}
          >
            {!isGoogleUser && (
              <div className="mt-4 max-w-xs">
                <Label htmlFor="delete-password" className="text-xs">
                  Confirm your password
                </Label>
                <Input
                  id="delete-password"
                  type="password"
                  placeholder="Enter your password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="h-9 mt-1.5"
                  autoFocus
                />
              </div>
            )}
          </ConfirmDialog>
        </div>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-2xl font-bold">
              👤 Profile & <span className="gradient-text">Settings</span>
            </h1>
            <p className="text-muted-foreground mt-1">Loading...</p>
          </div>
        </div>
      }
    >
      <ProfilePageInner />
    </Suspense>
  );
}
