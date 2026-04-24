'use client';
import {
  HiOutlineChatAlt2,
  HiOutlinePlay,
  HiOutlineMicrophone,
  HiOutlineVolumeUp,
  HiOutlineVolumeOff,
} from 'react-icons/hi';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────
   INTERVIEW TEMPLATES DATA
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
   CUSTOM BUILDER COMPONENT
   ───────────────────────────────────────────── */
function CustomBuilder({ customConfig, setCustomConfig, showCustom }) {
  function toggleCustomTopic(topic) {
    setCustomConfig((prev) => ({
      ...prev,
      topics: prev.topics.includes(topic) ? prev.topics.filter((t) => t !== topic) : [...prev.topics, topic],
    }));
  }

  if (!showCustom) return null;

  return (
    <Card className="p-6 space-y-6 animate-in slide-in-from-bottom-2 duration-300">
      <h2 className="text-lg font-bold flex items-center gap-2">✨ Build Your Interview</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Role / Position *</Label>
          <Input
            type="text"
            placeholder="e.g. Senior React Developer"
            value={customConfig.role}
            onChange={(e) => setCustomConfig((p) => ({ ...p, role: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Company (Optional)</Label>
          <Input
            type="text"
            placeholder="e.g. Google, Amazon"
            value={customConfig.company}
            onChange={(e) => setCustomConfig((p) => ({ ...p, company: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Difficulty</Label>
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
          <Label>Questions</Label>
          <Select
            value={String(customConfig.questionCount)}
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
          <Label>Tone</Label>
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
        <div className="sm:col-span-2 space-y-2">
          <Label>Topics ({customConfig.topics.length} selected)</Label>
          <div className="flex flex-wrap gap-2">
            {customTopicOptions.map((topic) => (
              <button
                key={topic}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm cursor-pointer transition-all border',
                  customConfig.topics.includes(topic)
                    ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-400 font-medium'
                    : 'bg-secondary border-border text-muted-foreground hover:border-indigo-500/30 hover:text-foreground'
                )}
                onClick={() => toggleCustomTopic(topic)}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────────
   TEMPLATE GRID COMPONENT
   ───────────────────────────────────────────── */
function TemplateGrid({ selectedTemplate, showCustom, setSelectedTemplate, setShowCustom }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {interviewTemplates.map((t) => (
        <Card
          key={t.id}
          className={cn(
            'p-5 flex flex-col items-center gap-2 text-center cursor-pointer transition-all hover:shadow-md',
            selectedTemplate === t.id && !showCustom
              ? 'border-indigo-500/50 bg-indigo-500/5 ring-1 ring-indigo-500/30'
              : 'hover:border-indigo-500/20'
          )}
          onClick={() => {
            setSelectedTemplate(t.id);
            setShowCustom(false);
          }}
        >
          <span className="text-2xl">{t.emoji}</span>
          <h4 className="text-sm font-semibold">{t.title}</h4>
          <p className="text-xs text-muted-foreground">{t.desc}</p>
          <div className="flex flex-wrap gap-1 justify-center mt-1">
            {t.topics.slice(0, 4).map((topic, i) => (
              <Badge key={i} variant="secondary" className="text-[10px]">
                {topic}
              </Badge>
            ))}
            {t.topics.length > 4 && (
              <Badge variant="secondary" className="text-[10px]">
                +{t.topics.length - 4}
              </Badge>
            )}
          </div>
        </Card>
      ))}
      <Card
        className={cn(
          'p-5 flex flex-col items-center gap-2 text-center cursor-pointer transition-all border-dashed border-2 hover:shadow-md',
          showCustom ? 'border-indigo-500/50 bg-indigo-500/5 ring-1 ring-indigo-500/30' : 'hover:border-indigo-500/20'
        )}
        onClick={() => {
          setShowCustom(true);
          setSelectedTemplate(null);
        }}
      >
        <span className="text-2xl">✨</span>
        <h4 className="text-sm font-semibold">Custom Interview</h4>
        <p className="text-xs text-muted-foreground">Design your own interview</p>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────
   VOICE CONTROLS COMPONENT
   ───────────────────────────────────────────── */
function VoiceControls({ voiceEnabled, setVoiceEnabled, micEnabled, setMicEnabled, sttSupported }) {
  return (
    <div className="flex gap-3">
      <Button
        variant={voiceEnabled ? 'secondary' : 'outline'}
        size="sm"
        className={cn('gap-2 rounded-full', voiceEnabled && 'bg-indigo-500/12 border-indigo-500/50 text-indigo-400')}
        onClick={() => setVoiceEnabled((v) => !v)}
      >
        {voiceEnabled ? <HiOutlineVolumeUp className="h-4 w-4" /> : <HiOutlineVolumeOff className="h-4 w-4" />}
        Speaker {voiceEnabled ? 'On' : 'Off'}
      </Button>
      {sttSupported && (
        <Button
          variant={micEnabled ? 'secondary' : 'outline'}
          size="sm"
          className={cn('gap-2 rounded-full', micEnabled && 'bg-indigo-500/12 border-indigo-500/50 text-indigo-400')}
          onClick={() => setMicEnabled((v) => !v)}
        >
          <HiOutlineMicrophone className="h-4 w-4" />
          Mic {micEnabled ? 'On' : 'Off'}
        </Button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN INTERVIEW SETUP COMPONENT
   ───────────────────────────────────────────── */
export default function InterviewSetup({
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
  sttSupported,
  onStart,
}) {
  function canStart() {
    if (showCustom) return customConfig.role.trim().length > 0;
    return selectedTemplate !== null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HiOutlineChatAlt2 className="h-6 w-6 text-indigo-400" /> AI Interview{' '}
          <span className="gradient-text">Simulator</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Practice realistic interviews with AI. Get real-time voice feedback on your answers.
        </p>
      </div>

      <TemplateGrid
        selectedTemplate={selectedTemplate}
        showCustom={showCustom}
        setSelectedTemplate={setSelectedTemplate}
        setShowCustom={setShowCustom}
      />

      <CustomBuilder customConfig={customConfig} setCustomConfig={setCustomConfig} showCustom={showCustom} />

      <div className="flex items-center justify-between flex-wrap gap-4 p-4 bg-secondary/20 rounded-xl border">
        <VoiceControls
          voiceEnabled={voiceEnabled}
          setVoiceEnabled={setVoiceEnabled}
          micEnabled={micEnabled}
          setMicEnabled={setMicEnabled}
          sttSupported={sttSupported}
        />
        <Button variant="brand" size="lg" disabled={!canStart()} onClick={onStart} className="gap-2">
          <HiOutlinePlay className="h-5 w-5" /> Start Interview
        </Button>
      </div>
    </div>
  );
}
