'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import clientLogger from '@/lib/client-logger';

/**
 * Speech-to-Text hook with silence detection callback.
 * Uses Web Speech API with auto-send after 2s of silence.
 */
export function useSpeechRecognition({ onSilence } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(true);
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
    if (!SR) {
      setSupported(false); // eslint-disable-line react-hooks/set-state-in-effect -- SSR check, runs once on mount
      return;
    }

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
        clientLogger.warn('Speech recognition error:', e.error);
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
      clientLogger.warn('Could not start recognition:', e);
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

  return { isListening, transcript, supported, startListening, stopListening, resetTranscript };
}
