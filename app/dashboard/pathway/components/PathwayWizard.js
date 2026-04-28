'use client';
import { useState, useCallback } from 'react';
import {
  Target,
  BookOpen,
  Clock,
  BarChart3,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Plus,
  X,
  Check,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { inferExamStructure } from '@/lib/pathwayEngine';

const STEPS = [
  { id: 'goal', label: 'Goal & Exam', icon: Target, emoji: '🎯' },
  { id: 'structure', label: 'Structure', icon: BookOpen, emoji: '📋' },
  { id: 'subjects', label: 'Subjects', icon: BarChart3, emoji: '📚' },
  { id: 'schedule', label: 'Schedule', icon: Clock, emoji: '⏰' },
  { id: 'preferences', label: 'Test Config', icon: Sparkles, emoji: '⚙️' },
];

const GOAL_TYPES = [
  { id: 'competitive-exam', emoji: '🏆', label: 'Competitive Exam', desc: 'UPSC, SSC, Banking, GATE' },
  { id: 'school-college', emoji: '🎓', label: 'School / College', desc: 'Board exams, semester exams' },
  { id: 'interview-preparation', emoji: '🎤', label: 'Interview Prep', desc: 'Technical & HR interviews' },
  { id: 'coding-interview', emoji: '💻', label: 'Coding Interview', desc: 'DSA, system design' },
  { id: 'custom', emoji: '⚙️', label: 'Custom', desc: 'Define your own exam' },
];

const STAGE_SUGGESTIONS = [
  'Prelims',
  'Mains',
  'Interview',
  'Written Test',
  'Technical Round',
  'Aptitude Round',
  'Coding Round',
  'Group Discussion',
  'Practical Test',
];

const QUESTION_FORMATS = [
  'MCQ',
  'Numerical type',
  'Short answer',
  'Long answer',
  'Coding problem',
  'Mixed format',
  'Interview-style questions',
  'Essay',
];

const CURRENT_LEVELS = [
  { id: 'beginner', emoji: '🌱', label: 'Beginner', desc: 'Starting preparation' },
  { id: 'intermediate', emoji: '📈', label: 'Intermediate', desc: 'Some practice done' },
  { id: 'advanced', emoji: '🔥', label: 'Advanced', desc: 'Strong foundation' },
  { id: 'practicing', emoji: '🏋️', label: 'Practicing', desc: 'Regular test practice' },
  { id: 'mock-ready', emoji: '🎯', label: 'Mock Ready', desc: 'Final exam prep' },
];

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function PathwayWizard({ onGenerate, loading }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    goalType: '',
    examName: '',
    stages: [],
    subjects: [],
    questionTypes: [],
    totalDuration: 30,
    dailyAvailability: 2,
    preferredDays: [...DAYS_OF_WEEK],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    currentLevel: 'beginner',
    testPreferences: { easyTests: 25, mediumTests: 35, hardTests: 20, mockTests: 20 },
    constraints: [],
  });

  const [newStage, setNewStage] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newConstraint, setNewConstraint] = useState('');

  const update = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleExamNameChange = useCallback(
    (name) => {
      update('examName', name);
      if (name.length >= 3) {
        const inferred = inferExamStructure(name);
        if (inferred) {
          if (form.stages.length === 0 && inferred.stages) {
            update(
              'stages',
              inferred.stages.map((s) => ({
                name: s.name,
                objective: s.objective || '',
                practiceFocus: s.practiceFocus || [],
              }))
            );
          }
          if (form.subjects.length === 0 && inferred.subjects) {
            update(
              'subjects',
              inferred.subjects.map((s) =>
                typeof s === 'string'
                  ? { name: s, strengthLevel: 'average' }
                  : { name: s.name, strengthLevel: 'average' }
              )
            );
          }
          if (form.questionTypes.length === 0 && inferred.questionTypes) {
            update('questionTypes', inferred.questionTypes);
          }
        }
      }
    },
    [form.stages.length, form.subjects.length, form.questionTypes.length, update]
  );

  const addStage = () => {
    if (newStage.trim()) {
      update('stages', [...form.stages, { name: newStage.trim(), objective: '', practiceFocus: [] }]);
      setNewStage('');
    }
  };
  const removeStage = (idx) =>
    update(
      'stages',
      form.stages.filter((_, i) => i !== idx)
    );

  const addSubject = () => {
    if (newSubject.trim()) {
      update('subjects', [...form.subjects, { name: newSubject.trim(), strengthLevel: 'average' }]);
      setNewSubject('');
    }
  };
  const removeSubject = (idx) =>
    update(
      'subjects',
      form.subjects.filter((_, i) => i !== idx)
    );

  const setSubjectStrength = (idx, strength) => {
    const updated = [...form.subjects];
    updated[idx] = { ...updated[idx], strengthLevel: strength };
    update('subjects', updated);
  };

  const toggleQuestionType = (type) => {
    const types = form.questionTypes.includes(type)
      ? form.questionTypes.filter((t) => t !== type)
      : [...form.questionTypes, type];
    update('questionTypes', types);
  };

  const toggleDay = (day) => {
    const days = form.preferredDays.includes(day)
      ? form.preferredDays.filter((d) => d !== day)
      : [...form.preferredDays, day];
    update('preferredDays', days);
  };

  const addConstraint = () => {
    if (newConstraint.trim()) {
      update('constraints', [...form.constraints, newConstraint.trim()]);
      setNewConstraint('');
    }
  };

  const canProceed = () => {
    if (step === 0) return form.goalType && form.examName.trim().length >= 2;
    return true;
  };

  const handleSubmit = () => {
    onGenerate({ ...form, regenerate: true });
  };

  return (
    <div className="space-y-6" style={{ animation: 'fadeInUp 0.4s ease-out' }}>
      {/* Progress bar */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          const isActive = idx === step;
          const isCompleted = idx < step;
          return (
            <button
              key={s.id}
              onClick={() => idx <= step && setStep(idx)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all flex-1 justify-center',
                isActive && 'bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/30',
                isCompleted && 'bg-emerald-500/10 text-emerald-400 cursor-pointer',
                !isActive && !isCompleted && 'text-muted-foreground bg-secondary/30'
              )}
              disabled={idx > step}
            >
              {isCompleted ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Step content */}
      <Card className="p-6" style={{ animation: 'fadeIn 0.3s ease-out' }}>
        {/* ═══ STEP 0: Goal & Exam ═══ */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">🎯 What exam are you preparing for?</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Select your goal and name the exam. We&apos;ll generate a test practice schedule.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {GOAL_TYPES.map((g) => (
                <button
                  key={g.id}
                  onClick={() => update('goalType', g.id)}
                  className={cn(
                    'p-4 rounded-xl border text-left transition-all hover:shadow-md',
                    form.goalType === g.id
                      ? 'border-indigo-500/50 bg-indigo-500/5 ring-1 ring-indigo-500/30'
                      : 'border-border hover:border-indigo-500/20'
                  )}
                >
                  <span className="text-2xl">{g.emoji}</span>
                  <h4 className="text-sm font-semibold mt-2">{g.label}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{g.desc}</p>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Exam Name</Label>
              <Input
                placeholder="e.g. UPSC, Bank PO, Google Interview, IELTS..."
                value={form.examName}
                onChange={(e) => handleExamNameChange(e.target.value)}
                className="text-base"
              />
              {form.examName.length >= 3 && inferExamStructure(form.examName) && (
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Recognized! We&apos;ll auto-fill structure for you.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ═══ STEP 1: Structure ═══ */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">📋 Exam Structure</h2>
              <p className="text-sm text-muted-foreground mt-1">Define the stages and question formats of your exam.</p>
            </div>

            <div className="space-y-3">
              <Label>Exam Stages</Label>
              <div className="flex flex-wrap gap-2">
                {form.stages.map((stage, idx) => (
                  <Badge key={idx} variant="secondary" className="px-3 py-1.5 text-sm gap-1.5">
                    {stage.name}
                    <button onClick={() => removeStage(idx)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a stage..."
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addStage()}
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={addStage}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {STAGE_SUGGESTIONS.filter((s) => !form.stages.some((st) => st.name === s))
                  .slice(0, 8)
                  .map((s) => (
                    <button
                      key={s}
                      onClick={() => update('stages', [...form.stages, { name: s, objective: '', practiceFocus: [] }])}
                      className="text-xs px-2.5 py-1 rounded-full bg-secondary/50 text-muted-foreground hover:bg-indigo-500/10 hover:text-indigo-400 transition-colors"
                    >
                      + {s}
                    </button>
                  ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Question Formats</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {QUESTION_FORMATS.map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleQuestionType(type)}
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm font-medium transition-all border',
                      form.questionTypes.includes(type)
                        ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
                        : 'border-border text-muted-foreground hover:border-indigo-500/20'
                    )}
                  >
                    {form.questionTypes.includes(type) && <Check className="h-3 w-3 inline mr-1" />}
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 2: Subjects ═══ */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">📚 Subjects & Strength</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Add subjects and mark your strength. Weak subjects get more practice tests.
              </p>
            </div>

            <div className="space-y-3">
              {form.subjects.map((subject, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
                  <span className="font-medium text-sm flex-1">{subject.name}</span>
                  <div className="flex gap-1.5">
                    {['weak', 'average', 'strong'].map((level) => (
                      <button
                        key={level}
                        onClick={() => setSubjectStrength(idx, level)}
                        className={cn(
                          'px-2.5 py-1 rounded-md text-xs font-medium transition-all capitalize',
                          subject.strengthLevel === level
                            ? level === 'weak'
                              ? 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30'
                              : level === 'average'
                                ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30'
                            : 'text-muted-foreground hover:bg-secondary'
                        )}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => removeSubject(idx)} className="text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}

              <div className="flex gap-2">
                <Input
                  placeholder="Add a subject..."
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSubject()}
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={addSubject}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 3: Schedule ═══ */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">⏰ Time & Schedule</h2>
              <p className="text-sm text-muted-foreground mt-1">
                How long is your preparation period and how many tests can you take per day?
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Duration (days)</Label>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={form.totalDuration}
                  onChange={(e) => update('totalDuration', parseInt(e.target.value) || 30)}
                />
              </div>
              <div className="space-y-2">
                <Label>Hours per Day for Tests</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[form.dailyAvailability]}
                    onValueChange={([v]) => update('dailyAvailability', v)}
                    min={0.5}
                    max={8}
                    step={0.5}
                    className="flex-1"
                  />
                  <span className="text-sm font-semibold w-12 text-right">{form.dailyAvailability}h</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Date (optional)</Label>
                <Input type="date" value={form.endDate} onChange={(e) => update('endDate', e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Practice Days</Label>
              <div className="flex gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={cn(
                      'w-10 h-10 rounded-lg text-xs font-semibold transition-all',
                      form.preferredDays.includes(day)
                        ? 'bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/30'
                        : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Notes (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {form.constraints.map((c, idx) => (
                  <Badge key={idx} variant="secondary" className="px-3 py-1.5 gap-1.5">
                    {c}
                    <button
                      onClick={() =>
                        update(
                          'constraints',
                          form.constraints.filter((_, i) => i !== idx)
                        )
                      }
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. focus on mocks near the end, more hard tests..."
                  value={newConstraint}
                  onChange={(e) => setNewConstraint(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addConstraint()}
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={addConstraint}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 4: Test Preferences ═══ */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">⚙️ Test Configuration</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Set your current level and test difficulty distribution.
              </p>
            </div>

            <div className="space-y-3">
              <Label>Current Level</Label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {CURRENT_LEVELS.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => update('currentLevel', level.id)}
                    className={cn(
                      'p-3 rounded-xl border text-center transition-all',
                      form.currentLevel === level.id
                        ? 'border-indigo-500/50 bg-indigo-500/5 ring-1 ring-indigo-500/30'
                        : 'border-border hover:border-indigo-500/20'
                    )}
                  >
                    <span className="text-xl">{level.emoji}</span>
                    <p className="text-xs font-semibold mt-1">{level.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Label>Test Difficulty Mix</Label>
              {[
                { key: 'easyTests', label: 'Easy Tests', emoji: '🟢' },
                { key: 'mediumTests', label: 'Medium Tests', emoji: '🟡' },
                { key: 'hardTests', label: 'Hard Tests', emoji: '🔴' },
                { key: 'mockTests', label: 'Full Mock Tests', emoji: '📝' },
              ].map((pref) => (
                <div key={pref.key} className="flex items-center gap-3">
                  <span className="text-sm w-8">{pref.emoji}</span>
                  <span className="text-sm font-medium w-36">{pref.label}</span>
                  <Slider
                    value={[form.testPreferences[pref.key]]}
                    onValueChange={([v]) => update('testPreferences', { ...form.testPreferences, [pref.key]: v })}
                    min={0}
                    max={50}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-xs font-semibold text-muted-foreground w-10 text-right">
                    {form.testPreferences[pref.key]}%
                  </span>
                </div>
              ))}
            </div>

            {/* Summary card */}
            <Card className="p-4 bg-indigo-500/5 border-indigo-500/20">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">📊 Test Plan Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between p-2 rounded-md bg-secondary/50">
                  <span className="text-muted-foreground">Exam</span>
                  <span className="font-medium">{form.examName || '—'}</span>
                </div>
                <div className="flex justify-between p-2 rounded-md bg-secondary/50">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{form.totalDuration} days</span>
                </div>
                <div className="flex justify-between p-2 rounded-md bg-secondary/50">
                  <span className="text-muted-foreground">Stages</span>
                  <span className="font-medium">{form.stages.length || 'Auto'}</span>
                </div>
                <div className="flex justify-between p-2 rounded-md bg-secondary/50">
                  <span className="text-muted-foreground">Subjects</span>
                  <span className="font-medium">{form.subjects.length || 'Auto'}</span>
                </div>
                <div className="flex justify-between p-2 rounded-md bg-secondary/50">
                  <span className="text-muted-foreground">Level</span>
                  <span className="font-medium capitalize">{form.currentLevel}</span>
                </div>
                <div className="flex justify-between p-2 rounded-md bg-secondary/50">
                  <span className="text-muted-foreground">Hours/day</span>
                  <span className="font-medium">{form.dailyAvailability}h</span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0} className="gap-2">
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <span className="text-xs text-muted-foreground">
          Step {step + 1} of {STEPS.length}
        </span>
        {step < STEPS.length - 1 ? (
          <Button variant="brand" onClick={() => setStep((s) => s + 1)} disabled={!canProceed()} className="gap-2">
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="brand" onClick={handleSubmit} disabled={loading || !canProceed()} className="gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Generate Test Plan
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
