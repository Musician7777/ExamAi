'use client';

/* ─────────────────────────────────────────────
   INTERVIEW AVATAR COMPONENT
   ───────────────────────────────────────────── */
export default function InterviewAvatar({ orbState, isThinking, isSpeaking, isListening, currentQ, transcript }) {
  const orbAnimStyle = {
    orbIdle: { animation: 'orbIdle 4s ease-in-out infinite' },
    orbThinking: {
      animation: 'orbThink 1.2s ease-in-out infinite',
      background:
        'radial-gradient(circle at 40% 38%, rgba(139,92,246,0.45), rgba(99,102,241,0.3) 60%, transparent 100%)',
    },
    orbSpeaking: {
      animation: 'orbSpeak 0.8s ease-in-out infinite',
      background:
        'radial-gradient(circle at 40% 38%, rgba(139,92,246,0.5), rgba(99,102,241,0.35) 60%, transparent 100%)',
    },
    orbListening: {
      animation: 'orbListen 1.5s ease-in-out infinite',
      background: 'radial-gradient(circle at 40% 38%, rgba(239,68,68,0.3), rgba(99,102,241,0.2) 60%, transparent 100%)',
    },
  };

  const orbCoreStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 40% 38%, rgba(139,92,246,0.35), rgba(99,102,241,0.2) 60%, transparent 100%)',
    boxShadow: '0 0 50px rgba(99,102,241,0.15)',
    transition: 'transform 0.5s ease, box-shadow 0.5s ease, background 0.5s ease',
    ...orbAnimStyle[orbState],
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-0 gap-6 p-6">
      {/* AI Orb */}
      <div className="relative w-40 h-40 flex items-center justify-center">
        <div style={orbCoreStyle} />
      </div>

      {/* Status Label */}
      <div className="text-center max-w-[600px]">
        {isThinking && (
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Thinking...</div>
        )}
        {isSpeaking && (
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Speaking</div>
        )}
        {isListening && (
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
            <span
              className="w-2 h-2 bg-destructive rounded-full"
              style={{ animation: 'blink 1s step-start infinite' }}
            />
            Listening
          </div>
        )}
        {!isThinking && !isSpeaking && !isListening && (
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Ready</div>
        )}

        {/* Current question */}
        {currentQ?.question && !isThinking && (
          <div className="text-base font-medium text-foreground leading-relaxed mb-4">{currentQ.question}</div>
        )}

        {/* Live transcript while user speaks */}
        {isListening && transcript && (
          <div className="text-sm text-muted-foreground italic leading-relaxed px-5 py-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg min-h-[40px]">
            &ldquo;{transcript}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   HELPER: Get orb state class based on current state
   ───────────────────────────────────────────── */
export function getOrbState(isThinking, isSpeaking, isListening) {
  if (isThinking) return 'orbThinking';
  if (isSpeaking) return 'orbSpeaking';
  if (isListening) return 'orbListening';
  return 'orbIdle';
}
