"use client";
import { useState, useEffect, useCallback } from "react";
import { Person, Tag } from "@/lib/types";
import { useSpeechRecognition } from "@/lib/hooks/useSpeechRecognition";
import { createPersonPayload } from "@/lib/person";
import { UnderlinedInput } from "./UnderlinedInput";
import { FilterChip } from "./FilterChip";

interface ParsedFields {
  name: string;
  role: string;
  company: string;
  metCity: string;
  location: string;
  notes: string;
  tag: Tag;
}

const EMPTY: ParsedFields = {
  name: "", role: "", company: "", metCity: "", location: "", notes: "", tag: "to-enrich",
};

type Phase = "idle" | "listening" | "parsing" | "review";

interface Props {
  onSave: (payload: Omit<Person, "id" | "meetings">) => void;
  onSaveAndAdd?: (payload: Omit<Person, "id" | "meetings">) => void;
  onClose: () => void;
}

export function VoiceCaptureModal({ onSave, onSaveAndAdd, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [fields, setFields] = useState<ParsedFields>(EMPTY);
  const [parseError, setParseError] = useState<string | null>(null);
  const { transcript, error: micError, startListening, stopListening, reset } = useSpeechRecognition();
  const error = micError ?? parseError;

  const handleStartListening = useCallback(() => {
    startListening();
    setPhase("listening");
  }, [startListening]);

  const stopAndParse = useCallback(async () => {
    const finalTranscript = stopListening();
    if (!finalTranscript) { setPhase("idle"); return; }
    setPhase("parsing");
    try {
      const res = await fetch("/api/voice-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ transcript: finalTranscript }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setParseError(data?.error ?? `Error ${res.status} — check ANTHROPIC_API_KEY in Vercel settings.`);
        setPhase("idle");
        return;
      }
      setFields({ ...EMPTY, ...data });
      setPhase("review");
    } catch (err: any) {
      setParseError(`Network error — ${err?.message ?? "please try again."}`);
      setPhase("idle");
    }
  }, [stopListening]);

  const buildPayload = useCallback(() => createPersonPayload({
    name: fields.name,
    role: fields.role,
    company: fields.company,
    location: fields.location,
    metCity: fields.metCity,
    notes: fields.notes,
    tag: fields.tag,
  }), [fields]);

  const handleSave = useCallback(() => {
    onSave(buildPayload());
    onClose();
  }, [buildPayload, onSave, onClose]);

  const handleSaveAndAdd = useCallback(() => {
    onSaveAndAdd?.(buildPayload());
    setPhase("idle");
    setFields(EMPTY);
    setParseError(null);
    reset();
  }, [buildPayload, onSaveAndAdd, reset]);

  const retry = useCallback(() => {
    setPhase("idle");
    setFields(EMPTY);
    setParseError(null);
    reset();
  }, [reset]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (k: keyof ParsedFields) => (v: string) =>
    setFields(f => ({ ...f, [k]: v }));

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
        width: "100%", maxWidth: 520,
        maxHeight: "90vh", overflowY: "auto",
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
              Form № 02 · voice capture
            </div>
            <h2 style={{ margin: 0, fontSize: 20, fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 400 }}>
              Speak it into existence.
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--muted)", lineHeight: 1, padding: 2 }}
          >✕</button>
        </div>

        {/* Error banner */}
        {error === "permission" ? (
          <div style={{
            background: "var(--ink)", color: "var(--bg)",
            padding: "14px 16px", marginBottom: 20, lineHeight: 1.6,
          }}>
            <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: "0.1em", marginBottom: 10 }}>
              MICROPHONE ACCESS BLOCKED
            </div>
            <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 10 }}>To enable it:</div>
            {/iPad|iPhone|iPod/.test(navigator.userAgent) ? (
              <>
                <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 10 }}>
                  Settings → Privacy &amp; Security → Microphone → turn on <strong>Safari</strong> or <strong>Chrome</strong>
                </div>
              </>
            ) : (
              <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 10 }}>
                <strong>Chrome / Edge:</strong> Click the 🔒 lock in the address bar → Microphone → Allow
              </div>
            )}
            <div style={{ fontSize: 11, opacity: 0.7 }}>Then refresh the page and try again.</div>
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

        {/* Idle */}
        {phase === "idle" && (
          <div style={{ textAlign: "center", padding: "32px 0 24px" }}>
            <p className="mono muted" style={{ fontSize: 10, letterSpacing: "0.12em", marginBottom: 28 }}>
              DESCRIBE WHO YOU MET IN PLAIN LANGUAGE
            </p>
            <button
              onClick={handleStartListening}
              style={{
                background: "none", border: "none",
                fontSize: 42, cursor: "pointer",
                lineHeight: 1,
              }}
            >
              🎤
            </button>
            <p className="mono muted" style={{ fontSize: 9, marginTop: 14, letterSpacing: "0.14em" }}>
              CLICK TO SPEAK
            </p>
          </div>
        )}

        {/* Listening */}
        {phase === "listening" && (
          <div style={{ padding: "16px 0 8px" }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{
                margin: "0 auto 10px",
                fontSize: 42, lineHeight: 1,
                animation: "vc-pulse 1.4s ease-in-out infinite",
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
                minHeight: 48, marginBottom: 24,
              }}>
                "{transcript}"
              </div>
            ) : (
              <p className="mono muted" style={{ fontSize: 10, letterSpacing: "0.08em", textAlign: "center", marginBottom: 24 }}>
                Start speaking…
              </p>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                onClick={retry}
                className="mono muted"
                style={{
                  fontSize: 10, cursor: "pointer", background: "none", border: "none",
                  color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase",
                }}
              >
                ← Start over
              </button>
              <button
                onClick={stopAndParse}
                style={{
                  background: "var(--ink)", color: "var(--bg)", border: "none",
                  padding: "10px 28px",
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 11, letterSpacing: "0.14em",
                  textTransform: "uppercase", cursor: "pointer",
                }}
              >
                Done →
              </button>
            </div>
          </div>
        )}

        {/* Parsing */}
        {phase === "parsing" && (
          <div style={{ textAlign: "center", padding: "52px 0" }}>
            <p className="mono muted" style={{ fontSize: 10, letterSpacing: "0.14em" }}>PARSING…</p>
          </div>
        )}

        {/* Review */}
        {phase === "review" && (
          <div>
            <p className="mono muted" style={{ fontSize: 9, letterSpacing: "0.12em", marginBottom: 22 }}>
              REVIEW + EDIT BEFORE SAVING
            </p>
            <div style={{ display: "grid", gap: 22 }}>
              <VField label="Name" required>
                <UnderlinedInput value={fields.name} onChange={set("name")} placeholder="Full name" autoFocus />
              </VField>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <VField label="Role">
                  <UnderlinedInput value={fields.role} onChange={set("role")} placeholder="What they do" />
                </VField>
                <VField label="Company">
                  <UnderlinedInput value={fields.company} onChange={set("company")} placeholder="Organization" />
                </VField>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <VField label="Met where">
                  <UnderlinedInput value={fields.location} onChange={set("location")} placeholder="Event, venue…" />
                </VField>
                <VField label="City">
                  <UnderlinedInput value={fields.metCity} onChange={set("metCity")} placeholder="City" />
                </VField>
              </div>
              <VField label="Notes">
                <UnderlinedInput value={fields.notes} onChange={set("notes")} placeholder="What to remember" multiline rows={3} />
              </VField>
              <VField label="File under">
                <div style={{ display: "flex", gap: 16, paddingTop: 4, flexWrap: "wrap" }}>
                  {([
                    { tag: "close", label: "friend" },
                    { tag: "networking", label: "networking" },
                    { tag: "to-enrich", label: "new contact" },
                    { tag: "influential", label: "influential" },
                  ] as { tag: Tag; label: string }[]).map(({ tag: t, label }) => (
                    <FilterChip
                      key={t}
                      label={label}
                      active={fields.tag === t}
                      onClick={() => setFields(f => ({ ...f, tag: t }))}
                      color={t === "influential" ? "#2d7a2d" : undefined}
                    />
                  ))}
                </div>
              </VField>
            </div>

            <div style={{
              marginTop: 32, paddingTop: 18, borderTop: "1px solid var(--rule)",
              display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
            }}>
              <button
                onClick={retry}
                className="mono muted"
                style={{
                  fontSize: 10, cursor: "pointer", background: "none", border: "none",
                  color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase",
                  flexShrink: 0,
                }}
              >
                ← Restart
              </button>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {onSaveAndAdd && (
                  <button
                    onClick={handleSaveAndAdd}
                    disabled={!fields.name.trim()}
                    style={{
                      background: "none", color: "#2d7a2d",
                      border: "1px solid #2d7a2d",
                      padding: "9px 16px",
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 10, letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      cursor: fields.name.trim() ? "pointer" : "default",
                      opacity: fields.name.trim() ? 1 : 0.4,
                      whiteSpace: "nowrap",
                    }}
                  >
                    + Add Another
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={!fields.name.trim()}
                  style={{
                    background: "#2d7a2d", color: "#fff", border: "none",
                    padding: "10px 22px",
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 11, letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    cursor: fields.name.trim() ? "pointer" : "default",
                    opacity: fields.name.trim() ? 1 : 0.4,
                    whiteSpace: "nowrap",
                  }}
                >
                  Save entry →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes vc-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(45,122,45,0.4); }
          50% { transform: scale(1.06); box-shadow: 0 0 0 10px rgba(45,122,45,0); }
        }
      `}</style>
    </div>
  );
}

function VField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="uc" style={{ color: "var(--muted)", fontSize: 9, letterSpacing: "0.12em", marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
        <span>{label}</span>
        {required && <span style={{ color: "var(--accent)", fontSize: 9 }}>REQUIRED</span>}
      </div>
      {children}
    </div>
  );
}
