'use client';
import { useState, useEffect } from 'react';
import {
  HiOutlineChatAlt2,
  HiOutlinePlay,
  HiOutlineMicrophone,
  HiOutlineVolumeUp,
  HiOutlineVolumeOff,
} from 'react-icons/hi';
import {
  FetchExamModal,
  FetchExamCard,
  AddPresetCard,
  SavedPresetCard,
  SavedPresetsSection,
  useSavedPresets,
} from '@/app/components/PresetManager/PresetManager';
import ExamConfigModal from '@/app/components/ExamConfigModal/ExamConfigModal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import clientLogger from '@/lib/client-logger';
import { trackFeatureUsed } from '@/lib/ga';

/* ─────────────────────────────────────────────
   INTERVIEW TEMPLATES (shared with main page)
   ───────────────────────────────────────────── */
export const interviewTemplates = [
  {
    id: 'technical',
    emoji: '💻',
    title: 'Technical Interview',
    desc: 'DSA, OS, DBMS, System Design',
    interviewType: 'technical',
    role: 'Software Engineer',
    topics: ['DSA', 'OS', 'DBMS', 'Networking', 'System Design'],
    difficulty: 'Medium',
    questionCount: 10,
    tone: 'Professional',
  },
  {
    id: 'hr',
    emoji: '🤝',
    title: 'HR / Behavioral',
    desc: 'Behavioral, Communication, Goals',
    interviewType: 'hr',
    role: 'General Candidate',
    topics: ['Behavioral', 'Communication', 'Salary Negotiation', 'Teamwork', 'Leadership'],
    difficulty: 'Medium',
    questionCount: 10,
    tone: 'Friendly',
  },
  {
    id: 'government',
    emoji: '🏛️',
    title: 'Personality Test',
    desc: 'Ethics, Current Affairs, DAF',
    interviewType: 'government',
    role: 'Civil Services Candidate',
    topics: ['Ethics', 'Current Affairs', 'DAF', 'Opinion', 'Governance'],
    difficulty: 'Hard',
    questionCount: 10,
    tone: 'Formal',
  },
  {
    id: 'frontend',
    emoji: '🎨',
    title: 'Frontend Developer',
    desc: 'React, CSS, Performance, a11y',
    interviewType: 'technical',
    role: 'Frontend Developer',
    topics: ['React', 'JavaScript', 'CSS', 'Web Performance', 'Accessibility', 'TypeScript'],
    difficulty: 'Medium',
    questionCount: 10,
    tone: 'Professional',
  },
  {
    id: 'cloud',
    emoji: '☁️',
    title: 'Cloud & DevOps',
    desc: 'AWS, Docker, CI/CD, K8s',
    interviewType: 'technical',
    role: 'DevOps Engineer',
    topics: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Linux', 'Terraform'],
    difficulty: 'Medium',
    questionCount: 10,
    tone: 'Professional',
  },
  {
    id: 'datascience',
    emoji: '📊',
    title: 'Data Science / ML',
    desc: 'ML, Statistics, Python, Models',
    interviewType: 'technical',
    role: 'Data Scientist',
    topics: ['Machine Learning', 'Statistics', 'Python', 'Deep Learning', 'NLP', 'Data Analysis'],
    difficulty: 'Medium',
    questionCount: 10,
    tone: 'Professional',
  },
  {
    id: 'consulting',
    emoji: '🏢',
    title: 'Management Consulting',
    desc: 'Case Studies, Frameworks, Strategy',
    interviewType: 'hr',
    role: 'Management Consultant',
    topics: ['Case Studies', 'Market Sizing', 'Business Strategy', 'Problem Solving', 'Communication'],
    difficulty: 'Hard',
    questionCount: 10,
    tone: 'Challenging',
  },
  {
    id: 'campus',
    emoji: '🎓',
    title: 'Campus Placement',
    desc: 'Aptitude, CS Basics, HR',
    interviewType: 'technical',
    role: 'Fresh Graduate',
    topics: ['OOP', 'Basic DSA', 'DBMS Basics', 'OS Basics', 'HR Questions'],
    difficulty: 'Easy',
    questionCount: 10,
    tone: 'Friendly',
  },
];

export const customTopicOptions = [
  'DSA',
  'System Design',
  'OOP',
  'DBMS',
  'OS',
  'Networking',
  'React',
  'JavaScript',
  'TypeScript',
  'Node.js',
  'Python',
  'Java',
  'AWS',
  'Docker',
  'Kubernetes',
  'CI/CD',
  'Git',
  'Machine Learning',
  'Deep Learning',
  'Statistics',
  'NLP',
  'Behavioral',
  'Leadership',
  'Teamwork',
  'Communication',
  'SQL',
  'MongoDB',
  'Redis',
  'GraphQL',
  'REST API',
  'Web Security',
  'Performance',
  'Testing',
  'Agile',
];

/* ─────────────────────────────────────────────
   INTERVIEW SETUP COMPONENT
   ───────────────────────────────────────────── */
export default function InterviewSetup({
  // State from parent
  selectedTemplate,
  setSelectedTemplate,
  showCustom,
  setShowCustom,
  customConfig,
  setCustomConfig,
  voiceEnabled,
  setVoiceEnabled,
  micEnabled,
  setMicEnabled,
  fetchedConfig,
  setFetchedConfig,
  // Callbacks
  onStartInterview,
  sttSupported,
}) {
  const [showFetchModal, setShowFetchModal] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [configModalPreset, setConfigModalPreset] = useState({ name: '', emoji: '', initialConfig: {} });
  const { presets: savedPresets, savePreset, deletePreset } = useSavedPresets('examai_interview_presets');

  // Check for config passed from dashboard quick action
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('examConfigModalResult');
      if (stored) {
        const { mode, config } = JSON.parse(stored);
        sessionStorage.removeItem('examConfigModalResult');
        if (mode === 'interview' && config) {
          // Apply the config and start directly
          setFetchedConfig(config);
          setSelectedTemplate(config.interviewType || 'technical');
        }
      }
    } catch (e) {
      clientLogger.warn('Failed to read examConfigModalResult from sessionStorage:', e.message);
    }
  }, [setFetchedConfig, setSelectedTemplate]);

  /* ─── Open config modal for a template ─── */
  function openConfigForTemplate(tmpl) {
    setSelectedTemplate(tmpl.id);
    setShowCustom(false);
    setFetchedConfig(null);
    setConfigModalPreset({
      name: tmpl.title,
      emoji: tmpl.emoji,
      initialConfig: {
        difficulty: tmpl.difficulty,
        questionCount: tmpl.questionCount,
        tone: tmpl.tone,
      },
    });
    setConfigModalOpen(true);
  }

  /* ─── Handle AI-fetched interview config ─── */
  function handleUseFetchedConfig(config) {
    trackFeatureUsed({
      featureName: 'preset_use',
      context: `interview_fetch:${config.title || config.name || 'unknown'}`,
    });
    setFetchedConfig(config);
    setSelectedTemplate(config.interviewType || 'technical');
    setShowCustom(false);
  }

  /* ─── Handle saved preset selection ─── */
  function handleSelectSavedPreset(preset) {
    trackFeatureUsed({ featureName: 'preset_use', context: `interview:${preset.name}` });
    setFetchedConfig(preset);
    setSelectedTemplate(preset.interviewType || preset.id || 'technical');
    setShowCustom(false);
  }

  /* ─── Save preset to localStorage ─── */
  function handleSavePreset(config) {
    savePreset({
      name: config.title || 'Custom Interview',
      emoji: config.emoji || '🎤',
      desc: config.description || '',
      interviewType: config.interviewType,
      role: config.role,
      company: config.company,
      topics: config.topics,
      difficulty: config.difficulty,
      questionCount: config.questionCount,
      tone: config.tone,
    });
  }

  /* ─── Toggle custom topic ─── */
  function toggleCustomTopic(topic) {
    setCustomConfig((prev) => ({
      ...prev,
      topics: prev.topics.includes(topic) ? prev.topics.filter((t) => t !== topic) : [...prev.topics, topic],
    }));
  }

  /* ─── Can start check ─── */
  function canStart() {
    if (fetchedConfig) return true;
    if (showCustom) return customConfig.role.trim().length > 0;
    return selectedTemplate !== null;
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500">
      {/* ─── Header ─── */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
          <HiOutlineChatAlt2 className="inline-block mr-2" />
          AI Interview <span className="gradient-text">Simulator</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Practice realistic interviews with AI. Get real-time voice feedback on your answers.
        </p>
      </div>

      {/* ─── Template Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {interviewTemplates.map((t) => (
          <Card
            key={t.id}
            className={cn(
              'p-6 cursor-pointer transition-all hover:border-primary/50',
              selectedTemplate === t.id && !showCustom && !fetchedConfig
                ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                : ''
            )}
            onClick={() => openConfigForTemplate(t)}
          >
            <div className="text-4xl mb-4">{t.emoji}</div>
            <h3 className="font-bold text-lg mb-2">{t.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t.desc}</p>
            <div className="flex flex-wrap gap-2">
              {t.topics.slice(0, 4).map((topic, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {topic}
                </Badge>
              ))}
              {t.topics.length > 4 && (
                <Badge variant="secondary" className="text-xs">
                  +{t.topics.length - 4}
                </Badge>
              )}
            </div>
          </Card>
        ))}
        <Card
          className={cn(
            'p-6 cursor-pointer transition-all border-dashed bg-secondary/30 flex flex-col items-center justify-center text-center hover:border-primary/50',
            showCustom ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : ''
          )}
          onClick={() => {
            setShowCustom(true);
            setSelectedTemplate(null);
            setFetchedConfig(null);
          }}
        >
          <div className="text-4xl mb-4">✨</div>
          <h3 className="font-bold text-lg mb-2">Custom Interview</h3>
          <p className="text-sm text-muted-foreground">Design your own</p>
        </Card>
      </div>

      {/* ─── Fetch & Presets Row ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <FetchExamCard onClick={() => setShowFetchModal(true)} />
        <AddPresetCard
          onFetchClick={() => setShowFetchModal(true)}
          onCustomClick={() => {
            setShowCustom(true);
            setSelectedTemplate(null);
            setFetchedConfig(null);
          }}
        />
      </div>

      {/* ─── Saved Presets ─── */}
      <SavedPresetsSection count={savedPresets.length}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedPresets.map((p) => (
            <SavedPresetCard
              key={p.id}
              preset={p}
              isSelected={fetchedConfig?.id === p.id}
              onSelect={() => handleSelectSavedPreset(p)}
              onDelete={deletePreset}
            />
          ))}
        </div>
      </SavedPresetsSection>

      {/* ─── Fetched Config Display ─── */}
      {fetchedConfig && (
        <Card className="flex items-center gap-4 p-4 border-primary/20 bg-primary/5">
          <span className="text-4xl px-2">{fetchedConfig.emoji || '🎤'}</span>
          <div>
            <div className="font-bold text-lg">{fetchedConfig.title || fetchedConfig.name || 'Fetched Interview'}</div>
            <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              {fetchedConfig.role || fetchedConfig.interviewType} •{' '}
              <Badge variant="outline">{fetchedConfig.difficulty || 'Medium'}</Badge> •{' '}
              {fetchedConfig.questionCount || 10} Qs
            </div>
          </div>
        </Card>
      )}

      {/* ─── Custom Config Form ─── */}
      {showCustom && !fetchedConfig && (
        <Card className="p-6 md:p-8 space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">✨ Build Your Interview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Role / Position *</label>
              <Input
                placeholder="e.g. Senior React Developer"
                value={customConfig.role}
                onChange={(e) => setCustomConfig((p) => ({ ...p, role: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Company (Optional)</label>
              <Input
                placeholder="e.g. Google, Amazon"
                value={customConfig.company}
                onChange={(e) => setCustomConfig((p) => ({ ...p, company: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Difficulty</label>
              <Select
                value={customConfig.difficulty}
                onValueChange={(v) => setCustomConfig((p) => ({ ...p, difficulty: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                  <SelectItem value="Expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Questions</label>
              <Select
                value={customConfig.questionCount.toString()}
                onValueChange={(v) => setCustomConfig((p) => ({ ...p, questionCount: parseInt(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Questions</SelectItem>
                  <SelectItem value="10">10 Questions</SelectItem>
                  <SelectItem value="15">15 Questions</SelectItem>
                  <SelectItem value="20">20 Questions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Tone</label>
              <Select value={customConfig.tone} onValueChange={(v) => setCustomConfig((p) => ({ ...p, tone: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Friendly">Friendly</SelectItem>
                  <SelectItem value="Professional">Professional</SelectItem>
                  <SelectItem value="Challenging">Challenging</SelectItem>
                  <SelectItem value="Formal">Formal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 space-y-3 pt-2 w-full">
              <label className="text-sm font-semibold">Topics ({customConfig.topics.length} selected)</label>
              <div className="flex flex-wrap gap-2">
                {customTopicOptions.map((topic) => (
                  <Badge
                    key={topic}
                    variant={customConfig.topics.includes(topic) ? 'default' : 'outline'}
                    className="cursor-pointer text-xs py-1"
                    onClick={() => toggleCustomTopic(topic)}
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ─── Audio Settings & Start Button ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 bg-secondary/20 rounded-2xl border">
        <div className="flex items-center gap-4 shrink-0">
          <Button
            variant={voiceEnabled ? 'default' : 'outline'}
            onClick={() => setVoiceEnabled((v) => !v)}
            className={cn('gap-2 w-32', voiceEnabled ? 'bg-primary text-primary-foreground' : '')}
          >
            {voiceEnabled ? <HiOutlineVolumeUp className="w-5 h-5" /> : <HiOutlineVolumeOff className="w-5 h-5" />}
            Speaker
          </Button>
          {sttSupported && (
            <Button
              variant={micEnabled ? 'default' : 'outline'}
              onClick={() => setMicEnabled((v) => !v)}
              className={cn('gap-2 w-32', micEnabled ? 'bg-primary text-primary-foreground' : '')}
            >
              <HiOutlineMicrophone className="w-5 h-5" />
              Mic
            </Button>
          )}
        </div>
        <Button
          size="lg"
          className="w-full sm:w-auto gap-2 text-lg h-14 px-8"
          disabled={!canStart()}
          onClick={onStartInterview}
        >
          <HiOutlinePlay className="w-6 h-6" /> Start Interview
        </Button>
      </div>

      {/* ─── Modals ─── */}
      <FetchExamModal
        isOpen={showFetchModal}
        onClose={() => setShowFetchModal(false)}
        onUseConfig={handleUseFetchedConfig}
        onSavePreset={handleSavePreset}
        mode="interview"
      />

      <ExamConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        onGenerate={(modalConfig) => {
          setConfigModalOpen(false);
          // Call parent's config generate with selected template info
          onStartInterview(modalConfig);
        }}
        mode="interview"
        presetName={configModalPreset.name}
        presetEmoji={configModalPreset.emoji}
        initialConfig={configModalPreset.initialConfig}
      />
    </div>
  );
}
