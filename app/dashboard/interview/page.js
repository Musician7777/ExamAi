'use client';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { HiOutlineLogout } from 'react-icons/hi';
import InterviewSetup, { interviewTemplates } from './components/InterviewSetup';
import InterviewAvatar, { getOrbState } from './components/InterviewAvatar';
import InterviewChat from './components/InterviewChat';
import InterviewResults from './components/InterviewResults';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { secureFetch } from '@/lib/client-csrf';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */
export default function InterviewPage() {
  const [phase, setPhase] = useState('setup');
  const [viewMode, setViewMode] = useState('avatar');

  // Setup state
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customConfig, setCustomConfig] = useState({
    role: '',
    company: '',
    topics: [],
    difficulty: 'Medium',
    questionCount: 10,
    tone: 'Professional',
  });
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);

  // Interview state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [totalScores, setTotalScores] = useState({ knowledge: 0, communication: 0, confidence: 0 });
  const [questionCount, setQuestionCount] = useState(0);
  const [currentQ, setCurrentQ] = useState(null);
  const [interviewConfig, setInterviewConfig] = useState(null);
  // Derive display scores from totals so they can never go out of sync
  const scores = useMemo(() => {
    const totalQs = interviewConfig?.questionCount || 10;
    return {
      knowledge: Math.round((totalScores.knowledge / totalQs) * 10),
      communication: Math.round((totalScores.communication / totalQs) * 10),
      confidence: Math.round((totalScores.confidence / totalQs) * 10),
    };
  }, [totalScores, interviewConfig]);
  const [questionHistory, setQuestionHistory] = useState([]);
  const [reviewData, setReviewData] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [awaitingMic, setAwaitingMic] = useState(false);

  const chatRef = useRef(null);
  const sendingRef = useRef(false);
  const activitySavedRef = useRef(false);

  // TTS & STT hooks — use the proper hook implementations from hooks/
  const { isSpeaking, speak, stop: stopSpeaking } = useSpeechSynthesis();
  const {
    isListening,
    transcript,
    supported: sttSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, isThinking]);

  // Sync transcript → input in transcript mode
  useEffect(() => {
    if (isListening && transcript) setInput(transcript);
  }, [transcript, isListening]);

  // Auto-start mic when awaitingMic becomes true
  useEffect(() => {
    if (awaitingMic && !isSpeaking && !isThinking && micEnabled && sttSupported && phase === 'interview') {
      setAwaitingMic(false);
      const t = setTimeout(() => startListening(), 500);
      return () => clearTimeout(t);
    }
  }, [awaitingMic, isSpeaking, isThinking, micEnabled, sttSupported, phase, startListening]);

  // Fallback: watch isSpeaking go from true→false to trigger mic
  const wasSpeakingRef = useRef(false);
  useEffect(() => {
    if (
      wasSpeakingRef.current &&
      !isSpeaking &&
      !isThinking &&
      micEnabled &&
      sttSupported &&
      phase === 'interview' &&
      !isListening
    ) {
      const t = setTimeout(() => startListening(), 800);
      wasSpeakingRef.current = false;
      return () => clearTimeout(t);
    }
    wasSpeakingRef.current = isSpeaking;
  }, [isSpeaking, isThinking, micEnabled, sttSupported, phase, isListening, startListening]);

  /* ─── Config ─── */
  function getConfig() {
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
  }

  /* ─── Request mic permission ─── */
  async function requestMicPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      return true;
    } catch {
      return false;
    }
  }

  /* ─── Score update helper ─── */
  function updateScores(evaluation) {
    const kScore = Math.min(10, Math.max(0, evaluation.knowledgeScore ?? evaluation.score ?? 5));
    const cScore = Math.min(10, Math.max(0, evaluation.communicationScore ?? evaluation.score ?? 5));
    const confScore = Math.min(10, Math.max(0, evaluation.confidenceScore ?? evaluation.score ?? 5));

    setTotalScores((prev) => ({
      knowledge: prev.knowledge + kScore,
      communication: prev.communication + cScore,
      confidence: prev.confidence + confScore,
    }));
  }

  /* ─── Start Interview ─── */
  async function startInterview() {
    const config = getConfig();
    if (!config) return;

    if (micEnabled && sttSupported) {
      await requestMicPermission();
    }

    setInterviewConfig(config);
    setPhase('interview');
    setMessages([]);
    setTotalScores({ knowledge: 0, communication: 0, confidence: 0 });
    setQuestionCount(0);
    setQuestionHistory([]);
    setReviewData([]);
    setIsThinking(true);

    try {
      const res = await secureFetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'interview-question', config: { ...config, history: [] } }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const greeting = `Hello! I'll be your interviewer today for the ${config.role} position${config.company ? ` at ${config.company}` : ''}. Let's get started.\n\n${data.question}`;

      setCurrentQ(data);
      setQuestionHistory([data.question]);
      setQuestionCount(1);
      setMessages([{ role: 'ai', text: greeting }]);
      setIsThinking(false);

      if (voiceEnabled) {
        speak(greeting, () => {
          if (micEnabled) setAwaitingMic(true);
        });
      } else if (micEnabled) {
        setAwaitingMic(true);
      }
    } catch {
      setIsThinking(false);
      setMessages([{ role: 'ai', text: 'Sorry, I had trouble getting started. Please try again.' }]);
    }
  }

  /* ─── Submit Answer ─── */
  async function submitAnswer(answerText) {
    const answer = (answerText || input).trim();
    if (!answer || isThinking || sendingRef.current) return;

    sendingRef.current = true;
    stopSpeaking();
    if (isListening) stopListening();
    resetTranscript();

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: answer }]);
    setIsThinking(true);

    const isLastQuestion = questionCount >= (interviewConfig?.questionCount || 10);

    try {
      if (isLastQuestion) {
        const evalRes = await secureFetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'evaluate-answer',
            config: { question: currentQ?.question, answer, expectedPoints: currentQ?.expectedPoints },
          }),
        });
        const evaluation = await evalRes.json();
        if (evaluation.error) throw new Error(evaluation.error);

        updateScores(evaluation);
        setReviewData((prev) => [
          ...prev,
          { question: currentQ?.question, answer, score: evaluation.score, feedback: evaluation.feedback },
        ]);

        const closingMsg = `${evaluation.feedback}\n\nThank you for completing this interview! Let me compile your results.`;
        setMessages((prev) => [...prev, { role: 'feedback', text: closingMsg, score: evaluation.score }]);
        setIsThinking(false);
        sendingRef.current = false;

        if (voiceEnabled) {
          speak(closingMsg, () => setTimeout(() => setPhase('summary'), 1000));
        } else {
          setTimeout(() => setPhase('summary'), 2500);
        }
      } else {
        const res = await secureFetch('/api/gemini', {
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

        updateScores(data);
        setReviewData((prev) => [
          ...prev,
          { question: currentQ?.question, answer, score: data.score, feedback: data.feedback },
        ]);

        const nextQ = {
          question: data.nextQuestion,
          expectedPoints: data.nextExpectedPoints,
          difficulty: data.nextDifficulty,
          topic: data.nextTopic,
        };
        setCurrentQ(nextQ);
        setQuestionHistory((prev) => [...prev, data.nextQuestion]);
        setQuestionCount((c) => c + 1);

        setMessages((prev) => [
          ...prev,
          { role: 'feedback', text: data.feedback, score: data.score },
          { role: 'ai', text: data.nextQuestion },
        ]);
        setIsThinking(false);
        sendingRef.current = false;

        if (voiceEnabled) {
          const combined = `${data.feedback}. ${data.nextQuestion}`;
          speak(combined, () => {
            if (micEnabled) setAwaitingMic(true);
          });
        } else if (micEnabled) {
          setAwaitingMic(true);
        }
      }
    } catch {
      setIsThinking(false);
      sendingRef.current = false;
      setMessages((prev) => [...prev, { role: 'ai', text: 'I had a brief issue. Could you repeat your answer?' }]);
      if (micEnabled) setAwaitingMic(true);
    }
  }

  /* ─── Mic toggle (transcript mode) ─── */
  function toggleMic() {
    if (isListening) {
      const finalText = stopListening();
      if (finalText) setInput(finalText);
    } else {
      stopSpeaking();
      resetTranscript();
      setInput('');
      startListening();
    }
  }

  /* ─── Save interview result to DB ─── */
  async function saveInterviewActivity(data) {
    if (activitySavedRef.current) return;
    activitySavedRef.current = true;
    try {
      const totalQs = interviewConfig?.questionCount || 10;
      const totalEarned = data.reduce((s, r) => s + (r.score || 0), 0);
      const totalPossible = totalQs * 10;
      await secureFetch('/api/activities', {
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
            questionsAnswered: data.length,
            totalQuestions: totalQs,
            knowledgeScore: scores.knowledge,
            communicationScore: scores.communication,
            confidenceScore: scores.confidence,
          },
        }),
      });
    } catch (err) {
      console.error('Failed to save interview activity:', err);
    }
  }

  /* ─── Exit Interview (early exit → results) ─── */
  function exitInterview() {
    stopSpeaking();
    if (isListening) stopListening();
    sendingRef.current = false;
    if (reviewData.length > 0) {
      saveInterviewActivity(reviewData);
      setPhase('summary');
    } else {
      resetAll();
    }
  }

  function resetAll() {
    stopSpeaking();
    if (isListening) stopListening();
    sendingRef.current = false;
    setPhase('setup');
    setMessages([]);
    setQuestionCount(0);
    setCurrentQ(null);
    setInterviewConfig(null);
    setQuestionHistory([]);
    setReviewData([]);
    setTotalScores({ knowledge: 0, communication: 0, confidence: 0 });
    setInput('');
    setIsThinking(false);
    setAwaitingMic(false);
    setAnalysis(null);
    setAnalysisLoading(false);
    setExpandedQuestions({});
    activitySavedRef.current = false;
  }

  /* ─── Fetch AI Analysis ─── */
  const fetchAnalysis = useCallback(async () => {
    if (analysisLoading || analysis) return;
    setAnalysisLoading(true);
    try {
      const res = await secureFetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'interview-analysis',
          config: { reviewData, interviewConfig, scores },
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data);
    } catch (err) {
      console.error('Failed to fetch analysis:', err);
      const avgScoreForAnalysis =
        reviewData.length > 0
          ? Math.round(
              (reviewData.reduce((s, r) => s + (r.score || 0), 0) / ((interviewConfig?.questionCount || 10) * 10)) * 100
            )
          : 0;
      setAnalysis({
        overallVerdict: 'Analysis could not be generated. Review your Q&A below for self-assessment.',
        overallGrade:
          avgScoreForAnalysis >= 80 ? 'A' : avgScoreForAnalysis >= 60 ? 'B' : avgScoreForAnalysis >= 40 ? 'C' : 'D',
        readinessLevel: avgScoreForAnalysis >= 70 ? 'Almost Ready' : 'Needs Improvement',
        strengthAreas: [],
        improvementAreas: [],
        topicBreakdown: [],
        communicationFeedback: { clarity: '', depth: '', examples: '', tips: [] },
        nextSteps: ['Review feedback on each question', 'Practice weak areas', 'Try another mock interview'],
        mockInterviewTip: 'Consistent practice is key. Each interview teaches you something new.',
      });
    } finally {
      setAnalysisLoading(false);
    }
  }, [analysisLoading, analysis, reviewData, interviewConfig, scores]);

  function toggleQuestionExpand(idx) {
    setExpandedQuestions((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }

  /* ═══════════════════════════════════════════
       RENDER: SETUP
       ═══════════════════════════════════════════ */
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
        sttSupported={sttSupported}
        onStart={startInterview}
      />
    );
  }

  /* ═══════════════════════════════════════════
       RENDER: SUMMARY
       ═══════════════════════════════════════════ */
  if (phase === 'summary') {
    return (
      <InterviewResults
        interviewConfig={interviewConfig}
        scores={scores}
        reviewData={reviewData}
        expandedQuestions={expandedQuestions}
        onToggleQuestionExpand={toggleQuestionExpand}
        analysis={analysis}
        analysisLoading={analysisLoading}
        onFetchAnalysis={fetchAnalysis}
        onRestart={resetAll}
      />
    );
  }

  /* ═══════════════════════════════════════════
       RENDER: LIVE INTERVIEW
       ═══════════════════════════════════════════ */
  const orbState = getOrbState(isThinking, isSpeaking, isListening);

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] max-w-[1100px] animate-in fade-in duration-300">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border rounded-lg mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <h3 className="text-sm font-bold">🎤 {interviewConfig?.role || 'Interview'}</h3>
          <Badge
            variant="outline"
            className="text-[11px] px-2.5 py-0.5 bg-indigo-500/12 text-indigo-400 border-indigo-500/30 font-semibold"
          >
            Q{questionCount}/{interviewConfig?.questionCount || 10}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode((v) => (v === 'avatar' ? 'transcript' : 'avatar'))}
            className="text-xs font-semibold gap-1"
          >
            {viewMode === 'avatar' ? '📝 Transcript' : '🤖 Simple'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={exitInterview}
            className="gap-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs font-semibold"
          >
            <HiOutlineLogout className="w-4 h-4" /> Exit
          </Button>
        </div>
      </div>

      {/* ══ AVATAR MODE ══ */}
      {viewMode === 'avatar' && (
        <InterviewAvatar
          orbState={orbState}
          isThinking={isThinking}
          isSpeaking={isSpeaking}
          isListening={isListening}
          currentQ={currentQ}
          transcript={transcript}
        />
      )}

      {/* ══ TRANSCRIPT MODE ══ */}
      {viewMode === 'transcript' && (
        <InterviewChat
          messages={messages}
          isThinking={isThinking}
          transcript={transcript}
          isListening={isListening}
          input={input}
          setInput={setInput}
          onSend={() => submitAnswer()}
          micEnabled={micEnabled}
          sttSupported={sttSupported}
          onToggleMic={toggleMic}
          chatRef={chatRef}
        />
      )}
    </div>
  );
}
