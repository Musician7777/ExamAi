'use client';
import { useState, useEffect, useCallback } from 'react';
import { Play, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/* ─── AI RECOMMENDED DEFAULTS ─── */
const RECOMMENDATIONS = {
  exam: { difficulty: 'Medium', time: 60, questions: 20, questionType: 'MCQ', negativeMarking: 0.25 },
  coding: { difficulty: 'Medium', time: 45, questions: 5, language: 'JavaScript' },
  interview: { difficulty: 'Medium', time: 10, questions: 10, tone: 'Professional' },
};

const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard', 'Expert'];
const EXAM_TIME_OPTIONS = [15, 30, 45, 60, 90, 120, 180];
const EXAM_QUESTION_OPTIONS = [10, 15, 20, 30, 50, 75, 100];
const EXAM_TYPE_OPTIONS = ['MCQ', 'Descriptive', 'Mixed'];
const EXAM_NEG_OPTIONS = [0, 0.25, 0.33, 0.5, 1];
const CODING_TIME_OPTIONS = [15, 30, 45, 60, 90];
const CODING_QUESTION_OPTIONS = [1, 3, 5, 8, 10];
const CODING_LANG_OPTIONS = ['JavaScript', 'Python', 'Java', 'C++', 'Go'];
const INTERVIEW_Q_OPTIONS = [5, 8, 10, 15, 20];
const INTERVIEW_TONE_OPTIONS = ['Friendly', 'Professional', 'Challenging', 'Formal'];

function Pill({ label, active, recommended, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all border cursor-pointer',
        active
          ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-sm'
          : 'bg-secondary/50 border-border text-muted-foreground hover:bg-secondary hover:text-foreground'
      )}
    >
      {label}
      {recommended && (
        <span className="absolute -top-2 -right-2 px-1.5 py-0.5 text-[10px] rounded-full bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/30">
          ✨ AI
        </span>
      )}
    </button>
  );
}

const MODE_INFO = {
  exam: {
    emoji: '📝',
    title: 'Configure Exam',
    desc: 'Set your exam preferences. AI-recommended options are highlighted.',
  },
  coding: {
    emoji: '💻',
    title: 'Configure Challenge',
    desc: 'Customize your coding challenge. AI picks optimal settings.',
  },
  interview: {
    emoji: '🎤',
    title: 'Configure Interview',
    desc: 'Tune your mock interview for a realistic experience.',
  },
};

export default function ExamConfigModal({
  isOpen,
  onClose,
  onGenerate,
  mode = 'exam',
  presetName = '',
  presetEmoji = '',
  initialConfig = {},
}) {
  const rec = RECOMMENDATIONS[mode] || RECOMMENDATIONS.exam;

  const [difficulty, setDifficulty] = useState(initialConfig.difficulty || rec.difficulty);
  const [time, setTime] = useState(initialConfig.time || initialConfig.timeLimit || rec.time);
  const [questions, setQuestions] = useState(
    initialConfig.questions || initialConfig.questionCount || initialConfig.totalQuestions || rec.questions
  );
  const [questionType, setQuestionType] = useState(initialConfig.questionType || rec.questionType || 'MCQ');
  const [negativeMarking, setNegativeMarking] = useState(initialConfig.negativeMarking ?? rec.negativeMarking ?? 0);
  const [language, setLanguage] = useState(initialConfig.language || rec.language || 'JavaScript');
  const [tone, setTone] = useState(initialConfig.tone || rec.tone || 'Professional');
  const [voiceEnabled, setVoiceEnabled] = useState(
    initialConfig.voiceEnabled !== undefined ? initialConfig.voiceEnabled : true
  );
  const [micEnabled, setMicEnabled] = useState(
    initialConfig.micEnabled !== undefined ? initialConfig.micEnabled : true
  );

  useEffect(() => {
    if (isOpen) {
      /* eslint-disable react-hooks/set-state-in-effect -- reset state when modal opens */
      setDifficulty(initialConfig.difficulty || rec.difficulty);
      setTime(initialConfig.time || initialConfig.timeLimit || rec.time);
      setQuestions(
        initialConfig.questions || initialConfig.questionCount || initialConfig.totalQuestions || rec.questions
      );
      setQuestionType(initialConfig.questionType || rec.questionType || 'MCQ');
      setNegativeMarking(initialConfig.negativeMarking ?? rec.negativeMarking ?? 0);
      setLanguage(initialConfig.language || rec.language || 'JavaScript');
      setTone(initialConfig.tone || rec.tone || 'Professional');
      setVoiceEnabled(initialConfig.voiceEnabled !== undefined ? initialConfig.voiceEnabled : true);
      setMicEnabled(initialConfig.micEnabled !== undefined ? initialConfig.micEnabled : true);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerate = useCallback(() => {
    const config = { difficulty, questions, time };
    if (mode === 'exam') {
      config.questionType = questionType;
      config.negativeMarking = negativeMarking;
      config.timeLimit = time;
      config.totalQuestions = questions;
    } else if (mode === 'coding') {
      config.language = language;
      config.timeLimit = time;
    } else if (mode === 'interview') {
      config.tone = tone;
      config.questionCount = questions;
      config.voiceEnabled = voiceEnabled;
      config.micEnabled = micEnabled;
    }
    onGenerate(config);
  }, [
    difficulty,
    questions,
    time,
    questionType,
    negativeMarking,
    language,
    tone,
    voiceEnabled,
    micEnabled,
    mode,
    onGenerate,
  ]);

  const info = MODE_INFO[mode] || MODE_INFO.exam;
  const displayEmoji = presetEmoji || info.emoji;
  const displayTitle = presetName || info.title;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-lg">
            <span className="text-2xl">{displayEmoji}</span>
            {displayTitle}
          </DialogTitle>
          <DialogDescription>{info.desc}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Difficulty */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Difficulty</Label>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTY_OPTIONS.map((opt) => (
                <Pill
                  key={opt}
                  label={opt}
                  active={difficulty === opt}
                  recommended={opt === rec.difficulty}
                  onClick={() => setDifficulty(opt)}
                />
              ))}
            </div>
          </div>

          {/* Time */}
          {(mode === 'exam' || mode === 'coding') && (
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Time Limit {mode === 'exam' ? '(minutes)' : '(mins total)'}
              </Label>
              <div className="flex flex-wrap gap-2">
                {(mode === 'exam' ? EXAM_TIME_OPTIONS : CODING_TIME_OPTIONS).map((opt) => (
                  <Pill
                    key={opt}
                    label={`${opt} min`}
                    active={time === opt}
                    recommended={opt === rec.time}
                    onClick={() => setTime(opt)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Questions */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              {mode === 'interview' ? 'Number of Questions' : mode === 'coding' ? 'Problems' : 'Total Questions'}
            </Label>
            <div className="flex flex-wrap gap-2">
              {(mode === 'exam'
                ? EXAM_QUESTION_OPTIONS
                : mode === 'coding'
                  ? CODING_QUESTION_OPTIONS
                  : INTERVIEW_Q_OPTIONS
              ).map((opt) => (
                <Pill
                  key={opt}
                  label={`${opt}`}
                  active={questions === opt}
                  recommended={opt === rec.questions}
                  onClick={() => setQuestions(opt)}
                />
              ))}
            </div>
          </div>

          {/* Question Type (exam) */}
          {mode === 'exam' && (
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Question Type</Label>
              <div className="flex flex-wrap gap-2">
                {EXAM_TYPE_OPTIONS.map((opt) => (
                  <Pill
                    key={opt}
                    label={opt}
                    active={questionType === opt}
                    recommended={opt === rec.questionType}
                    onClick={() => setQuestionType(opt)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Negative Marking (exam) */}
          {mode === 'exam' && (
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Negative Marking</Label>
              <div className="flex flex-wrap gap-2">
                {EXAM_NEG_OPTIONS.map((opt) => (
                  <Pill
                    key={opt}
                    label={opt === 0 ? 'None' : `-${opt}`}
                    active={negativeMarking === opt}
                    recommended={opt === rec.negativeMarking}
                    onClick={() => setNegativeMarking(opt)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Language (coding) */}
          {mode === 'coding' && (
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Preferred Language</Label>
              <div className="flex flex-wrap gap-2">
                {CODING_LANG_OPTIONS.map((opt) => (
                  <Pill
                    key={opt}
                    label={opt}
                    active={language === opt}
                    recommended={opt === rec.language}
                    onClick={() => setLanguage(opt)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tone (interview) */}
          {mode === 'interview' && (
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Interview Tone</Label>
              <div className="flex flex-wrap gap-2">
                {INTERVIEW_TONE_OPTIONS.map((opt) => (
                  <Pill
                    key={opt}
                    label={opt}
                    active={tone === opt}
                    recommended={opt === rec.tone}
                    onClick={() => setTone(opt)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Voice/Mic Toggles (interview) */}
          {mode === 'interview' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <span>🔊</span>
                  <Label className="text-sm">AI Voice Response</Label>
                </div>
                <Switch checked={voiceEnabled} onCheckedChange={setVoiceEnabled} id="toggle-voice" />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <span>🎙️</span>
                  <Label className="text-sm">Microphone Input</Label>
                </div>
                <Switch checked={micEnabled} onCheckedChange={setMicEnabled} id="toggle-mic" />
              </div>
            </div>
          )}

          {/* Summary */}
          <Separator />
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between p-2 rounded-md bg-secondary/50">
              <span className="text-muted-foreground">Difficulty</span>
              <span className="font-medium">{difficulty}</span>
            </div>
            {(mode === 'exam' || mode === 'coding') && (
              <div className="flex justify-between p-2 rounded-md bg-secondary/50">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium">{time} min</span>
              </div>
            )}
            <div className="flex justify-between p-2 rounded-md bg-secondary/50">
              <span className="text-muted-foreground">{mode === 'coding' ? 'Problems' : 'Questions'}</span>
              <span className="font-medium">{questions}</span>
            </div>
            {mode === 'exam' && (
              <div className="flex justify-between p-2 rounded-md bg-secondary/50">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">{questionType}</span>
              </div>
            )}
            {mode === 'interview' && (
              <div className="flex justify-between p-2 rounded-md bg-secondary/50">
                <span className="text-muted-foreground">Tone</span>
                <span className="font-medium">{tone}</span>
              </div>
            )}
            {mode === 'coding' && (
              <div className="flex justify-between p-2 rounded-md bg-secondary/50">
                <span className="text-muted-foreground">Language</span>
                <span className="font-medium">{language}</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} id="config-modal-cancel">
            Cancel
          </Button>
          <Button variant="brand" onClick={handleGenerate} id="config-modal-generate" className="gap-2">
            <Play className="h-4 w-4" />
            {mode === 'interview' ? 'Start Interview' : mode === 'coding' ? 'Start Challenge' : 'Generate Exam'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
