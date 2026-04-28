'use client';
import { useState, useEffect, useCallback } from 'react';
import { Map, Loader2 } from 'lucide-react';
import { useCachedFetch } from '@/hooks/useCachedFetch';
import { secureFetch } from '@/lib/client-csrf';
import { cn } from '@/lib/utils';
import PathwayWizard from './components/PathwayWizard';
import PathwayOverview from './components/PathwayOverview';
import StageCards from './components/StageCards';
import SubjectCards from './components/SubjectCards';
import PathwayCalendar from './components/PathwayCalendar';
import PathwayGraph from './components/PathwayGraph';
import { useTaskRouter } from './components/TaskRouter';

export default function PathwayPage() {
  const { startTask } = useTaskRouter();

  const [mode, setMode] = useState('loading');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [pathway, setPathway] = useState(null);
  const [stageFilter, setStageFilter] = useState(null);
  const [subjectFilter, setSubjectFilter] = useState(null);
  const [activeTab, setActiveTab] = useState('calendar');

  const { data, loading: fetchLoading } = useCachedFetch('/api/pathway', {
    ttl: 30_000,
    selector: (json) => json.pathway,
  });

  useEffect(() => {
    if (fetchLoading) return;
    if (data) {
      setPathway(data);
      setMode('view');
    } else {
      setMode('wizard');
    }
  }, [data, fetchLoading]);

  const handleGenerate = useCallback(async (formData) => {
    setGenerating(true);
    setError(null);
    try {
      const res = await secureFetch('/api/pathway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to generate test plan');
      setPathway(result.pathway);
      setMode('view');
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }, []);

  // Launch a test directly — mark in_progress then navigate
  const handleLaunchTest = useCallback(
    async (task) => {
      // Mark the task as in_progress (non-blocking)
      try {
        const res = await secureFetch('/api/pathway', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update_task', taskId: task._id, status: 'in_progress' }),
        });
        const result = await res.json();
        if (res.ok && result.pathway) setPathway(result.pathway);
      } catch {
        /* non-blocking */
      }

      // Navigate to the test
      startTask(task);
    },
    [startTask]
  );

  // Update task status (complete/skip from detail panel)
  const handleTaskAction = useCallback(async (task, action) => {
    const statusMap = { complete: 'completed', skip: 'skipped' };
    const newStatus = statusMap[action] || action;

    try {
      const res = await secureFetch('/api/pathway', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_task', taskId: task._id, status: newStatus }),
      });
      const result = await res.json();
      if (res.ok && result.pathway) setPathway(result.pathway);
    } catch {
      /* non-blocking */
    }
  }, []);

  const handleEdit = () => setMode('wizard');

  const handleRegenerate = useCallback(async () => {
    setMode('wizard');
    try {
      await secureFetch('/api/pathway', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      /* non-blocking */
    }
    setPathway(null);
  }, []);

  if (mode === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
        <p className="text-sm text-muted-foreground">Loading your test plan...</p>
      </div>
    );
  }

  if (mode === 'wizard') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Map className="h-6 w-6 text-indigo-400" />
            Generate <span className="gradient-text">Pathway</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Tell us about your exam. Our AI will create a personalized test practice schedule with easy, medium, hard,
            and mock tests.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            {error}
          </div>
        )}

        <PathwayWizard onGenerate={handleGenerate} loading={generating} />

        {generating && (
          <div
            className="flex flex-col items-center justify-center py-12 gap-4"
            style={{ animation: 'fadeIn 0.3s ease-out' }}
          >
            <div className="relative">
              <Loader2 className="h-12 w-12 text-indigo-500 animate-spin" />
            </div>
            <p className="text-lg font-semibold">Generating your test plan...</p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Analyzing exam structure, mapping subjects, setting difficulty progression, and building your practice
              test calendar.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PathwayOverview pathway={pathway} onEdit={handleEdit} onRegenerate={handleRegenerate} />

      <StageCards
        stages={pathway.stages}
        schedule={pathway.schedule}
        onStageClick={(stage) => setStageFilter(stageFilter === stage?.name ? null : stage?.name)}
      />

      <SubjectCards
        subjects={pathway.subjects}
        onSubjectClick={(name) => setSubjectFilter(name)}
        activeSubject={subjectFilter}
      />

      <div className="flex gap-1 bg-secondary/50 rounded-lg p-0.5 w-fit">
        <button
          onClick={() => setActiveTab('calendar')}
          className={cn(
            'px-4 py-1.5 rounded-md text-xs font-medium transition-all',
            activeTab === 'calendar'
              ? 'bg-indigo-500/15 text-indigo-400'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          📅 Calendar
        </button>
        <button
          onClick={() => setActiveTab('graph')}
          className={cn(
            'px-4 py-1.5 rounded-md text-xs font-medium transition-all',
            activeTab === 'graph' ? 'bg-indigo-500/15 text-indigo-400' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          🗺️ Graph
        </button>
      </div>

      {activeTab === 'calendar' && (
        <PathwayCalendar
          schedule={pathway.schedule}
          onTaskAction={handleTaskAction}
          onLaunchTest={handleLaunchTest}
          stageFilter={stageFilter}
          subjectFilter={subjectFilter}
        />
      )}

      {activeTab === 'graph' && (
        <PathwayGraph stages={pathway.stages} subjects={pathway.subjects} schedule={pathway.schedule} />
      )}
    </div>
  );
}
