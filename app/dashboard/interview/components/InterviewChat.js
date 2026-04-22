'use client';
import { HiOutlineMicrophone } from 'react-icons/hi';
import styles from '../interview.module.css';

/* ─────────────────────────────────────────────
   MESSAGE RENDERER
   ───────────────────────────────────────────── */
function MessageContent({ text }) {
  return text.split('\n').map((line, j) => (
    <span key={j}>
      {line.startsWith('**') ? <strong>{line.replace(/\n/g, '')}</strong> : line}
      <br />
    </span>
  ));
}

/* ─────────────────────────────────────────────
   INDIVIDUAL MESSAGE COMPONENT
   ───────────────────────────────────────────── */
function Message({ msg }) {
  if (msg.role === 'feedback') {
    return (
      <div className={styles.feedbackMsg}>
        <div className={styles.msgLabel}>📝 Feedback</div>
        {msg.score !== undefined && (
          <div
            className={`${styles.feedbackScore} ${
              msg.score >= 7 ? styles.high : msg.score >= 4 ? styles.mid : styles.low
            }`}
          >
            Score: {msg.score}/10
          </div>
        )}
        <MessageContent text={msg.text} />
      </div>
    );
  }

  return (
    <div className={`${styles.message} ${msg.role === 'ai' ? styles.aiMsg : styles.userMsg}`}>
      <div className={styles.msgLabel}>{msg.role === 'ai' ? '🤖 Interviewer' : '👤 You'}</div>
      <MessageContent text={msg.text} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   TYPING INDICATOR
   ───────────────────────────────────────────── */
function TypingIndicator() {
  return (
    <div className={styles.typing}>
      <div className={styles.typingDot} />
      <div className={styles.typingDot} />
      <div className={styles.typingDot} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   CHAT INPUT COMPONENT
   ───────────────────────────────────────────── */
export function ChatInput({ input, setInput, onSend, isThinking, isListening, micEnabled, sttSupported, onToggleMic }) {
  return (
    <div className={styles.chatInputArea}>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={isListening ? 'Listening... speak your answer' : 'Type your answer...'}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        disabled={isThinking}
      />
      <div className={styles.inputActions}>
        {micEnabled && sttSupported && (
          <button
            className={`${styles.micBtn} ${isListening ? styles.recording : ''}`}
            onClick={onToggleMic}
            disabled={isThinking}
          >
            <HiOutlineMicrophone />
          </button>
        )}
        <button className={styles.sendBtn} onClick={onSend} disabled={isThinking || !input.trim()}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN INTERVIEW CHAT COMPONENT
   ───────────────────────────────────────────── */
export default function InterviewChat({
  messages,
  isThinking,
  transcript,
  isListening,
  input,
  setInput,
  onSend,
  micEnabled,
  sttSupported,
  onToggleMic,
  chatRef,
}) {
  return (
    <div className={styles.transcriptMode}>
      <div className={styles.chatMessages} ref={chatRef}>
        {messages.map((msg, i) => (
          <Message key={i} msg={msg} index={i} />
        ))}
        {isThinking && <TypingIndicator />}
      </div>

      {isListening && transcript && <div className={styles.transcriptLive}>🎙️ {transcript}</div>}

      <ChatInput
        input={input}
        setInput={setInput}
        onSend={onSend}
        isThinking={isThinking}
        isListening={isListening}
        micEnabled={micEnabled}
        sttSupported={sttSupported}
        onToggleMic={onToggleMic}
      />
    </div>
  );
}
