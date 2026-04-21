'use client';
import { useState, useCallback } from 'react';
import { useSavedPresets } from '@/app/components/PresetManager/PresetManager';
import { trackFeatureUsed } from '@/lib/ga';

/**
 * Shared hook for preset handling logic across Exam, Coding, and Interview pages.
 * Eliminates duplicate handleUseFetchedConfig, handleSelectSavedPreset, and handleSavePreset implementations.
 *
 * @param {string} storageKey - localStorage key for saved presets (e.g., 'examai_exam_presets')
 * @param {object} options - Configuration options
 * @param {string} options.featurePrefix - GA4 tracking prefix (e.g., 'exam', 'coding', 'interview')
 * @param {function} options.parseSubjects - Optional function to parse sections into subjects
 * @param {function} options.onConfigLoaded - Optional callback when config is loaded
 */
export function useExamPresets(storageKey, options = {}) {
  const { featurePrefix = 'preset', parseSubjects = null, onConfigLoaded = null } = options;

  // Fetched config from AI/URL
  const [fetchedConfig, setFetchedConfig] = useState(null);

  // Saved presets from localStorage
  const { presets: savedPresets, savePreset, deletePreset } = useSavedPresets(storageKey);

  /**
   * Handle loading a config from AI fetch or shared URL
   * @param {object} config - The fetched config object
   */
  const handleUseFetchedConfig = useCallback(
    (config) => {
      trackFeatureUsed({
        featureName: 'preset_use',
        context: `${featurePrefix}_fetch:${config.examName || config.title || config.name || 'unknown'}`,
      });

      setFetchedConfig(config);

      // Call optional callback for type-specific handling
      if (onConfigLoaded) {
        onConfigLoaded(config);
      }
    },
    [featurePrefix, onConfigLoaded]
  );

  /**
   * Handle selecting a saved preset from localStorage
   * @param {object} preset - The saved preset object
   */
  const handleSelectSavedPreset = useCallback(
    (preset) => {
      trackFeatureUsed({ featureName: 'preset_use', context: `${featurePrefix}:${preset.name}` });

      setFetchedConfig(preset);

      // Call optional callback for type-specific handling
      if (onConfigLoaded) {
        onConfigLoaded(preset);
      }
    },
    [featurePrefix, onConfigLoaded]
  );

  /**
   * Handle saving current config as a preset
   * @param {object} config - The config to save
   * @param {object} fields - Fields to extract from config
   */
  const handleSavePreset = useCallback(
    (config, fields = {}) => {
      const { nameField = 'examName', emojiField = 'emoji', descField = 'description', ...extraFields } = fields;

      savePreset({
        name: config[nameField] || config.title || config.name || 'Custom',
        emoji: config[emojiField] || '📄',
        desc: config[descField] || '',
        ...extraFields,
      });
    },
    [savePreset]
  );

  /**
   * Clear the fetched config
   */
  const clearFetchedConfig = useCallback(() => {
    setFetchedConfig(null);
  }, []);

  return {
    // State
    fetchedConfig,
    savedPresets,
    // Handlers
    handleUseFetchedConfig,
    handleSelectSavedPreset,
    handleSavePreset,
    clearFetchedConfig,
    // Direct access to save/delete (for custom save UI)
    savePreset,
    deletePreset,
  };
}

/**
 * Helper to parse sections/sections string into subjects array
 * Used by exam preset handling
 */
export function parseSectionsToSubjects(sections, totalQuestions = 50) {
  const sectionArray = Array.isArray(sections)
    ? sections
    : (sections || 'General')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

  return sectionArray.map((name) => ({
    name,
    questionCount: Math.max(1, Math.floor(totalQuestions / sectionArray.length)),
    aiOverview: null,
  }));
}

/**
 * Helper to build default custom state from config
 * Used by exam preset handling
 */
export function buildCustomStateFromConfig(config) {
  return {
    totalQuestions: config.totalQuestions || 50,
    negativeMarking: config.negativeMarking || 0,
    timeLimit: config.timeLimit || 60,
    easy: 30,
    medium: 50,
    hard: 20,
    questionType: config.questionType || 'MCQ',
  };
}
