'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Trash2, Sparkles, Loader2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

/**
 * Reusable subject manager with per-subject question counts and AI overviews.
 *
 * @param {Object} props
 * @param {Array} props.subjects - Array of { name, questionCount, aiOverview }
 * @param {Function} props.onSubjectsChange - Callback when subjects array changes
 * @param {string} props.examName - Exam name for AI overview context
 * @param {boolean} props.showAiOverviews - Whether to fetch/display AI overviews (default true)
 * @param {boolean} props.compact - Compact mode with less spacing (default false)
 */
export default function SubjectManager({
  subjects,
  onSubjectsChange,
  examName = '',
  showAiOverviews = true,
  compact = false,
}) {
  const [newSubjectName, setNewSubjectName] = useState('');
  const [subjectLoading, setSubjectLoading] = useState({});
  const subjectFetchAttempted = useRef({});

  // Reset fetch tracking when subjects list changes significantly (e.g., modal reopen)
  useEffect(() => {
    // Mark current subjects as already attempted so we don't re-fetch
    subjects.forEach((s) => {
      if (s.aiOverview || subjectLoading[s.name]) {
        subjectFetchAttempted.current[s.name] = true;
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch AI overview for a subject
  const fetchSubjectOverview = useCallback(
    async (subjectName) => {
      if (!subjectName.trim() || !showAiOverviews) return null;
      setSubjectLoading((prev) => ({ ...prev, [subjectName]: true }));
      try {
        const res = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'fetch-subject-overview',
            config: { subjectName, examName: examName || 'General Exam' },
          }),
        });
        const data = await res.json();
        if (data && !data.error) {
          return {
            typicalQuestionCount: data.typicalQuestionCount || 5,
            questionTypes: data.questionTypes || ['MCQ'],
            weightage: data.weightage || 0,
            difficulty: data.difficulty || 'Medium',
            topics: data.topics || [],
            tips: data.tips || '',
          };
        }
      } catch (e) {
        // Silently fail — overview is optional
      }
      setSubjectLoading((prev) => ({ ...prev, [subjectName]: false }));
      return null;
    },
    [examName, showAiOverviews]
  );

  // Auto-fetch AI overviews for subjects that don't have one yet
  useEffect(() => {
    if (!showAiOverviews) return;
    const subjectsNeedingOverview = subjects.filter(
      (s) => !s.aiOverview && !subjectLoading[s.name] && !subjectFetchAttempted.current[s.name]
    );
    if (subjectsNeedingOverview.length === 0) return;

    let cancelled = false;
    subjectsNeedingOverview.forEach((subject) => {
      subjectFetchAttempted.current[subject.name] = true;
      setSubjectLoading((prev) => ({ ...prev, [subject.name]: true }));
      fetchSubjectOverview(subject.name).then((overview) => {
        if (cancelled) return;
        if (overview) {
          onSubjectsChange((prev) =>
            prev.map((s) =>
              s.name === subject.name
                ? { ...s, aiOverview: overview, questionCount: overview.typicalQuestionCount || s.questionCount }
                : s
            )
          );
        }
        setSubjectLoading((prev) => ({ ...prev, [subject.name]: false }));
      });
    });
    return () => {
      cancelled = true;
    };
    // onSubjectsChange is a stable setter reference, safe to omit from deps
  }, [subjects.length, showAiOverviews, fetchSubjectOverview]); // eslint-disable-line react-hooks/exhaustive-deps

  // Add a new subject
  async function handleAddSubject() {
    const name = newSubjectName.trim();
    if (!name || subjects.some((s) => s.name.toLowerCase() === name.toLowerCase())) return;

    // Mark as loading BEFORE adding, so auto-fetch useEffect skips it
    setSubjectLoading((prev) => ({ ...prev, [name]: true }));
    subjectFetchAttempted.current[name] = true;

    const newSubject = { name, questionCount: 5, aiOverview: null };
    onSubjectsChange((prev) => [...prev, newSubject]);
    setNewSubjectName('');

    // Fetch AI overview in background — use callback pattern to avoid stale snapshot race conditions
    const overview = await fetchSubjectOverview(name);
    if (overview) {
      onSubjectsChange((prev) =>
        prev.map((s) =>
          s.name === name
            ? { ...s, aiOverview: overview, questionCount: overview.typicalQuestionCount || s.questionCount }
            : s
        )
      );
    }
    setSubjectLoading((prev) => ({ ...prev, [name]: false }));
  }

  // Remove a subject
  function handleRemoveSubject(name) {
    // Clear fetch tracking so re-adding the same subject will re-fetch its overview
    delete subjectFetchAttempted.current[name];
    onSubjectsChange((prev) => prev.filter((s) => s.name !== name));
  }

  // Update question count for a subject
  function handleSubjectQuestionCount(name, count) {
    onSubjectsChange((prev) =>
      prev.map((s) => (s.name === name ? { ...s, questionCount: Math.max(1, parseInt(count) || 1) } : s))
    );
  }

  const totalFromSubjects = subjects.reduce((sum, s) => sum + (s.questionCount || 0), 0);

  return (
    <div className={cn('space-y-3', compact && 'space-y-2')}>
      <Separator />
      <div className="flex items-center justify-between">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          📚 Subjects & Question Distribution
        </Label>
        <Badge variant="outline" className="text-xs">
          {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        Add subjects and set how many questions you want from each.
        {showAiOverviews && ' AI will show typical question counts for your exam.'}
      </p>

      {/* Add subject input */}
      <div className="flex gap-2">
        <Input
          placeholder="Enter subject name (e.g., Physics, Data Structures...)"
          value={newSubjectName}
          onChange={(e) => setNewSubjectName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddSubject();
            }
          }}
          className="flex-1"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddSubject}
          disabled={!newSubjectName.trim()}
          className="gap-1.5 shrink-0"
        >
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      {/* Subject list */}
      {subjects.length > 0 && (
        <div className="space-y-2">
          {subjects.map((subject) => (
            <div
              key={subject.name}
              className={cn(
                'rounded-xl border border-border bg-secondary/30 p-4 space-y-3 transition-all',
                compact && 'p-3 space-y-2'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">{subject.name}</span>
                  {subjectLoading[subject.name] && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  )}
                  {subject.aiOverview && (
                    <Badge variant="outline" className="text-[10px] gap-1 px-1.5">
                      <Sparkles className="h-2.5 w-2.5 text-amber-400" /> AI
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveSubject(subject.name)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Question count for this subject */}
              <div className="flex items-center gap-3">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Questions:</Label>
                <div className="flex items-center gap-1">
                  {[3, 5, 10, 15, 20, 25, 30].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => handleSubjectQuestionCount(subject.name, n)}
                      className={cn(
                        'px-2 py-0.5 rounded text-xs font-medium border transition-all',
                        subject.questionCount === n
                          ? 'bg-primary/20 border-primary/50 text-primary'
                          : 'bg-background border-border text-muted-foreground hover:bg-secondary'
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={subject.questionCount}
                  onChange={(e) => handleSubjectQuestionCount(subject.name, e.target.value)}
                  className="w-16 h-7 text-xs text-center"
                />
              </div>

              {/* AI Overview */}
              {showAiOverviews && subject.aiOverview && (
                <div className="rounded-lg bg-indigo-500/5 border border-indigo-500/15 p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Sparkles className="h-3 w-3 text-amber-400" />
                    <span className="font-semibold text-indigo-300">AI Overview for {subject.name}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-1.5 rounded bg-background/50">
                      <div className="font-bold text-primary">{subject.aiOverview.typicalQuestionCount}</div>
                      <div className="text-muted-foreground">Typical Qs</div>
                    </div>
                    <div className="text-center p-1.5 rounded bg-background/50">
                      <div className="font-bold text-primary">{subject.aiOverview.weightage}%</div>
                      <div className="text-muted-foreground">Weightage</div>
                    </div>
                    <div className="text-center p-1.5 rounded bg-background/50">
                      <div className="font-bold text-primary">{subject.aiOverview.difficulty}</div>
                      <div className="text-muted-foreground">Difficulty</div>
                    </div>
                  </div>
                  {subject.aiOverview.questionTypes?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {subject.aiOverview.questionTypes.map((qt) => (
                        <Badge key={qt} variant="outline" className="text-[10px] px-1.5 py-0">
                          {qt}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {subject.aiOverview.topics?.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Key topics: </span>
                      {subject.aiOverview.topics.slice(0, 5).join(', ')}
                    </div>
                  )}
                  {subject.aiOverview.tips && (
                    <p className="text-xs text-muted-foreground italic">💡 {subject.aiOverview.tips}</p>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Total from subjects */}
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/50 border">
            <span className="text-lg font-bold text-primary">{totalFromSubjects}</span>
            <span className="text-sm text-muted-foreground">
              Total questions from {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
