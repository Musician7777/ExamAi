'use client';
import { useReducer, useRef, useCallback, useEffect } from 'react';
import { useNotification } from '@/app/components/BadgeNotification/BadgeNotification';
import { cacheInvalidate } from '@/lib/clientCache';
import clientLogger from '@/lib/client-logger';
import { trackInterviewStart, trackInterviewComplete } from '@/lib/ga';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';

// Components
import InterviewSetup, { interviewTemplates } from './components/InterviewSetup';
import InterviewLive from './components/InterviewLive';
import InterviewSummary from './components/InterviewSummary';

/* ─────────────────────────────────────────────
   INITIAL STATE
   ───────────────────────────────────────────── */
const initialState = {
  phase: 'setup',
  selectedTemplate: null,
  showCustom: false,
  customConfig: { role: '', company: '', topics: [], difficulty: 'Medium', questionCount: 10, tone: 'Professional' },
  voiceEnabled: true,
  micEnabled: true,
  fetchedConfig: null,
  messages: [],
  input: '',
  isThinking: false,
  scores: { knowledge: 0, communication: 0, confidence: 0 },
  totalScores: { knowledge: 0, communication: 0, confidence: 0 },
  questionCount: 0,
  currentQ: null,
  interviewConfig: null,
  questionHistory: [],
  reviewData: [],
  awaitingMic: false,
  analysis: null,
  analysisLoading: false,
  expandedQuestions: {},
};

/* ─────────────────────────────────────────────
   STATE REDUCER
   ───────────────────────────────────────────── */
function interviewReducer(state, action) {
  switch (action.type) {
    case 'SET':
      return { ...state, ...action.payload };
    case 'RESET':
      return { ...initialState };
    case 'SET_PHASE':
      return { ...state, phase: action.payload };
    case 'UPDATE_CUSTOM_CONFIG':
      return { ...state, customConfig: { ...state.customConfig, ...action.payload } };
    default:
      return state;
  }
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */
export default function InterviewPage() {
  const { notify } = useNotification();

  // ─── State Management ───
  const [state, dispatch] = useReducer(interviewReducer, initialState);

  // Destructure for convenience
  const {
    phase,
    selectedTemplate,
    showCustom,
    customConfig,
    voiceEnabled,
    micEnabled,
    fetchedConfig,
    messages,
    input,
    isThinking,
    scores,
    questionCount,
    currentQ,
    interviewConfig,
    questionHistory,
    reviewData,
    awaitingMic,
    analysis,
    analysisLoading,
    expandedQuestions,
  } = state;

  // ─── Refs ───
  const sendingRef = useRef(false);
  const activitySavedRef = useRef(false);
  const submitAnswerRef = useRef(null);
  const micStartTimeoutRef = useRef(null);

  // ─── Speech Hooks ───
  const { isSpeaking, speak, stop: stopSpeaking } = useSpeechSynthesis();
  const {
    isListening,
    transcript,
    supported: sttSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({ onSilence: (text) => submitAnswerRef.current?.(text) });

  // ─── Helper: dispatch state updates ───
  const setState = useCallback(
    (payload) => {
      if (typeof payload === 'function') {
        dispatch({ type: 'SET', payload: payload(state) });
      } else {
        dispatch({ type: 'SET', payload });
      }
    },
    [state]
  );

  // ─── Get Config from current state ───
  const getConfig = useCallback(() => {
    if (fetchedConfig) {
      return {
        interviewType: fetchedConfig.interviewType || 'technical',
        role: fetchedConfig.role || 'Candidate',
        company: fetchedConfig.company || '',
        topics: fetchedConfig.topics || ['General'],
        difficulty: fetchedConfig.difficulty || 'Medium',
        questionCount: fetchedConfig.questionCount || 10,
        tone: fetchedConfig.tone || 'Professional',
      };
    }
    if (showCustom) {
      return {
        interviewType: 'technical',
        role: customConfig.role || 'Software Engineer',
        company: customConfig.company || '',
        topics: customConfig.topics.length > 0 ? customConfig.topics : ['General'],
        difficulty: customConfig.difficulty,
        questionCount: customConfig.questionCount,
        tone: customConfig.tone,
      };
    }
    if (!selectedTemplate) return null;
    const tmpl = interviewTemplates.find((t) => t.id === selectedTemplate);
    if (!tmpl) return null;
    return {
      interviewType: tmpl.interviewType,
      role: tmpl.role,
      company: '',
      topics: tmpl.topics,
      difficulty: tmpl.difficulty,
      questionCount: tmpl.questionCount,
      tone: tmpl.tone,
    };
  }, [fetchedConfig, showCustom, customConfig, selectedTemplate]);

  /* ─── Request mic permission ─── */
  const requestMicPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      clientLogger.debug('[Interview] Mic permission granted');
      return true;
    } catch (e) {
      clientLogger.warn('[Interview] Mic permission denied:', e);
      return false;
    }
  }, []);

  /* ─── Start Interview ─── */
  const startInterviewWithConfig = useCallback(
    async (config, useVoice, useMic) => {
      if (useMic && sttSupported) {
        await requestMicPermission();
      }

      setState({
        interviewConfig: config,
        phase: 'interview',
        messages: [],
        scores: { knowledge: 0, communication: 0, confidence: 0 },
        totalScores: { knowledge: 0, communication: 0, confidence: 0 },
        questionCount: 0,
        questionHistory: [],
        reviewData: [],
        isThinking: true,
        awaitingMic: false,
      });

      try {
        const res = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'interview-question', config: { ...config, history: [] } }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        const greeting = `Hello! I'll be your interviewer today for the ${config.role} position${config.company ? ` at ${config.company}` : ''}. Let's get started.\n\n${data.question}`;

        setState({
          currentQ: data,
          questionHistory: [data.question],
          questionCount: 1,
          messages: [{ role: 'ai', text: greeting }],
          isThinking: false,
        });

        trackInterviewStart({
          interviewType: config.interviewType || 'technical',
          role: config.role || 'Candidate',
          difficulty: config.difficulty || 'Medium',
          questionCount: config.questionCount || 10,
          tone: config.tone || 'Professional',
        });

        if (useVoice) {
          speak(greeting, () => {
            if (useMic) setState({ awaitingMic: true });
          });
        } else if (useMic) {
          setState({ awaitingMic: true });
        }
      } catch (err) {
        clientLogger.error('Failed to start interview:', err);
        setState({
          isThinking: false,
          messages: [{ role: 'ai', text: 'Sorry, I had trouble getting started. Please try again.' }],
        });
        if (useMic && !useVoice) setState({ awaitingMic: true });
      }
    },
    [sttSupported, speak, requestMicPermission]
  );

  /* ─── Submit Answer ─── */
  const submitAnswer = useCallback(
    async (answerText) => {
      const answer = (answerText || input).trim();
      if (!answer || isThinking || sendingRef.current) return;

      sendingRef.current = true;
      stopSpeaking();
      if (isListening) stopListening();
      resetTranscript();

      setState({ input: '', isThinking: true });
      setState((prev) => ({ messages: [...prev.messages, { role: 'user', text: answer }] }));

      const isLastQuestion = questionCount >= (interviewConfig?.questionCount || 10);

      try {
        if (isLastQuestion) {
          const evalRes = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'evaluate-answer',
              config: { question: currentQ?.question, answer, expectedPoints: currentQ?.expectedPoints },
            }),
          });
          const evaluation = await evalRes.json();
          if (evaluation.error) throw new Error(evaluation.error);

          // Calculate scores
          const kScore = Math.min(10, Math.max(0, evaluation.knowledgeScore ?? evaluation.score ?? 5));
          const cScore = Math.min(10, Math.max(0, evaluation.communicationScore ?? evaluation.score ?? 5));
          const confScore = Math.min(10, Math.max(0, evaluation.confidenceScore ?? evaluation.score ?? 5));

          setState((prev) => ({
            totalScores: {
              knowledge: prev.totalScores.knowledge + kScore,
              communication: prev.totalScores.communication + cScore,
              confidence: prev.totalScores.confidence + confScore,
            },
          }));

          // Update scores (divide by TOTAL expected questions for fair average)
          setTimeout(() => {
            setState((prev) => {
              const totalQs = interviewConfig?.questionCount || 10;
              return {
                scores: {
                  knowledge: Math.round(((prev.totalScores.knowledge + kScore) / totalQs) * 10),
                  communication: Math.round(((prev.totalScores.communication + cScore) / totalQs) * 10),
                  confidence: Math.round(((prev.totalScores.confidence + confScore) / totalQs) * 10),
                },
              };
            });
          }, 0);

          setState((prev) => ({
            reviewData: [
              ...prev.reviewData,
              { question: currentQ?.question, answer, score: evaluation.score, feedback: evaluation.feedback },
            ],
          }));

          const closingMsg = `${evaluation.feedback}\n\nThank you for completing this interview! Let me compile your results.`;
          setState((prev) => ({
            messages: [...prev.messages, { role: 'feedback', text: closingMsg, score: evaluation.score }],
            isThinking: false,
          }));
          sendingRef.current = false;

          if (voiceEnabled) {
            speak(closingMsg, () => setTimeout(() => dispatch({ type: 'SET_PHASE', payload: 'summary' }), 1000));
          } else {
            setTimeout(() => dispatch({ type: 'SET_PHASE', payload: 'summary' }), 2500);
          }
        } else {
          const res = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'interview-respond',
              config: {
                ...interviewConfig,
                question: currentQ?.question,
                expectedPoints: currentQ?.expectedPoints,
                answer,
                history: questionHistory,
                questionNumber: questionCount,
              },
            }),
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error);

          const kScore = Math.min(10, Math.max(0, data.knowledgeScore ?? data.score ?? 5));
          const cScore = Math.min(10, Math.max(0, data.communicationScore ?? data.score ?? 5));
          const confScore = Math.min(10, Math.max(0, data.confidenceScore ?? data.score ?? 5));

          setState((prev) => ({
            totalScores: {
              knowledge: prev.totalScores.knowledge + kScore,
              communication: prev.totalScores.communication + cScore,
              confidence: prev.totalScores.confidence + confScore,
            },
          }));

          setTimeout(() => {
            setState((prev) => {
              const totalQs = interviewConfig?.questionCount || 10;
              return {
                scores: {
                  knowledge: Math.round(((prev.totalScores.knowledge + kScore) / totalQs) * 10),
                  communication: Math.round(((prev.totalScores.communication + cScore) / totalQs) * 10),
                  confidence: Math.round(((prev.totalScores.confidence + confScore) / totalQs) * 10),
                },
              };
            });
          }, 0);

          setState((prev) => ({
            reviewData: [
              ...prev.reviewData,
              { question: currentQ?.question, answer, score: data.score, feedback: data.feedback },
            ],
            currentQ: {
              question: data.nextQuestion,
              expectedPoints: data.nextExpectedPoints,
              difficulty: data.nextDifficulty,
              topic: data.nextTopic,
            },
            questionHistory: [...prev.questionHistory, data.nextQuestion],
            questionCount: prev.questionCount + 1,
            messages: [
              ...prev.messages,
              { role: 'feedback', text: data.feedback, score: data.score },
              { role: 'ai', text: data.nextQuestion },
            ],
            isThinking: false,
          }));
          sendingRef.current = false;

          if (voiceEnabled) {
            const combined = `${data.feedback}. ${data.nextQuestion}`;
            speak(combined, () => {
              if (micEnabled) setState({ awaitingMic: true });
            });
          } else if (micEnabled) {
            setState({ awaitingMic: true });
          }
        }
      } catch (err) {
        clientLogger.error('Error processing answer:', err);
        setState((prev) => ({
          isThinking: false,
          messages: [...prev.messages, { role: 'ai', text: 'I had a brief issue. Could you repeat your answer?' }],
        }));
        sendingRef.current = false;
        if (micEnabled) setState({ awaitingMic: true });
      }
    },
    [
      input,
      isThinking,
      isListening,
      questionCount,
      interviewConfig,
      currentQ,
      questionHistory,
      voiceEnabled,
      micEnabled,
      stopSpeaking,
      stopListening,
      resetTranscript,
      speak,
    ]
  );

  // Keep ref updated
  useEffect(() => {
    submitAnswerRef.current = submitAnswer;
  }, [submitAnswer]);

  /* ─── Save Interview Activity ─── */
  const saveInterviewActivity = useCallback(async () => {
    if (activitySavedRef.current || reviewData.length === 0) return;
    activitySavedRef.current = true;
    try {
      const totalQs = interviewConfig?.questionCount || 10;
      const totalEarned = reviewData.reduce((s, r) => s + (r.score || 0), 0);
      const totalPossible = totalQs * 10;
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'interview',
          title: `${interviewConfig?.interviewType || 'Technical'} Interview — ${interviewConfig?.role || 'General'}`,
          score: totalEarned,
          totalMarks: totalPossible,
          details: {
            role: interviewConfig?.role,
            interviewType: interviewConfig?.interviewType,
            difficulty: interviewConfig?.difficulty,
            topics: interviewConfig?.topics,
            questionsAnswered: reviewData.length,
            totalQuestions: totalQs,
            knowledgeScore: scores.knowledge,
            communicationScore: scores.communication,
            confidenceScore: scores.confidence,
          },
        }),
      });
      if (res.ok) {
        cacheInvalidate('/api/dashboard');
        cacheInvalidate('/api/gamification');
        cacheInvalidate('/api/activities');
        const actData = await res.json();
        if (actData.xp?.xpAwarded) {
          notify({
            emoji: '✨',
            title: `+${actData.xp.xpAwarded} XP earned!`,
            description:
              actData.xp.newBadges?.length > 0
                ? `New badge: ${actData.xp.newBadges.map((b) => b.emoji + ' ' + b.name).join(', ')}`
                : undefined,
          });
        }
      }
    } catch (err) {
      clientLogger.error('Failed to save interview activity:', err);
    }
  }, [reviewData, interviewConfig, scores, notify]);

  /* ─── Exit Interview ─── */
  const exitInterview = useCallback(() => {
    stopSpeaking();
    if (isListening) stopListening();
    sendingRef.current = false;
    if (reviewData.length > 0) {
      const totalQs = interviewConfig?.questionCount || 10;
      const avgScore = Math.round((reviewData.reduce((s, r) => s + (r.score || 0), 0) / (totalQs * 10)) * 100);
      trackInterviewComplete({
        avgScore,
        questionsAnswered: reviewData.length,
        totalQuestions: totalQs,
        interviewType: interviewConfig?.interviewType || 'technical',
        role: interviewConfig?.role || 'Candidate',
      });
      saveInterviewActivity();
      dispatch({ type: 'SET_PHASE', payload: 'summary' });
    } else {
      dispatch({ type: 'RESET' });
    }
  }, [reviewData, interviewConfig, isListening, stopSpeaking, stopListening, saveInterviewActivity]);

  /* ─── Reset All ─── */
  const resetAll = useCallback(() => {
    stopSpeaking();
    if (isListening) stopListening();
    sendingRef.current = false;
    activitySavedRef.current = false;
    clearTimeout(micStartTimeoutRef.current);
    dispatch({ type: 'RESET' });
  }, [isListening, stopSpeaking, stopListening]);

  /* ─── Toggle Question Expand ─── */
  const toggleQuestionExpand = useCallback((idx) => {
    setState((prev) => ({ expandedQuestions: { ...prev.expandedQuestions, [idx]: !prev.expandedQuestions[idx] } }));
  }, []);

  /* ─── Handle Start Interview ─── */
  const handleStartInterview = useCallback(() => {
    const config = getConfig();
    if (!config) return;
    startInterviewWithConfig(config, voiceEnabled, micEnabled);
  }, [getConfig, voiceEnabled, micEnabled, startInterviewWithConfig]);

  /* ─── Setters for child components ─── */
  const setSelectedTemplate = useCallback(
    (val) => {
      setState({ selectedTemplate: typeof val === 'function' ? val(selectedTemplate) : val });
    },
    [selectedTemplate]
  );

  const setShowCustom = useCallback(
    (val) => {
      setState({ showCustom: typeof val === 'function' ? val(showCustom) : val });
    },
    [showCustom]
  );

  const setCustomConfig = useCallback((val) => {
    if (typeof val === 'function') {
      setState((prev) => ({ customConfig: val(prev.customConfig) }));
    } else {
      setState((prev) => ({ customConfig: { ...prev.customConfig, ...val } }));
    }
  }, []);

  const setVoiceEnabled = useCallback(
    (val) => {
      setState({ voiceEnabled: typeof val === 'function' ? val(voiceEnabled) : val });
    },
    [voiceEnabled]
  );

  const setMicEnabled = useCallback(
    (val) => {
      setState({ micEnabled: typeof val === 'function' ? val(micEnabled) : val });
    },
    [micEnabled]
  );

  const setFetchedConfig = useCallback(
    (val) => {
      setState({ fetchedConfig: typeof val === 'function' ? val(fetchedConfig) : val });
    },
    [fetchedConfig]
  );

  const setInput = useCallback(
    (val) => {
      setState({ input: typeof val === 'function' ? val(input) : val });
    },
    [input]
  );

  const setIsThinking = useCallback(
    (val) => {
      setState({ isThinking: typeof val === 'function' ? val(isThinking) : val });
    },
    [isThinking]
  );

  const setMessages = useCallback((val) => {
    setState((prev) => ({ messages: typeof val === 'function' ? val(prev.messages) : val }));
  }, []);

  const setAwaitingMic = useCallback(
    (val) => {
      setState({ awaitingMic: typeof val === 'function' ? val(awaitingMic) : val });
    },
    [awaitingMic]
  );

  const setAnalysis = useCallback(
    (val) => {
      setState({ analysis: typeof val === 'function' ? val(analysis) : val });
    },
    [analysis]
  );

  const setAnalysisLoading = useCallback(
    (val) => {
      setState({ analysisLoading: typeof val === 'function' ? val(analysisLoading) : val });
    },
    [analysisLoading]
  );

  /* ─── Render by phase ─── */
  if (phase === 'setup') {
    return (
      <InterviewSetup
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
        showCustom={showCustom}
        setShowCustom={setShowCustom}
        customConfig={customConfig}
        setCustomConfig={setCustomConfig}
        voiceEnabled={voiceEnabled}
        setVoiceEnabled={setVoiceEnabled}
        micEnabled={micEnabled}
        setMicEnabled={setMicEnabled}
        fetchedConfig={fetchedConfig}
        setFetchedConfig={setFetchedConfig}
        onStartInterview={handleStartInterview}
        sttSupported={sttSupported}
      />
    );
  }

  if (phase === 'summary') {
    return (
      <InterviewSummary
        interviewConfig={interviewConfig}
        reviewData={reviewData}
        scores={scores}
        analysis={analysis}
        setAnalysis={setAnalysis}
        analysisLoading={analysisLoading}
        setAnalysisLoading={setAnalysisLoading}
        expandedQuestions={expandedQuestions}
        onResetAll={resetAll}
        toggleQuestionExpand={toggleQuestionExpand}
      />
    );
  }

  return (
    <InterviewLive
      messages={messages}
      setMessages={setMessages}
      input={input}
      setInput={setInput}
      isThinking={isThinking}
      setIsThinking={setIsThinking}
      questionCount={questionCount}
      interviewConfig={interviewConfig}
      currentQ={currentQ}
      awaitingMic={awaitingMic}
      setAwaitingMic={setAwaitingMic}
      voiceEnabled={voiceEnabled}
      micEnabled={micEnabled}
      scores={scores}
      sendingRef={sendingRef}
      submitAnswerRef={submitAnswerRef}
      micStartTimeoutRef={micStartTimeoutRef}
      onExitInterview={exitInterview}
      // Speech props
      isSpeaking={isSpeaking}
      speak={speak}
      stopSpeaking={stopSpeaking}
      isListening={isListening}
      transcript={transcript}
      sttSupported={sttSupported}
      startListening={startListening}
      stopListening={stopListening}
      resetTranscript={resetTranscript}
    />
  );
}
