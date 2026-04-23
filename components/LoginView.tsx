"use client";
import { useState } from "react";
import { Squiggle } from "./Squiggle";
import { useDossier } from "@/lib/store";

export function LoginView() {
  const { signIn } = useDossier();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    const { error } = await signIn(email.trim());
    setLoading(false);
    if (error) { setError(error); return; }
    setSent(true);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "flex-start",
    }}>
      <div className="container" style={{ maxWidth: 560, paddingBlock: "80px 120px" }}>
        {/* Masthead */}
        <div style={{ marginBottom: 48, paddingBottom: 28, borderBottom: "1px solid var(--ink)" }}>
          <div className="uc muted" style={{ marginBottom: 12 }}>Dossier · private edition</div>
          <h1 className="serif-display-instr" style={{
            margin: 0,
            fontSize: "clamp(44px, 8vw, 88px)",
            lineHeight: 0.94,
            letterSpacing: "-0.015em",
          }}>
            Your people.<br />
            <span style={{ fontStyle: "italic" }}>Sign in</span> to continue.
          </h1>
        </div>

        {sent ? (
          <div>
            <div style={{
              background: "var(--ink)",
              color: "var(--bg)",
              padding: "16px 20px",
              marginBottom: 24,
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 12,
              letterSpacing: "0.04em",
            }}>
              ✓ LINK SENT TO {email.toUpperCase()}
            </div>
            <div className="serif ital" style={{ fontSize: 18, lineHeight: 1.5, color: "var(--muted)", maxWidth: "42ch" }}>
              Check your inbox. The link expires in an hour — click it from the device you want to use.
            </div>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              style={{
                marginTop: 24,
                fontSize: 13,
                color: "var(--muted)",
                borderBottom: "1px solid var(--rule)",
                paddingBottom: 1,
                cursor: "pointer",
                background: "none",
                border: "none",
              }}
            >
              ← Use a different address
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 28 }}>
              <div className="uc muted" style={{ marginBottom: 8 }}>Email address</div>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
                required
                style={{
                  width: "100%",
                  fontSize: 18,
                  padding: "8px 0 10px",
                  borderBottom: "1px solid var(--ink)",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--ink)",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {error && (
              <div style={{
                marginBottom: 20,
                fontSize: 13,
                color: "var(--accent)",
                fontFamily: '"JetBrains Mono", monospace',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--ink)",
                borderBottom: "1px solid var(--ink)",
                paddingBottom: 2,
                cursor: loading || !email.trim() ? "default" : "pointer",
                opacity: !email.trim() ? 0.35 : 1,
                background: "none",
                border: "none",
                display: "inline-flex",
                gap: 8,
              }}
            >
              <span>{loading ? "Sending…" : "Send magic link"}</span>
              {!loading && <span style={{ fontWeight: 400 }}>→</span>}
            </button>

            <div className="serif ital muted" style={{ marginTop: 32, fontSize: 14, lineHeight: 1.5 }}>
              No password. We'll send a one-time link to your inbox.
            </div>
          </form>
        )}

        {/* Footer mark */}
        <div style={{ marginTop: 80, display: "flex", alignItems: "center", gap: 16 }}>
          <Squiggle width={70} style={{ opacity: 0.4, color: "var(--muted)" }} />
          <div className="mono muted" style={{ fontSize: 10 }}>© DOSSIER · PRIVATE EDITION</div>
        </div>
      </div>
    </div>
  );
}
