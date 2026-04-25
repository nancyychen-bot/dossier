"use client";
import { useState, useEffect } from "react";
import { Person } from "@/lib/types";

interface Props {
  person: Person;
  onClose: () => void;
}

export function DraftEmailModal({ person, onClose }: Props) {
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    fetch("/api/draft-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ person }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setEmail(data.email ?? "");
      })
      .catch(err => setError(err?.message ?? "Network error"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copy = () => {
    if (!email) return;
    navigator.clipboard.writeText(email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

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
        width: "100%", maxWidth: 560,
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
              Draft · follow-up email
            </div>
            <h2 style={{ margin: 0, fontSize: 20, fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 400 }}>
              To: {person.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--muted)", lineHeight: 1, padding: 2 }}
          >✕</button>
        </div>

        {/* Loading */}
        {!email && !error && (
          <div style={{ textAlign: "center", padding: "52px 0" }}>
            <p className="mono muted" style={{ fontSize: 10, letterSpacing: "0.14em" }}>DRAFTING…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: "var(--ink)", color: "var(--bg)",
            padding: "8px 12px", fontSize: 11,
            fontFamily: '"JetBrains Mono", monospace',
            letterSpacing: "0.04em", marginBottom: 20,
          }}>
            {error}
          </div>
        )}

        {/* Email body */}
        {email && (
          <>
            <div style={{
              borderLeft: "2px solid var(--rule)",
              paddingLeft: 18,
              fontFamily: "Georgia, serif",
              fontSize: 16,
              lineHeight: 1.75,
              color: "var(--ink)",
              whiteSpace: "pre-wrap",
              marginBottom: 28,
            }}>
              {email}
            </div>

            <div style={{
              paddingTop: 16,
              borderTop: "1px solid var(--rule)",
              display: "flex",
              gap: 16,
              alignItems: "baseline",
              justifyContent: "space-between",
            }}>
              <span className="mono muted" style={{ fontSize: 9, letterSpacing: "0.1em" }}>
                REVIEW BEFORE SENDING
              </span>
              <div style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
                <button
                  onClick={onClose}
                  className="muted"
                  style={{ fontSize: 13, cursor: "pointer", background: "none", border: "none", color: "var(--muted)" }}
                >
                  Close
                </button>
                <button
                  onClick={copy}
                  style={{
                    background: copied ? "#2d7a2d" : "var(--ink)",
                    color: "var(--bg)",
                    border: "none",
                    padding: "10px 24px",
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "background 180ms",
                  }}
                >
                  {copied ? "Copied ✓" : "Copy →"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
