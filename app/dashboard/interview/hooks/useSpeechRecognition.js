'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import clientLogger from '@/lib/client-logger';

/**
 * Speech-to-Text hook — resilient version.
 * Uses Web Speech API with auto-restart when the browser stops recognition
 * due to silence (no auto-send). The user must manually submit their answer.
 */
export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const intentionalStopRef = useRef(false);
  const restartTimerRef = useRef(null);

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
    };

    recognition.onerror = (e) => {
      if (e.error !== 'aborted' && e.error !== 'no-speech') {
        clientLogger.warn('Speech recognition error:', e.error);
      }
      // On 'no-speech' error, browser may fire onend next — auto-restart
      // will handle it. For other errors, stop cleanly.
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        intentionalStopRef.current = true;
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // If we didn't intentionally stop, auto-restart to keep the mic alive.
      // This handles the browser silently stopping after silence or no-speech.
      if (!intentionalStopRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = setTimeout(() => {
          try {
            recognition.start();
            // Keep isListening true — seamless restart
          } catch {
            // If restart fails, give up gracefully
            setIsListening(false);
          }
        }, 300);
        return;
      }
      // Intentional stop — clean up
      intentionalStopRef.current = false;
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => clearTimeout(restartTimerRef.current);
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    intentionalStopRef.current = false;
    finalTranscriptRef.current = '';
    setTranscript('');
    clearTimeout(restartTimerRef.current);
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      clientLogger.warn('Could not start recognition:', e);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    intentionalStopRef.current = true;
    clearTimeout(restartTimerRef.current);
    recognitionRef.current.stop();
    setIsListening(false);
    return finalTranscriptRef.current.trim() || transcript.trim();
  }, [transcript]);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    setTranscript('');
  }, []);

  return { isListening, transcript, supported, startListening, stopListening, resetTranscript };
}
