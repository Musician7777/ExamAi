'use client';
import styles from '../interview.module.css';

/* ─────────────────────────────────────────────
   INTERVIEW AVATAR COMPONENT
   ───────────────────────────────────────────── */
export default function InterviewAvatar({ orbState, isThinking, isSpeaking, isListening, currentQ, transcript }) {
  return (
    <div className={styles.avatarMode}>
      {/* AI Orb */}
      <div className={`${styles.orbContainer} ${styles[orbState]}`}>
        <div className={styles.orbCore} />
      </div>

      {/* Status Label */}
      <div className={styles.avatarStatus}>
        {isThinking && <div className={styles.statusLabel}>Thinking...</div>}
        {isSpeaking && <div className={styles.statusLabel}>Speaking</div>}
        {isListening && (
          <div className={styles.statusLabel}>
            <span className={styles.recDot} /> Listening
          </div>
        )}
        {!isThinking && !isSpeaking && !isListening && <div className={styles.statusLabel}>Ready</div>}

        {/* Current question */}
        {currentQ?.question && !isThinking && <div className={styles.currentQuestion}>{currentQ.question}</div>}

        {/* Live transcript while user speaks */}
        {isListening && transcript && <div className={styles.liveTranscript}>&ldquo;{transcript}&rdquo;</div>}
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
