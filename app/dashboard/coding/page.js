'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FetchExamModal,
  FetchExamCard,
  AddPresetCard,
  SavedPresetCard,
  SavedPresetsSection,
} from '../../components/PresetManager/PresetManager';
import { useExamPresets } from '@/hooks/useExamPresets';
// Lazy load ExamConfigModal - only needed when user opens config dialog
import dynamic from 'next/dynamic';
const ExamConfigModal = dynamic(
  () => import('../../components/ExamConfigModal/ExamConfigModal'),
  {
    loading: () => <div className="fixed inset-0 bg-background/80 backdrop-blur-sm animate-pulse" />,
    ssr: false,
  }
);
import AdBanner from '../../components/AdBanner/AdBanner';
import { Card } from '@/components/ui/card';
import { useToast } from '@/app/components/Toast/ToastProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import clientLogger from '@/lib/client-logger';
import { trackFeatureUsed } from '@/lib/ga';

const defaultProblems = [
  { id: 1, title: 'Two Sum', tags: ['Array', 'Hash Map'], difficulty: 'easy' },
  { id: 2, title: 'Valid Parentheses', tags: ['Stack', 'String'], difficulty: 'easy' },
  { id: 3, title: 'Merge Two Sorted Lists', tags: ['Linked List'], difficulty: 'easy' },
  { id: 4, title: 'Maximum Subarray', tags: ['Array', 'DP'], difficulty: 'medium' },
  { id: 5, title: 'Binary Tree Level Order Traversal', tags: ['Tree', 'BFS'], difficulty: 'medium' },
  { id: 6, title: 'Longest Palindromic Substring', tags: ['String', 'DP'], difficulty: 'medium' },
  { id: 7, title: 'LRU Cache', tags: ['Hash Map', 'DLL'], difficulty: 'hard' },
  { id: 8, title: 'Median of Two Sorted Arrays', tags: ['Binary Search'], difficulty: 'hard' },
  { id: 9, title: 'Trapping Rain Water', tags: ['Array', 'Two Pointer'], difficulty: 'hard' },
  { id: 10, title: 'Reverse Linked List', tags: ['Linked List'], difficulty: 'easy' },
];

const codingPresets = [
  { id: 'dsa', emoji: '🧮', name: 'DSA Practice', desc: 'Arrays, Trees, Graphs, DP' },
  { id: 'system-design', emoji: '🏗️', name: 'System Design', desc: 'LLD & HLD Problems' },
  { id: 'debugging', emoji: '🐛', name: 'Debug Challenge', desc: 'Find & Fix Bugs' },
  { id: 'competitive', emoji: '🏆', name: 'Competitive', desc: 'Contest-style Problems' },
];

const diffBadgeVariant = { easy: 'success', medium: 'warning', hard: 'destructive' };

export default function CodingPage() {
  const router = useRouter();
  const toast = useToast();
  const [showFetchModal, setShowFetchModal] = useState(false);
  const [activePreset, setActivePreset] = useState(null);
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [solvedIds, setSolvedIds] = useState(new Set());

  // Shared preset handling hook
  const {
    fetchedConfig: fetchedProblems,
    savedPresets,
    handleUseFetchedConfig: handleUseFetchedConfig,
    handleSelectSavedPreset: handleSelectSavedPreset,
    handleSavePreset: handleSavePreset,
    clearFetchedConfig,
    deletePreset,
  } = useExamPresets('examai_coding_presets', {
    featurePrefix: 'coding',
    onConfigLoaded: (config) => {
      // For coding, just set the active preset to null
      setActivePreset(null);
    },
  });
  // State to track if modal has been rendered (triggers lazy load)
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [modalMounted, setModalMounted] = useState(false);
  const [configModalPreset, setConfigModalPreset] = useState({ name: '', emoji: '' });

  // Load solved problem IDs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('examai_solved_problems');
      if (stored) setSolvedIds(new Set(JSON.parse(stored))); // eslint-disable-line react-hooks/set-state-in-effect -- SSR-safe localStorage init
    } catch (e) {
      clientLogger.warn('Failed to load solved problems from localStorage:', e.message);
    }
  }, []);

  // Listen for solved events from the coding editor page
  useEffect(() => {
    function handleSolved(e) {
      const { problemId, problemTitle } = e.detail || {};
      if (problemId != null) {
        setSolvedIds((prev) => {
          const next = new Set(prev);
          next.add(String(problemId));
          try {
            localStorage.setItem('examai_solved_problems', JSON.stringify([...next]));
          } catch (e) {
            clientLogger.warn('Failed to save solved problems to localStorage:', e.message);
          }
          return next;
        });
        // Show success toast
        toast.success('Problem Solved! 🎉', `You solved "${problemTitle || 'Problem ' + problemId}"`);
      }
    }
    window.addEventListener('coding-problem-solved', handleSolved);
    return () => window.removeEventListener('coding-problem-solved', handleSolved);
  }, [toast]);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('examConfigModalResult');
      if (stored) {
        const { mode, config } = JSON.parse(stored);
        sessionStorage.removeItem('examConfigModalResult');
        if (mode === 'coding' && config) {
          sessionStorage.setItem('codingConfig', JSON.stringify(config));
          router.push('/dashboard/coding/1');
        }
      }
    } catch (e) {
      clientLogger.warn('Failed to read examConfigModalResult from sessionStorage:', e.message);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function openConfigForPreset(preset) {
    setActivePreset(preset.id);
    setFetchedProblems(null);
    setConfigModalPreset({ name: preset.name, emoji: preset.emoji });
    setModalMounted(true); // Trigger lazy mount
    setConfigModalOpen(true);
  }

  function handleConfigGenerate(config) {
    setConfigModalOpen(false);
    sessionStorage.setItem('codingConfig', JSON.stringify(config));
    router.push('/dashboard/coding/1');
  }

  const displayProblems = (fetchedProblems?.problems || defaultProblems).filter((p) => {
    if (difficultyFilter === 'all') return true;
    return p.difficulty === difficultyFilter;
  });
  const allProblems = fetchedProblems?.problems || defaultProblems;
  const displayTitle = fetchedProblems?.title || null;
  const solvedCount = allProblems.filter((p) => solvedIds.has(String(p.id))).length;

  const handleSavePresetWithFields = (config) => {
    handleSavePreset(config, {
      nameField: 'title',
      emojiField: 'emoji',
      descField: 'description',
      problems: config.problems,
    });
  };
  function resetToDefault() {
    clearFetchedConfig();
    setActivePreset(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          💻 Coding <span className="gradient-text">Challenges</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Practice DSA, debugging, and system design problems with an integrated code editor.
        </p>
        {solvedCount > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="success" className="gap-1">
              ✅ {solvedCount}/{allProblems.length} Solved
            </Badge>
          </div>
        )}
      </div>

      {/* Difficulty Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {['all', 'easy', 'medium', 'hard'].map((d) => (
          <Button
            key={d}
            variant={difficultyFilter === d ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDifficultyFilter(d)}
            className={cn(
              'capitalize',
              difficultyFilter === d && d === 'easy' && 'bg-success hover:bg-success/90',
              difficultyFilter === d && d === 'medium' && 'bg-warning hover:bg-warning/90 text-warning-foreground',
              difficultyFilter === d && d === 'hard' && 'bg-destructive hover:bg-destructive/90'
            )}
          >
            {d === 'all'
              ? `All (${allProblems.length})`
              : `${d} (${allProblems.filter((p) => p.difficulty === d).length})`}
          </Button>
        ))}
      </div>

      {/* Presets */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {codingPresets.map((p) => (
          <Card
            key={p.id}
            className={cn(
              'p-5 flex flex-col items-center gap-2 text-center cursor-pointer transition-all hover:shadow-md',
              activePreset === p.id
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
        <AddPresetCard onFetchClick={() => setShowFetchModal(true)} onCustomClick={() => {}} />
      </div>

      <SavedPresetsSection count={savedPresets.length}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {savedPresets.map((p) => (
            <SavedPresetCard
              key={p.id}
              preset={p}
              isSelected={activePreset === p.id}
              onSelect={() => handleSelectSavedPreset(p)}
              onDelete={deletePreset}
            />
          ))}
        </div>
      </SavedPresetsSection>

      {fetchedProblems && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
          <span className="text-xl">{fetchedProblems.emoji || '💻'}</span>
          <strong>{fetchedProblems.title || 'AI-Generated Problems'}</strong>
          <span className="text-sm text-muted-foreground">— {fetchedProblems.problems?.length || 0} problems</span>
          <Button variant="ghost" size="sm" onClick={resetToDefault}>
            Reset to defaults
          </Button>
        </div>
      )}

      {displayTitle && <h3 className="text-lg font-semibold">{displayTitle}</h3>}

      <div className="space-y-2">
        {displayProblems.map((p, idx) => (
          <Link key={p.id || idx} href={`/dashboard/coding/${p.id || idx + 1}`}>
            <Card
              className={cn(
                'p-4 flex items-center justify-between hover:shadow-md hover:border-indigo-500/20 transition-all cursor-pointer',
                solvedIds.has(String(p.id)) && 'border-success/30 bg-success/5'
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium',
                    solvedIds.has(String(p.id)) ? 'bg-success/20 text-success' : 'bg-secondary text-muted-foreground'
                  )}
                >
                  {solvedIds.has(String(p.id)) ? '✓' : p.id || idx + 1}
                </div>
                <div>
                  <h4 className="text-sm font-semibold">{p.title}</h4>
                  <div className="flex gap-1.5 mt-1">
                    {(p.tags || []).map((t, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <Badge variant={diffBadgeVariant[p.difficulty] || 'secondary'}>{p.difficulty}</Badge>
            </Card>
          </Link>
        ))}
      </div>

      {/* Non-intrusive ad placement — only shows when slot is configured */}
      <AdBanner slot={process.env.NEXT_PUBLIC_AD_SLOT_CODING || ''} format="auto" className="mt-6" />

      <FetchExamModal
        isOpen={showFetchModal}
        onClose={() => setShowFetchModal(false)}
        onUseConfig={handleUseFetchedConfig}
        onSavePreset={handleSavePresetWithFields}
        mode="coding"
      />
      {modalMounted && (
        <ExamConfigModal
          isOpen={configModalOpen}
          onClose={() => setConfigModalOpen(false)}
          onGenerate={handleConfigGenerate}
          mode="coding"
          presetName={configModalPreset.name}
          presetEmoji={configModalPreset.emoji}
        />
      )}
    </div>
  );
}
