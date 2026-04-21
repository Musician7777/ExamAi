'use client';
import { useState, useEffect, useRef } from 'react';
import { HiOutlineLogout } from 'react-icons/hi';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Send, AudioLines, LogOut } from 'lucide-react';
import { BarVisualizer } from '@/components/ui/bar-visualizer';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ui/conversation';
import { Message, MessageContent } from '@/components/ui/message';
import { Response } from '@/components/ui/response';
import { ShimmeringText } from '@/components/ui/shimmering-text';
import clientLogger from '@/lib/client-logger';

/* ─────────────────────────────────────────────
   INTERVIEW LIVE COMPONENT
   ───────────────────────────────────────────── */
export default function InterviewLive({
  // State
  messages,
  setMessages,
  input,
  setInput,
  isThinking,
  setIsThinking,
  questionCount,
  interviewConfig,
  currentQ,
  awaitingMic,
  setAwaitingMic,
  voiceEnabled,
  micEnabled,
  scores,
  // Refs
  sendingRef,
  submitAnswerRef,
  micStartTimeoutRef,
  // Functions
  onExitInterview,
  // Speech props passed from parent
  isSpeaking,
  speak,
  stopSpeaking,
  isListening,
  transcript,
  sttSupported,
  startListening,
  stopListening,
  resetTranscript,
}) {
  const [viewMode, setViewMode] = useState('live');

  const chatRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, isThinking]);

  // Sync transcript → input in transcript mode
  useEffect(() => {
    if (isListening && transcript) setInput(transcript);
  }, [transcript, isListening, setInput]);

  // Auto-start mic when awaitingMic becomes true and we're not thinking/speaking
  useEffect(() => {
    if (awaitingMic && !isSpeaking && !isThinking && micEnabled && sttSupported) {
      setAwaitingMic(false);
      clearTimeout(micStartTimeoutRef.current);
      micStartTimeoutRef.current = setTimeout(() => {
        clientLogger.debug('[Interview] Auto-starting mic (awaitingMic)');
        startListening();
      }, 150);
    }
    return () => clearTimeout(micStartTimeoutRef.current);
  }, [
    awaitingMic,
    isSpeaking,
    isThinking,
    micEnabled,
    sttSupported,
    startListening,
    setAwaitingMic,
    micStartTimeoutRef,
  ]);

  // Watch for isSpeaking transition: was speaking → stopped → auto-start mic
  const prevSpeakingRef = useRef(false);
  useEffect(() => {
    if (prevSpeakingRef.current && !isSpeaking && micEnabled && sttSupported) {
      if (!isThinking && !sendingRef.current && !isListening) {
        clearTimeout(micStartTimeoutRef.current);
        micStartTimeoutRef.current = setTimeout(() => {
          if (!sendingRef.current && !isThinking) {
            clientLogger.debug('[Interview] Auto-starting mic after TTS ended');
            startListening();
          }
        }, 200);
      }
    }
    prevSpeakingRef.current = isSpeaking;
  }, [isSpeaking, isThinking, isListening, micEnabled, sttSupported, startListening, sendingRef, micStartTimeoutRef]);

  // Auto-restart mic if browser stops recognition unexpectedly
  const prevListeningRef = useRef(false);
  useEffect(() => {
    if (prevListeningRef.current && !isListening && micEnabled && sttSupported) {
      if (!isSpeaking && !isThinking && !sendingRef.current) {
        const t = setTimeout(() => {
          if (!sendingRef.current && !isSpeaking && !isThinking) {
            clientLogger.debug('[Interview] Auto-restarting mic after unexpected stop');
            startListening();
          }
        }, 800);
        prevListeningRef.current = isListening;
        return () => clearTimeout(t);
      }
    }
    prevListeningRef.current = isListening;
  }, [isListening, isSpeaking, isThinking, micEnabled, sttSupported, startListening, sendingRef]);

  /* ─── Manual mic toggle ─── */
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

  /* ─── Manual send ─── */
  function manualSend() {
    const text = input.trim();
    if (!text) return;
    if (isListening) stopListening();
    submitAnswerRef.current?.(text);
  }

  /* ─── Determine agent state for BarVisualizer ─── */
  function getAgentState() {
    if (isThinking) return 'thinking';
    if (isSpeaking) return 'speaking';
    if (isListening) return 'listening';
    if (awaitingMic) return 'initializing';
    return 'listening';
  }

  const agentState = getAgentState();

  /* ─── Typing-dot keyframes ─── */
  const typingDotCSS = `@keyframes typing-dot { 0%, 100% { transform: translateY(0); opacity: 0.5; } 50% { transform: translateY(-5px); opacity: 1; } }`;

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] bg-background">
      <style dangerouslySetInnerHTML={{ __html: typingDotCSS }} />

      {/* ─── Top Bar ─── */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-card/80 backdrop-blur-sm z-10 shrink-0">
        <Badge variant="outline" className="text-sm py-1.5 px-4 font-mono tracking-wide border-border/60">
          {interviewConfig?.topics?.[0] || 'Topic'} Q {String(questionCount).padStart(2, '0')}/
          {interviewConfig?.questionCount || 10}
        </Badge>

        <Tabs value={viewMode} onValueChange={setViewMode}>
          <TabsList className="h-9 bg-secondary/60 backdrop-blur">
            <TabsTrigger
              value="live"
              className="text-xs sm:text-sm px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Live
            </TabsTrigger>
            <TabsTrigger
              value="transcript"
              className="text-xs sm:text-sm px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Transcript
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          variant="ghost"
          size="sm"
          onClick={onExitInterview}
          className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Exit</span>
        </Button>
      </header>

      {/* ─── LIVE TAB ─── */}
      {viewMode === 'live' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
          <div className="flex flex-col items-center gap-6 w-full max-w-xl">
            <BarVisualizer
              state={agentState}
              demo={true}
              barCount={24}
              minHeight={10}
              maxHeight={90}
              centerAlign={false}
              className="h-48 md:h-56 w-full"
            />

            <div className="inline-flex items-center justify-center gap-2.5 px-6 py-2 rounded-full bg-secondary/60 backdrop-blur border border-border/40 text-sm font-semibold uppercase tracking-wider text-muted-foreground shadow-sm min-w-44">
              {isThinking && <ShimmeringText text="Processing..." className="text-sm" />}
              {isSpeaking && <ShimmeringText text="Interviewer Speaking" className="text-sm" />}
              {isListening && (
                <>
                  <span className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                  <span>Listening...</span>
                </>
              )}
              {!isThinking && !isSpeaking && !isListening && <span>{awaitingMic ? 'Preparing Mic...' : 'Ready'}</span>}
            </div>
          </div>
        </div>
      )}

      {/* ─── TRANSCRIPT TAB ─── */}
      {viewMode === 'transcript' && (
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full border-x border-border/40 bg-card overflow-hidden">
          <Conversation className="flex-1">
            <ConversationContent className="p-4 sm:p-6 pb-2">
              {messages.length === 0 && !isThinking ? (
                <ConversationEmptyState
                  icon={
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-muted-foreground/60">
                      <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.8" />
                      <circle cx="12" cy="5" r="2" fill="currentColor" opacity="0.5" />
                      <circle cx="5" cy="12" r="2" fill="currentColor" opacity="0.5" />
                      <circle cx="19" cy="12" r="2" fill="currentColor" opacity="0.5" />
                    </svg>
                  }
                  title={
                    agentState === 'connecting' || agentState === 'initializing' ? (
                      <ShimmeringText text="Starting conversation" />
                    ) : (
                      'Start a conversation'
                    )
                  }
                  description="Type a message or tap the voice button"
                />
              ) : (
                <>
                  {messages.map((msg, i) => {
                    if (msg.role === 'feedback') {
                      return (
                        <div
                          key={i}
                          className="my-4 p-4 rounded-xl bg-secondary/20 border border-border/50 self-center mx-4 sm:mx-12 animate-in fade-in duration-300"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <Badge variant="outline" className="text-xs">
                              📝 Feedback
                            </Badge>
                            {msg.score !== undefined && (
                              <span
                                className={cn(
                                  'font-bold text-sm',
                                  msg.score >= 7 ? 'text-success' : msg.score >= 4 ? 'text-warning' : 'text-destructive'
                                )}
                              >
                                Score: {msg.score}/10
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            {msg.text.split('\n').map((line, j) => (
                              <span key={j} className="block">
                                {line.startsWith('**') ? (
                                  <strong className="text-foreground">{line.replace(/\n/g, '')}</strong>
                                ) : (
                                  line
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    const role = msg.role === 'ai' ? 'assistant' : 'user';
                    return (
                      <Message key={i} from={role}>
                        <MessageContent>
                          <Response
                            className={cn(
                              role === 'assistant'
                                ? 'bg-secondary/50 text-foreground rounded-tl-sm'
                                : 'bg-brand text-brand-foreground rounded-tr-sm'
                            )}
                          >
                            {msg.text.split('\n').map((line, j) => (
                              <span key={j} className="block">
                                {line.startsWith('**') ? <strong>{line.replace(/\n/g, '')}</strong> : line}
                              </span>
                            ))}
                          </Response>
                        </MessageContent>
                        {role === 'assistant' && (
                          <div className="ring-border/50 size-7 flex-shrink-0 self-end overflow-hidden rounded-full ring-1 bg-secondary/60 flex items-center justify-center">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              className="text-muted-foreground"
                            >
                              <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.8" />
                              <circle cx="12" cy="5" r="1.5" fill="currentColor" opacity="0.5" />
                              <circle cx="5" cy="12" r="1.5" fill="currentColor" opacity="0.5" />
                              <circle cx="19" cy="12" r="1.5" fill="currentColor" opacity="0.5" />
                            </svg>
                          </div>
                        )}
                      </Message>
                    );
                  })}

                  {isThinking && (
                    <Message from="assistant">
                      <MessageContent>
                        <div className="px-4 py-4 rounded-2xl bg-secondary/50 rounded-tl-sm flex gap-1.5 items-center">
                          <div
                            className="w-2 h-2 rounded-full bg-muted-foreground"
                            style={{ animation: 'typing-dot 1.4s infinite ease-in-out' }}
                          />
                          <div
                            className="w-2 h-2 rounded-full bg-muted-foreground"
                            style={{ animation: 'typing-dot 1.4s infinite ease-in-out 0.2s' }}
                          />
                          <div
                            className="w-2 h-2 rounded-full bg-muted-foreground"
                            style={{ animation: 'typing-dot 1.4s infinite ease-in-out 0.4s' }}
                          />
                        </div>
                      </MessageContent>
                      <div className="ring-border/50 size-7 flex-shrink-0 self-end overflow-hidden rounded-full ring-1 bg-secondary/60 flex items-center justify-center">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          className="text-muted-foreground animate-pulse"
                        >
                          <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.8" />
                          <circle cx="12" cy="5" r="1.5" fill="currentColor" opacity="0.5" />
                          <circle cx="5" cy="12" r="1.5" fill="currentColor" opacity="0.5" />
                          <circle cx="19" cy="12" r="1.5" fill="currentColor" opacity="0.5" />
                        </svg>
                      </div>
                    </Message>
                  )}

                  {isListening && transcript && (
                    <Message from="user">
                      <MessageContent>
                        <Response className="bg-brand/70 text-brand-foreground rounded-tr-sm italic opacity-80">
                          🎙️ {transcript}
                        </Response>
                      </MessageContent>
                    </Message>
                  )}
                </>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          {/* ─── Input Footer ─── */}
          <div className="px-4 py-3 bg-background border-t border-border/40 shrink-0">
            <div className="flex items-center gap-2 max-w-4xl mx-auto">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    manualSend();
                  }
                }}
                placeholder={isListening ? 'Listening... speak your answer' : 'Type a message...'}
                className="h-10 flex-1 focus-visible:ring-0 focus-visible:ring-offset-0 bg-card border-border/60"
                disabled={isThinking}
              />
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={manualSend}
                disabled={isThinking || !input.trim()}
              >
                <Send className="w-4 h-4" />
                <span className="sr-only">Send message</span>
              </Button>
              {micEnabled && sttSupported && (
                <Button
                  size="icon"
                  variant={isListening ? 'secondary' : 'ghost'}
                  className={cn(
                    'rounded-full h-10 w-10 shrink-0 transition-all',
                    isListening
                      ? 'text-destructive bg-destructive/10 animate-pulse shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={toggleMic}
                  disabled={isThinking}
                >
                  <AudioLines className="w-4 h-4" />
                  <span className="sr-only">{isListening ? 'Stop listening' : 'Start voice'}</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
