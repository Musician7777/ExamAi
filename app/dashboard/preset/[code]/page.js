'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

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
    const storageKey =
      preset.presetType === 'exam'
        ? 'examai_exam_presets'
        : preset.presetType === 'interview'
          ? 'examai_interview_presets'
          : 'examai_coding_presets';
    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
    existing.push({
      id: `shared_${params.code}`,
      ...preset.config,
      name: preset.title,
      emoji: preset.emoji,
      desc: preset.description,
    });
    localStorage.setItem(storageKey, JSON.stringify(existing));
    setSaved(true);
  }

  function handleUseNow() {
    handleSave();
    const targetPage =
      preset.presetType === 'exam'
        ? '/dashboard/generate'
        : preset.presetType === 'interview'
          ? '/dashboard/interview'
          : '/dashboard/coding';
    router.push(targetPage);
  }

  if (loading)
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <Card className="p-8 sm:p-10 border-border bg-card shadow-sm space-y-8">
          <div className="flex items-start gap-4 sm:gap-6">
            <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-6 w-24 rounded-md" />
            <Skeleton className="h-6 w-28 rounded-md" />
          </div>

          <div className="space-y-4 pt-4 border-t">
            <Skeleton className="h-6 w-28" />
            <div className="grid sm:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-4 bg-secondary/30 rounded-xl border border-secondary/50"
                >
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t mt-8">
            <Skeleton className="h-14 flex-1 rounded-md" />
            <Skeleton className="h-14 flex-1 rounded-md" />
          </div>
        </Card>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <span className="text-5xl">😔</span>
        <h2 className="text-2xl font-bold text-foreground">Preset Not Found</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button asChild variant="outline">
          <Link href="/dashboard">← Back to Dashboard</Link>
        </Button>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Card className="p-8 sm:p-10 border-border bg-card shadow-sm space-y-8">
        <div className="flex items-start gap-4 sm:gap-6">
          <span className="text-5xl sm:text-6xl bg-secondary/50 p-4 rounded-2xl">{preset.emoji || '📄'}</span>
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">{preset.title}</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">{preset.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary" className="px-3 py-1 font-medium text-sm capitalize">
            {preset.presetType}
          </Badge>
          <Badge variant="outline" className="px-3 py-1 font-medium text-sm text-muted-foreground border-muted">
            Used {preset.useCount} times
          </Badge>
          <Badge variant="outline" className="px-3 py-1 font-medium text-sm text-muted-foreground border-muted">
            Created {new Date(preset.createdAt).toLocaleDateString()}
          </Badge>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-xl font-semibold tracking-tight">Configuration</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {Object.entries(preset.config || {}).map(([key, value]) => (
              <div
                key={key}
                className="flex justify-between items-center p-4 bg-secondary/30 rounded-xl border border-secondary/50"
              >
                <span className="font-medium text-muted-foreground capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="font-semibold text-foreground text-right max-w-[150px] truncate">
                  {Array.isArray(value) ? value.join(', ') : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t mt-8">
          <Button size="lg" className="flex-1 text-base font-semibold h-14" onClick={handleUseNow}>
            🚀 Use Now
          </Button>
          <Button
            variant={saved ? 'secondary' : 'outline'}
            size="lg"
            className="flex-1 text-base font-semibold h-14"
            onClick={handleSave}
            disabled={saved}
          >
            {saved ? '✅ Saved to Library' : '💾 Save to Library'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
