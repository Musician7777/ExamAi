'use client';
import { HiOutlineMicrophone } from 'react-icons/hi';
import { cn } from '@/lib/utils';

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
      <div className="my-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/12 self-start max-w-[80%] animate-in slide-in-from-bottom-2 duration-200">
        <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-2">
          📝 Feedback
        </div>
        {msg.score !== undefined && (
          <div
            className={cn(
              'inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-bold mb-1',
              msg.score >= 7
                ? 'bg-green-500/12 text-green-400'
                : msg.score >= 4
                  ? 'bg-amber-500/12 text-amber-400'
                  : 'bg-red-500/12 text-red-400'
            )}
          >
            Score: {msg.score}/10
          </div>
        )}
        <div className="text-sm text-muted-foreground leading-relaxed">
          <MessageContent text={msg.text} />
        </div>
      </div>
    );
  }

  const isAi = msg.role === 'ai';
  return (
    <div
      className={cn(
        'max-w-[80%] p-3 rounded-lg text-sm leading-relaxed animate-in slide-in-from-bottom-2 duration-200',
        isAi ? 'bg-secondary self-start rounded-bl-sm' : 'bg-indigo-500/10 text-foreground self-end rounded-br-sm'
      )}
    >
      <div
        className={cn(
          'text-[11px] font-bold uppercase tracking-wider mb-1',
          isAi ? 'text-indigo-400' : 'text-green-400'
        )}
      >
        {isAi ? '🤖 Interviewer' : '👤 You'}
      </div>
      <MessageContent text={msg.text} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   TYPING INDICATOR
   ───────────────────────────────────────────── */
function TypingIndicator() {
  return (
    <div className="flex gap-1 p-3 self-start">
      {[0, 0.2, 0.4].map((delay, i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-muted-foreground"
          style={{ animation: `typingFloat 1.5s ease-in-out infinite ${delay}s` }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   CHAT INPUT COMPONENT
   ───────────────────────────────────────────── */
export function ChatInput({ input, setInput, onSend, isThinking, isListening, micEnabled, sttSupported, onToggleMic }) {
  return (
    <div className="flex gap-2 bg-card border rounded-lg p-3 items-end shrink-0">
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
        className="flex-1 p-3 bg-secondary border rounded-md text-foreground resize-none min-h-[44px] max-h-[100px] outline-none text-sm leading-relaxed focus:border-indigo-500"
      />
      <div className="flex gap-2">
        {micEnabled && sttSupported && (
          <button
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer',
              isListening
                ? 'bg-red-500/15 border border-red-400 text-red-400 animate-pulse'
                : 'bg-secondary border border-border text-muted-foreground hover:border-indigo-400 hover:text-indigo-400'
            )}
            onClick={onToggleMic}
            disabled={isThinking}
          >
            <HiOutlineMicrophone className="w-[18px] h-[18px]" />
          </button>
        )}
        <button
          className={cn(
            'w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white flex items-center justify-center transition-all shrink-0 cursor-pointer',
            'hover:shadow-[0_2px_10px_rgba(99,102,241,0.4)] hover:scale-105',
            (isThinking || !input.trim()) && 'opacity-40 scale-100 cursor-not-allowed'
          )}
          onClick={onSend}
          disabled={isThinking || !input.trim()}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
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
    <div className="flex-1 flex flex-col min-h-0">
      <div
        ref={chatRef}
        className="flex-1 overflow-y-auto bg-card border rounded-lg p-5 flex flex-col gap-3 mb-3 min-h-0"
      >
        {messages.map((msg, i) => (
          <Message key={i} msg={msg} />
        ))}
        {isThinking && <TypingIndicator />}
      </div>

      {isListening && transcript && (
        <div className="text-xs text-muted-foreground italic px-3 -mt-1 mb-1 shrink-0">🎙️ {transcript}</div>
      )}

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
