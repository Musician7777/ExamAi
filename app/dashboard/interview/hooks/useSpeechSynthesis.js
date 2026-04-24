'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { secureFetch } from '@/lib/client-csrf';
import clientLogger from '@/lib/client-logger';
import { trackFeatureUsed } from '@/lib/ga';

/**
 * Text-to-Speech hook with Kokoro TTS API + browser fallback.
 * Supports onEnd callback and Chrome bug workaround.
 */
export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const onEndRef = useRef(null);
  const pollRef = useRef(null);
  const audioRef = useRef(null);
  const objectUrlRef = useRef(null);

  const fireOnEnd = useCallback(() => {
    clearInterval(pollRef.current);
    pollRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setIsSpeaking(false);
    const cb = onEndRef.current;
    onEndRef.current = null;
    if (cb) cb();
  }, []);

  const speakWithBrowserFallback = useCallback(
    (text) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        fireOnEnd();
        return;
      }

      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
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
    clearInterval(pollRef.current);
    pollRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    onEndRef.current = null;
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    async (text, onEnd) => {
      stop();
      onEndRef.current = onEnd || null;
      const clean = text
        .replace(/\*\*/g, '')
        .replace(/---/g, '')
        .replace(/\n{2,}/g, '. ')
        .replace(/\n/g, '. ')
        .trim();
      if (!clean) {
        fireOnEnd();
        return;
      }

      try {
        trackFeatureUsed({ featureName: 'tts', context: 'kokoro_api' });
        const res = await secureFetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: clean }),
        });

        if (!res.ok) {
          trackFeatureUsed({ featureName: 'tts', context: 'browser_fallback' });
          speakWithBrowserFallback(clean);
          return;
        }

        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objectUrl;
        const audio = new Audio(objectUrl);
        audioRef.current = audio;

        let ended = false;
        const finalize = () => {
          if (ended) return;
          ended = true;
          fireOnEnd();
        };

        audio.onended = finalize;
        audio.onerror = () => {
          if (!ended) {
            ended = true;
            if (objectUrlRef.current) {
              URL.revokeObjectURL(objectUrlRef.current);
              objectUrlRef.current = null;
            }
            audioRef.current = null;
            trackFeatureUsed({ featureName: 'tts', context: 'browser_fallback' });
            speakWithBrowserFallback(clean);
          }
        };

        setIsSpeaking(true);
        await audio.play();
      } catch (e) {
        clientLogger.warn('TTS API failed, falling back to browser speech:', e.message);
        trackFeatureUsed({ featureName: 'tts', context: 'browser_fallback' });
        speakWithBrowserFallback(clean);
      }
    },
    [fireOnEnd, speakWithBrowserFallback, stop]
  );

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
    return () => {
      stop();
    };
  }, [stop]);

  return { isSpeaking, speak, stop };
}
