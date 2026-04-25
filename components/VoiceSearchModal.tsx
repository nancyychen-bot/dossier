"use client";
import { useState, useEffect, useCallback } from "react";
import { useSpeechRecognition } from "@/lib/hooks/useSpeechRecognition";

interface Props {
  onResult: (transcript: string) => void;
  onClose: () => void;
}

type Phase = "idle" | "listening";

export function VoiceSearchModal({ onResult, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const { transcript, error, startListening, stopListening } = useSpeechRecognition();

  const handleStartListening = useCallback(() => {
    startListening();
    setPhase("listening");
  }, [startListening]);

  const stopAndSearch = useCallback(() => {
    const final = stopListening();
    if (final) onResult(final);
    onClose();
  }, [stopListening, onResult, onClose]);

  // Auto-start when modal opens
  useEffect(() => { handleStartListening(); }, [handleStartListening]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.52)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div style={{
        background: "var(--bg)",
        border: "1px solid var(--ink)",
        width: "100%", maxWidth: 440,
        padding: "24px 28px 28px",
        position: "relative",
      }}>
        {/* Title row */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          borderBottom: "1px solid var(--ink)", paddingBottom: 16, marginBottom: 24,
        }}>
          <div>
            <div className="mono uc muted" style={{ fontSize: 9, letterSpacing: "0.15em", marginBottom: 5 }}>
              Voice search
            </div>
            <h2 style={{ margin: 0, fontSize: 20, fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 400 }}>
              Ask a question.
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--muted)", lineHeight: 1, padding: 2 }}
          >✕</button>
        </div>

        {/* Permission error */}
        {error === "permission" ? (
          <div style={{
            background: "var(--ink)", color: "var(--bg)",
            padding: "14px 16px", marginBottom: 20, lineHeight: 1.6,
          }}>
            <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: "0.1em", marginBottom: 10 }}>
              MICROPHONE ACCESS BLOCKED
            </div>
            {/iPad|iPhone|iPod/.test(navigator.userAgent) ? (
              <div style={{ fontSize: 11, opacity: 0.8 }}>
                Settings → Privacy &amp; Security → Microphone → enable browser
              </div>
            ) : (
              <div style={{ fontSize: 11, opacity: 0.8 }}>
                Click the lock in the address bar → Microphone → Allow, then refresh.
              </div>
            )}
          </div>
        ) : error ? (
          <div style={{
            background: "var(--ink)", color: "var(--bg)",
            padding: "8px 12px", fontSize: 11,
            fontFamily: '"JetBrains Mono", monospace',
            letterSpacing: "0.04em", marginBottom: 20,
          }}>
            {error}
          </div>
        ) : null}

        {/* Idle (before auto-start kicks in) */}
        {phase === "idle" && !error && (
          <div style={{ textAlign: "center", padding: "32px 0 24px" }}>
            <p className="mono muted" style={{ fontSize: 10, letterSpacing: "0.12em" }}>Starting…</p>
          </div>
        )}

        {/* Listening */}
        {phase === "listening" && (
          <div style={{ padding: "8px 0" }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{
                margin: "0 auto 10px",
                fontSize: 42, lineHeight: 1,
                animation: "vs-pulse 1.4s ease-in-out infinite",
              }}>🎤</div>
              <span className="mono" style={{ fontSize: 10, color: "#2d7a2d", letterSpacing: "0.15em" }}>
                ● LISTENING
              </span>
            </div>

            {transcript ? (
              <div style={{
                borderLeft: "2px solid var(--rule)", paddingLeft: 14,
                fontFamily: "Georgia, serif", fontStyle: "italic",
                fontSize: 15, lineHeight: 1.65, color: "var(--ink)",
                minHeight: 40, marginBottom: 24,
              }}>
                "{transcript}"
              </div>
            ) : (
              <p className="mono muted" style={{ fontSize: 10, letterSpacing: "0.08em", textAlign: "center", marginBottom: 24 }}>
                Try: "Who did I meet at the AI conference?" or "Who mentioned bird watching?"
              </p>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                onClick={onClose}
                className="mono muted"
                style={{
                  fontSize: 10, cursor: "pointer", background: "none", border: "none",
                  color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase",
                }}
              >
                ← Cancel
              </button>
              <button
                onClick={stopAndSearch}
                style={{
                  background: "var(--ink)", color: "var(--bg)", border: "none",
                  padding: "10px 28px",
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 11, letterSpacing: "0.14em",
                  textTransform: "uppercase", cursor: "pointer",
                }}
              >
                Search →
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes vs-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
      `}</style>
    </div>
  );
}
