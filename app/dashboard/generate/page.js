'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Play, Loader2 } from 'lucide-react';
import {
  FetchExamModal,
  FetchExamCard,
  AddPresetCard,
  SavedPresetCard,
  SavedPresetsSection,
} from '../../components/PresetManager/PresetManager';
import { useExamPresets, parseSectionsToSubjects, buildCustomStateFromConfig } from '@/hooks/useExamPresets';
import ExamConfigModal from '../../components/ExamConfigModal/ExamConfigModal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { secureFetch } from '@/lib/client-csrf';
import clientLogger from '@/lib/client-logger';
import { trackExamGenerate } from '@/lib/ga';
import { examProfiles } from '@/lib/prompts/examPrompts';
import SubjectManager from '@/app/components/SubjectManager/SubjectManager';

const governmentPresets = [
  { id: 'upsc', emoji: '🏛️', name: 'UPSC CSE', desc: 'Civil Services Prelims' },
  { id: 'ssc', emoji: '📋', name: 'SSC CGL', desc: 'Combined Graduate Level' },
  { id: 'banking', emoji: '🏦', name: 'Banking PO', desc: 'IBPS PO / SBI PO' },
  { id: 'railways', emoji: '🚂', name: 'Railways', desc: 'RRB NTPC' },
  { id: 'state-psc', emoji: '🗳️', name: 'State PSC', desc: 'State Level Exams' },
];

const privatePresets = [
  { id: 'software', emoji: '💻', name: 'Software Eng.', desc: 'Tech Company Hiring' },
  { id: 'product', emoji: '📦', name: 'Product Company', desc: 'Google, Amazon, etc.' },
  { id: 'startup', emoji: '🚀', name: 'Startup Hiring', desc: 'Fast-Paced Tests' },
  { id: 'campus', emoji: '🎓', name: 'Campus Placement', desc: 'College Placements' },
  { id: 'mba', emoji: '📊', name: 'MBA Entrance', desc: 'CAT / XAT / GMAT' },
];

export default function GeneratePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('preset');
  const [selectedPreset, setSelectedPreset] = useState(null);
  // Start in loading state immediately if pathway sent us a config — prevents UI flash
  const [loading, setLoading] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return !!sessionStorage.getItem('examConfigModalResult');
    } catch {
      return false;
    }
  });
  const [showFetchModal, setShowFetchModal] = useState(false);
  const [errorBanner, setErrorBanner] = useState(null); // { variant, title, message }
  const [lastGenerateConfig, setLastGenerateConfig] = useState(null);
  const [aiOverviewsEnabled, setAiOverviewsEnabled] = useState(true);

  // Shared preset handling hook
  const {
    fetchedConfig,
    savedPresets,
    handleUseFetchedConfig: onFetchedConfig,
    handleSelectSavedPreset: onSelectPreset,
    handleSavePreset,
    clearFetchedConfig,
    deletePreset,
  } = useExamPresets('examai_exam_presets', {
    featurePrefix: 'exam',
    onConfigLoaded: (config) => {
      // Populate subjects from fetched config sections
      const subjects = parseSectionsToSubjects(config.sections, config.totalQuestions);
      setCustomSubjects(subjects);
      setCustom(buildCustomStateFromConfig(config));
      setActiveTab('custom');
      setSelectedPreset(null);
    },
  });

  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [configModalPreset, setConfigModalPreset] = useState({ name: '', emoji: '' });
  const [configModalInitialConfig, setConfigModalInitialConfig] = useState({});

  // Define before useEffect so it's available (fixes immutability error)
  const handleGenerateFromModalRef = useRef(null);
  const selectedPresetRef = useRef(null);
  const runGenerateRef = useRef(null);

  // Pending auto-config from pathway sessionStorage — set after refs are ready
  const [pendingAutoConfig, setPendingAutoConfig] = useState(null);

  function openConfigForPreset(preset) {
    setSelectedPreset(preset.id);
    clearFetchedConfig();
    setConfigModalPreset({ name: preset.name, emoji: preset.emoji });
    // Auto-populate subjects from profile sections
    const profile = examProfiles[preset.id];
    const initialSubjects = profile
      ? profile.sections.map((name) => ({
          name,
          questionCount: Math.max(1, Math.floor(20 / profile.sections.length)),
          aiOverview: null,
        }))
      : [];
    setConfigModalInitialConfig({ subjects: initialSubjects });
    setConfigModalOpen(true);
  }

  // (runGenerate, validateExamConfig, and handleGenerateFromModal are defined below)

  // Step 1: Read sessionStorage on mount and stash config in state (ref not ready yet)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('examConfigModalResult');
      if (stored) {
        const { mode, config } = JSON.parse(stored);
        sessionStorage.removeItem('examConfigModalResult');
        /* eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: bootstrapping pending config from sessionStorage on mount */
        if (mode === 'exam' && config) setPendingAutoConfig(config);
      }
    } catch (e) {
      clientLogger.warn('Failed to read examConfigModalResult from sessionStorage:', e.message);
    }
  }, []);

  // Step 2: Fire auto-generate once the ref is assigned and we have a pending config
  useEffect(() => {
    if (pendingAutoConfig && handleGenerateFromModalRef.current) {
      const cfg = pendingAutoConfig;
      /* eslint-disable react-hooks/set-state-in-effect -- intentional: clearing pending config to prevent double-trigger */
      setPendingAutoConfig(null);
      /* eslint-enable react-hooks/set-state-in-effect */
      handleGenerateFromModalRef.current(cfg);
    }
  }, [pendingAutoConfig]);

  const [custom, setCustom] = useState({
    totalQuestions: 50,
    negativeMarking: 0.25,
    timeLimit: 120,
    easy: 30,
    medium: 50,
    hard: 20,
    questionType: 'MCQ',
  });
  const [customSubjects, setCustomSubjects] = useState([]);
  const [customExamName, setCustomExamName] = useState('Custom Exam');
  const [customExamEmoji, setCustomExamEmoji] = useState('📝');

  function validateExamConfig(config) {
    const totalQuestions =
      config?.subjects?.length > 0
        ? config.subjects.reduce((s, sub) => s + (Number(sub?.questionCount) || 0), 0)
        : Number(config?.totalQuestions);
    const timeLimit = Number.isFinite(Number(config?.timeLimit)) ? Number(config?.timeLimit) : 60;
    const negativeMarking = Number.isFinite(Number(config?.negativeMarking)) ? Number(config?.negativeMarking) : 0;
    if (!Number.isFinite(totalQuestions) || totalQuestions < 1) return 'Total questions must be at least 1.';
    if (!Number.isFinite(timeLimit) || timeLimit < 1) return 'Time limit must be at least 1 minute.';
    if (!Number.isFinite(negativeMarking) || negativeMarking < 0) return 'Negative marking must be 0 or higher.';
    return null;
  }

  const runGenerate = useCallback(
    async (config) => {
      const validationError = validateExamConfig(config);
      if (validationError) {
        setErrorBanner({ variant: 'warning', title: 'Check your settings', message: validationError });
        return;
      }
      setErrorBanner(null);
      setLastGenerateConfig(config);
      setLoading(true);
      try {
        const res = await secureFetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'generate-exam', config }),
        });
        const exam = await res.json();
        if (!res.ok || exam?.error) {
          const msg = exam?.isRateLimited
            ? 'All API keys are rate limited. Please wait 30-60 seconds and try again.'
            : exam?.isServiceUnavailable
              ? 'AI provider is temporarily unavailable. Please try again shortly.'
              : exam?.error || 'Failed to generate exam. Please try again.';
          setErrorBanner({
            variant: exam?.isRateLimited ? 'warning' : 'destructive',
            title: 'Generation failed',
            message: msg,
          });
          setLoading(false);
          return;
        }
        if (!exam.sections || exam.sections.length === 0) {
          setErrorBanner({
            variant: 'destructive',
            title: 'Generation failed',
            message: 'AI returned an invalid exam format. Please try again.',
          });
          setLoading(false);
          return;
        }
        sessionStorage.setItem('currentExam', JSON.stringify(exam));
        trackExamGenerate({
          examType: config.examType || 'Custom',
          questionCount: config.totalQuestions || 20,
          questionType: config.questionType || 'MCQ',
          difficulty: config.difficulty || 'Medium',
          hasSubjects: !!(config.subjects && config.subjects.length > 0),
          subjectCount: config.subjects?.length || 0,
          timeLimit: config.timeLimit || 60,
        });
        router.push('/dashboard/exam/live');
      } catch (e) {
        clientLogger.error('Error generating exam:', e);
        setErrorBanner({ variant: 'destructive', title: 'Network error', message: 'Please try again.' });
      }
      setLoading(false);
    },
    [router]
  );

  useEffect(() => {
    selectedPresetRef.current = selectedPreset;
  }, [selectedPreset]);

  useEffect(() => {
    runGenerateRef.current = runGenerate;
  }, [runGenerate]);

  useEffect(() => {
    handleGenerateFromModalRef.current = async (modalConfig) => {
      setConfigModalOpen(false);
      try {
        const config = {
          examType: modalConfig.examType || selectedPresetRef.current || 'Custom',
          totalQuestions: modalConfig.totalQuestions || modalConfig.questions || 20,
          difficulty: modalConfig.difficulty || 'Medium',
          questionType: modalConfig.questionType || modalConfig.questionTypes || 'MCQ',
          negativeMarking: modalConfig.negativeMarking ?? 0.25,
          timeLimit: modalConfig.timeLimit || modalConfig.time || 60,
        };
        if (modalConfig.subjects && modalConfig.subjects.length > 0) {
          config.subjects = modalConfig.subjects;
          config.sections = modalConfig.sections || modalConfig.subjects.map((s) => s.name);
          config.totalQuestions = modalConfig.subjects.reduce((s, sub) => s + sub.questionCount, 0);
        } else if (modalConfig.sections) {
          config.sections = modalConfig.sections;
        }
        await runGenerateRef.current?.(config);
      } catch (error) {
        clientLogger.error('Error generating exam:', error);
      }
    };
  }, []);

  function handleGenerateFromModal(modalConfig) {
    return handleGenerateFromModalRef.current?.(modalConfig);
  }

  // Wrappers to connect with FetchExamModal's expected prop names
  const handleUseFetchedConfig = (config) => {
    clearFetchedConfig();
    onFetchedConfig(config);
    setCustomExamName(config.examName || config.title || config.name || 'Custom Exam');
    setCustomExamEmoji(config.emoji || '📝');
  };

  const handleSelectSavedPreset = (preset) => {
    clearFetchedConfig();
    onSelectPreset(preset);
    // Also set selectedPreset for UI
    setSelectedPreset(preset.id);
    setActiveTab('custom');
  };

  const handleSavePresetWithFields = (config) => {
    handleSavePreset(config, {
      nameField: 'examName',
      emojiField: 'emoji',
      descField: 'description',
      totalQuestions: config.totalQuestions,
      sections: config.sections,
      negativeMarking: config.negativeMarking,
      timeLimit: config.timeLimit,
      marksPerQuestion: config.marksPerQuestion,
      questionType: config.questionType,
      topics: config.topics,
    });
  };

  const handleGenerate = async (examType) => {
    try {
      const config =
        activeTab === 'preset'
          ? {
              examType: examType || selectedPreset,
              totalQuestions: 20,
              difficulty: '30% Easy, 50% Medium, 20% Hard',
              timeLimit: 60,
              negativeMarking: 0,
              questionType: 'MCQ',
            }
          : (() => {
              const cfg = {
                examType: customExamName || fetchedConfig?.examName || 'Custom',
                totalQuestions:
                  customSubjects.length > 0
                    ? customSubjects.reduce((s, sub) => s + sub.questionCount, 0)
                    : custom.totalQuestions,
                negativeMarking: custom.negativeMarking,
                timeLimit: custom.timeLimit,
                difficulty: `${custom.easy}% Easy, ${custom.medium}% Medium, ${custom.hard}% Hard`,
                questionType: custom.questionType,
                emoji: customExamEmoji,
              };
              if (customSubjects.length > 0) {
                cfg.subjects = customSubjects.map((s) => ({ name: s.name, questionCount: s.questionCount }));
                cfg.sections = customSubjects.map((s) => s.name);
              } else {
                cfg.sections = ['General'];
              }
              return cfg;
            })();
      await runGenerate(config);
    } catch (error) {
      clientLogger.error('Error generating exam:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
        <p className="text-lg font-semibold">AI is generating your exam...</p>
        <p className="text-sm text-muted-foreground">
          Crafting questions, analyzing difficulty, structuring sections...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="h-6 w-6 text-indigo-400" /> Generate <span className="gradient-text">Exam</span>
        </h1>
        <p className="text-muted-foreground mt-1">Choose a preset exam type or build your own custom structure.</p>
      </div>

      {errorBanner && (
        <Alert variant={errorBanner.variant}>
          <AlertTitle>{errorBanner.title}</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{errorBanner.message}</span>
            {lastGenerateConfig && (
              <Button variant="outline" size="sm" onClick={() => runGenerate(lastGenerateConfig)}>
                Retry
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="preset" className="flex-1 sm:flex-initial">
            Preset Exams
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex-1 sm:flex-initial">
            Custom Builder
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preset" className="space-y-6 mt-6">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">🏛️ Government Exams</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {governmentPresets.map((p) => (
                <Card
                  key={p.id}
                  className={cn(
                    'p-5 flex flex-col items-center gap-2 text-center cursor-pointer transition-all hover:shadow-md',
                    selectedPreset === p.id
                      ? 'border-indigo-500/50 bg-indigo-500/5 ring-1 ring-indigo-500/30'
                      : 'hover:border-indigo-500/20'
                  )}
                  onClick={() => openConfigForPreset(p)}
                >
                  <span className="text-2xl">{p.emoji}</span>
                  <h4 className="text-sm font-semibold">{p.name}</h4>
                  <p className="text-xs text-muted-foreground">{p.desc}</p>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">💼 Private Hiring</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {privatePresets.map((p) => (
                <Card
                  key={p.id}
                  className={cn(
                    'p-5 flex flex-col items-center gap-2 text-center cursor-pointer transition-all hover:shadow-md',
                    selectedPreset === p.id
                      ? 'border-indigo-500/50 bg-indigo-500/5 ring-1 ring-indigo-500/30'
                      : 'hover:border-indigo-500/20'
                  )}
                  onClick={() => openConfigForPreset(p)}
                >
                  <span className="text-2xl">{p.emoji}</span>
                  <h4 className="text-sm font-semibold">{p.name}</h4>
                  <p className="text-xs text-muted-foreground">{p.desc}</p>
                </Card>
              ))}
              <FetchExamCard onClick={() => setShowFetchModal(true)} />
              <AddPresetCard
                onFetchClick={() => setShowFetchModal(true)}
                onCustomClick={() => setActiveTab('custom')}
              />
            </div>
          </div>

          <SavedPresetsSection count={savedPresets.length}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {savedPresets.map((p) => (
                <SavedPresetCard
                  key={p.id}
                  preset={p}
                  isSelected={selectedPreset === p.id}
                  onSelect={() => handleSelectSavedPreset(p)}
                  onDelete={deletePreset}
                />
              ))}
            </div>
          </SavedPresetsSection>

          <Button
            variant="brand"
            size="lg"
            disabled={!selectedPreset}
            onClick={() => handleGenerate(selectedPreset)}
            className="gap-2"
          >
            <Play className="h-4 w-4" /> Generate Exam
          </Button>
        </TabsContent>

        <TabsContent value="custom" className="mt-6">
          <Card className="p-6 space-y-6">
            {fetchedConfig && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                <span className="text-xl">{fetchedConfig.emoji || '📄'}</span>
                <strong>{fetchedConfig.examName || fetchedConfig.name || 'Fetched Config'}</strong>
                <span className="text-muted-foreground text-sm">— Modify as needed</span>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Exam Name</Label>
                <Input
                  value={customExamName}
                  onChange={(e) => setCustomExamName(e.target.value)}
                  placeholder="e.g. JEE Mock Test"
                />
              </div>
              <div className="space-y-2">
                <Label>Emoji</Label>
                <Input
                  value={customExamEmoji}
                  onChange={(e) => setCustomExamEmoji(e.target.value)}
                  placeholder="📝"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{customSubjects.length > 0 ? 'Total Questions (from subjects)' : 'Total Questions'}</Label>
                {customSubjects.length > 0 ? (
                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/50 border">
                    <span className="text-xl font-bold text-primary">
                      {customSubjects.reduce((s, sub) => s + sub.questionCount, 0)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      from {customSubjects.length} subject{customSubjects.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                ) : (
                  <Input
                    type="number"
                    value={custom.totalQuestions}
                    onChange={(e) => setCustom({ ...custom, totalQuestions: parseInt(e.target.value) || 0 })}
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>Time Limit (minutes)</Label>
                <Input
                  type="number"
                  value={custom.timeLimit}
                  onChange={(e) => setCustom({ ...custom, timeLimit: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Negative Marking</Label>
                <Input
                  type="number"
                  step="0.25"
                  value={custom.negativeMarking}
                  onChange={(e) => setCustom({ ...custom, negativeMarking: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Question Type</Label>
                <Select value={custom.questionType} onValueChange={(v) => setCustom({ ...custom, questionType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MCQ">MCQ (Multiple Choice)</SelectItem>
                    <SelectItem value="MSQ">MSQ (Multiple Select)</SelectItem>
                    <SelectItem value="NAT">NAT (Numerical Answer)</SelectItem>
                    <SelectItem value="Descriptive">Descriptive</SelectItem>
                    <SelectItem value="Mixed">Mixed (All Types)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2 space-y-3">
                <Label>Difficulty Distribution</Label>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-emerald-400">🟢 Easy: {custom.easy}%</span>
                  <span className="text-amber-400">🟡 Medium: {custom.medium}%</span>
                  <span className="text-red-400">🔴 Hard: {custom.hard}%</span>
                </div>
                <div className="flex h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 transition-all" style={{ width: `${custom.easy}%` }} />
                  <div className="bg-amber-500 transition-all" style={{ width: `${custom.medium}%` }} />
                  <div className="bg-red-500 transition-all" style={{ width: `${custom.hard}%` }} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { key: 'easy', label: 'Easy', others: ['medium', 'hard'] },
                    { key: 'medium', label: 'Medium', others: ['easy', 'hard'] },
                    { key: 'hard', label: 'Hard', others: ['easy', 'medium'] },
                  ].map(({ key, label, others }) => (
                    <div key={key}>
                      <label className="text-xs text-muted-foreground">{label}</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={custom[key]}
                        className="w-full accent-indigo-500"
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          const rem = 100 - val;
                          const othersTotal = custom[others[0]] + custom[others[1]] || 1;
                          const ratio = custom[others[0]] / othersTotal;
                          const v1 = Math.round(rem * ratio);
                          setCustom({
                            ...custom,
                            [key]: val,
                            [others[0]]: v1,
                            [others[1]]: rem - v1,
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Subject Management — uses SubjectManager component */}
            <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-secondary/30">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">AI subject overviews</p>
                <p className="text-xs text-muted-foreground">Shows typical weightage and suggested question counts.</p>
              </div>
              <Switch checked={aiOverviewsEnabled} onCheckedChange={setAiOverviewsEnabled} />
            </div>
            <SubjectManager
              subjects={customSubjects}
              onSubjectsChange={setCustomSubjects}
              examName={fetchedConfig?.examName || 'Custom Exam'}
              showAiOverviews={aiOverviewsEnabled}
            />

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between p-2 rounded-md bg-secondary/50">
                <span className="text-muted-foreground">Difficulty</span>
                <span className="font-medium">{`${custom.easy}% Easy, ${custom.medium}% Medium, ${custom.hard}% Hard`}</span>
              </div>
              <div className="flex justify-between p-2 rounded-md bg-secondary/50">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium">{custom.timeLimit} min</span>
              </div>
              <div className="flex justify-between p-2 rounded-md bg-secondary/50">
                <span className="text-muted-foreground">Questions</span>
                <span className="font-medium">
                  {customSubjects.length > 0
                    ? customSubjects.reduce((s, sub) => s + sub.questionCount, 0)
                    : custom.totalQuestions}
                </span>
              </div>
              <div className="flex justify-between p-2 rounded-md bg-secondary/50">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">{custom.questionType}</span>
              </div>
              {customSubjects.length > 0 && (
                <div className="flex justify-between p-2 rounded-md bg-secondary/50 col-span-2">
                  <span className="text-muted-foreground">Subjects</span>
                  <span className="font-medium">{customSubjects.map((s) => s.name).join(', ')}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={() =>
                  handleSavePresetWithFields({
                    examName: customExamName || 'Custom Exam',
                    emoji: customExamEmoji || '📝',
                    description: 'Custom exam preset',
                    totalQuestions:
                      customSubjects.length > 0
                        ? customSubjects.reduce((s, sub) => s + sub.questionCount, 0)
                        : custom.totalQuestions,
                    timeLimit: custom.timeLimit,
                    negativeMarking: custom.negativeMarking,
                    questionType: custom.questionType,
                    sections: customSubjects.length > 0 ? customSubjects.map((s) => s.name) : ['General'],
                  })
                }
                className="gap-2"
              >
                Save Preset
              </Button>
              <Button
                variant="brand"
                size="lg"
                onClick={() => handleGenerate(customExamName || fetchedConfig?.examName || 'Custom')}
                className="gap-2 flex-1"
                disabled={
                  !!validateExamConfig({
                    totalQuestions:
                      customSubjects.length > 0
                        ? customSubjects.reduce((s, sub) => s + sub.questionCount, 0)
                        : custom.totalQuestions,
                    timeLimit: custom.timeLimit,
                    negativeMarking: custom.negativeMarking,
                  })
                }
              >
                <Play className="h-4 w-4" /> Generate Custom Exam
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <FetchExamModal
        isOpen={showFetchModal}
        onClose={() => setShowFetchModal(false)}
        onUseConfig={handleUseFetchedConfig}
        onSavePreset={handleSavePresetWithFields}
        mode="exam"
      />
      <ExamConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        onGenerate={handleGenerateFromModal}
        mode="exam"
        presetName={configModalPreset.name}
        presetEmoji={configModalPreset.emoji}
        examType={selectedPreset || ''}
        initialConfig={configModalInitialConfig}
      />
    </div>
  );
}
