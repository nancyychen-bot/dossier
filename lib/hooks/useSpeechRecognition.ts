"use client";
import { useState, useRef, useCallback, useEffect } from "react";

interface UseSpeechRecognitionReturn {
  transcript: string;
  error: string | null;
  isListening: boolean;
  startListening: () => void;
  /** Stops recognition and returns the final transcript. */
  stopListening: () => string;
  /** Clears transcript and error without touching recognition state. */
  reset: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const stoppingRef = useRef(false);
  const accumulatedRef = useRef("");
  // Keep ref in sync so onend closure can read current value without re-subscribing
  isListeningRef.current = isListening;

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setError("Voice capture requires Chrome or Safari.");
      return;
    }
    setError(null);
    setTranscript("");
    accumulatedRef.current = "";
    stoppingRef.current = false;

    const startSession = () => {
      if (stoppingRef.current) return;
      const rec = new SR();
      // continuous: false is more reliable on Safari — we restart manually on onend
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = "en-US";

      let sessionFinal = "";

      rec.onresult = (e: any) => {
        let final = "";
        let interim = "";
        for (let i = 0; i < e.results.length; i++) {
          if (e.results[i].isFinal) final += e.results[i][0].transcript + " ";
          else interim += e.results[i][0].transcript;
        }
        if (final) sessionFinal = (sessionFinal + " " + final).trim();
        setTranscript((accumulatedRef.current + " " + sessionFinal + " " + interim).trim());
      };

      rec.onerror = (e: any) => {
        if (e.error === "not-allowed" || e.error === "permission-denied") {
          setError("permission");
          setIsListening(false);
        }
        // transient errors (no-speech etc.) — let onend handle restart
      };

      rec.onend = () => {
        if (sessionFinal) {
          accumulatedRef.current = (accumulatedRef.current + " " + sessionFinal).trim();
        }
        if (isListeningRef.current && !stoppingRef.current) {
          startSession();
        }
      };

      recognitionRef.current = rec;
      try { rec.start(); } catch { /* ignore double-start */ }
    };

    startSession();
    setIsListening(true);
  }, []);

  const stopListening = useCallback((): string => {
    stoppingRef.current = true;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    // transcript state has the most complete value (accumulated + session + interim)
    return transcript.trim();
  }, [transcript]);

  const reset = useCallback(() => {
    setTranscript("");
    setError(null);
  }, []);

  // IMPORTANT: set stoppingRef before stop() so onend doesn't restart on unmount
  useEffect(() => () => {
    stoppingRef.current = true;
    recognitionRef.current?.stop();
  }, []);

  return { transcript, error, isListening, startListening, stopListening, reset };
}
