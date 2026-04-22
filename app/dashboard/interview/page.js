'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { HiOutlineLogout } from 'react-icons/hi';
import styles from './interview.module.css';
import InterviewSetup, { interviewTemplates } from './components/InterviewSetup';
import InterviewAvatar, { getOrbState } from './components/InterviewAvatar';
import InterviewChat from './components/InterviewChat';
import InterviewResults from './components/InterviewResults';

/* ─────────────────────────────────────────────
   TTS HOOK — with onEnd callback + Chrome fix
   ───────────────────────────────────────────── */
function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const onEndRef = useRef(null);
  const pollRef = useRef(null);

  const fireOnEnd = useCallback(() => {
    clearInterval(pollRef.current);
    setIsSpeaking(false);
    const cb = onEndRef.current;
    onEndRef.current = null;
    if (cb) cb();
  }, []);

  const speak = useCallback(
    (text, onEnd) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        if (onEnd) onEnd();
        return;
      }
      window.speechSynthesis.cancel();
      clearInterval(pollRef.current);
      onEndRef.current = onEnd || null;

      const clean = text.replace(/\n/g, ' ').replace(/\t/g, ' ').replace(/\r/g, ' ').replace(/  +/g, ' ').trim();
      const utt = new SpeechSynthesisUtterance(clean);
      utt.rate = 1.05;
      utt.pitch = 1.0;
      utt.volume = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find((v) => v.name.includes('Google') && v.lang.startsWith('en')) ||
        voices.find((v) => v.name.includes('Microsoft') && v.lang.startsWith('en') && v.name.includes('Online')) ||
        voices.find((v) => v.lang.startsWith('en-') && v.localService === false) ||
        voices.find((v) => v.lang.startsWith('en'));
      if (preferred) utt.voice = preferred;

      let ended = false;
      utt.onstart = () => setIsSpeaking(true);
      utt.onend = () => {
        if (!ended) {
          ended = true;
          fireOnEnd();
        }
      };
      utt.onerror = () => {
        if (!ended) {
          ended = true;
          fireOnEnd();
        }
      };

      window.speechSynthesis.speak(utt);

      // Chrome bug workaround: onend sometimes never fires.
      pollRef.current = setInterval(() => {
        if (!window.speechSynthesis.speaking && !ended) {
          ended = true;
          fireOnEnd();
        }
      }, 300);
    },
    [fireOnEnd]
  );

  const stop = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    clearInterval(pollRef.current);
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    onEndRef.current = null;
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
    return () => {
      clearInterval(pollRef.current);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return { isSpeaking, speak, stop };
}

/* ─────────────────────────────────────────────
   STT HOOK — with silence detection callback
   ───────────────────────────────────────────── */
function useSpeechRecognition({ onSilence } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const silenceTimerRef = useRef(null);
  const onSilenceRef = useRef(onSilence);
  const hasSpokenRef = useRef(false);

  useEffect(() => {
    onSilenceRef.current = onSilence;
  }, [onSilence]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      let final = finalTranscriptRef.current;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += t + ' ';
          finalTranscriptRef.current = final;
        } else {
          interim += t;
        }
      }
      setTranscript(final + interim);
      hasSpokenRef.current = true;

      // Reset silence timer — user is speaking
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        // 2s of silence after speech → auto-send
        if (hasSpokenRef.current && onSilenceRef.current) {
          const finalText = finalTranscriptRef.current.trim() || (final + interim).trim();
          if (finalText) onSilenceRef.current(finalText);
        }
      }, 2000);
    };

    recognition.onerror = (e) => {
      if (e.error !== 'aborted' && e.error !== 'no-speech') {
        console.warn('Speech recognition error:', e.error);
      }
      clearTimeout(silenceTimerRef.current);
      setIsListening(false);
    };

    recognition.onend = () => {
      clearTimeout(silenceTimerRef.current);
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => clearTimeout(silenceTimerRef.current);
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    finalTranscriptRef.current = '';
    hasSpokenRef.current = false;
    setTranscript('');
    clearTimeout(silenceTimerRef.current);
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      console.warn('Could not start recognition:', e);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    clearTimeout(silenceTimerRef.current);
    recognitionRef.current.stop();
    setIsListening(false);
    return finalTranscriptRef.current.trim() || transcript.trim();
  }, [transcript]);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    hasSpokenRef.current = false;
    setTranscript('');
  }, []);

  return { isListening, transcript, startListening, stopListening, resetTranscript };
}

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
  const [scores, setScores] = useState({ knowledge: 0, communication: 0, confidence: 0 });
  const [totalScores, setTotalScores] = useState({ knowledge: 0, communication: 0, confidence: 0 });
  const [questionCount, setQuestionCount] = useState(0);
  const [currentQ, setCurrentQ] = useState(null);
  const [interviewConfig, setInterviewConfig] = useState(null);
  const [questionHistory, setQuestionHistory] = useState([]);
  const [reviewData, setReviewData] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [awaitingMic, setAwaitingMic] = useState(false);

  const chatRef = useRef(null);
  const sendingRef = useRef(false);
  const activitySavedRef = useRef(false);

  // TTS & STT hooks
  const { isSpeaking, speak, stop: stopSpeaking } = useSpeechSynthesis();
  const { isListening, transcript, startListening, stopListening, resetTranscript } = useSpeechRecognition();

  // Check STT support
  const sttSupported = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

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

    const totalQs = interviewConfig?.questionCount || 10;
    setScores({
      knowledge: Math.round(((totalScores.knowledge + kScore) / totalQs) * 10),
      communication: Math.round(((totalScores.communication + cScore) / totalQs) * 10),
      confidence: Math.round(((totalScores.confidence + confScore) / totalQs) * 10),
    });
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
    setScores({ knowledge: 0, communication: 0, confidence: 0 });
    setTotalScores({ knowledge: 0, communication: 0, confidence: 0 });
    setQuestionCount(0);
    setQuestionHistory([]);
    setReviewData([]);
    setIsThinking(true);

    try {
      const res = await fetch('/api/gemini', {
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
      await fetch('/api/activities', {
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
    setScores({ knowledge: 0, communication: 0, confidence: 0 });
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
  async function fetchAnalysis() {
    if (analysisLoading || analysis) return;
    setAnalysisLoading(true);
    try {
      const res = await fetch('/api/gemini', {
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
  }

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
    <div className={styles.interviewLayout}>
      {/* ── Top Bar ── */}
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <div className={styles.statusDot} />
          <h3>🎤 {interviewConfig?.role || 'Interview'}</h3>
          <span className={styles.questionBadge}>
            Q{questionCount}/{interviewConfig?.questionCount || 10}
          </span>
        </div>
        <div className={styles.topBarRight}>
          <button
            className={styles.modeToggle}
            onClick={() => setViewMode((v) => (v === 'avatar' ? 'transcript' : 'avatar'))}
          >
            {viewMode === 'avatar' ? '📝 Transcript' : '🤖 Simple'}
          </button>
          <button className={styles.exitBtn} onClick={exitInterview}>
            <HiOutlineLogout /> Exit
          </button>
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
