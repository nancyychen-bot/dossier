"use client";
import { useState } from "react";
import { Squiggle } from "./Squiggle";
import { useDossier } from "@/lib/store";

export function LoginView() {
  const { signIn } = useDossier();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError(null);
    const { error } = await signIn("", password);
    setLoading(false);
    if (error) setError(error);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    fontSize: 18,
    padding: "8px 0 10px",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid var(--ink)",
    outline: "none",
    color: "var(--ink)",
    fontFamily: "inherit",
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

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 28 }}>
            <div className="uc muted" style={{ marginBottom: 8 }}>Password</div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
              required
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{ marginBottom: 20, fontSize: 13, color: "var(--accent)", fontFamily: '"JetBrains Mono", monospace' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--ink)",
              paddingBottom: 2,
              cursor: loading || !password ? "default" : "pointer",
              opacity: !password ? 0.35 : 1,
              background: "none",
              border: "none",
              borderBottom: "1px solid var(--ink)",
              display: "inline-flex",
              gap: 8,
            }}
          >
            <span>{loading ? "Signing in…" : "Sign in"}</span>
            {!loading && <span style={{ fontWeight: 400 }}>→</span>}
          </button>
        </form>

        <div style={{ marginTop: 80, display: "flex", alignItems: "center", gap: 16 }}>
          <Squiggle width={70} style={{ opacity: 0.4, color: "var(--muted)" }} />
          <div className="mono muted" style={{ fontSize: 10 }}>© DOSSIER · PRIVATE EDITION</div>
        </div>
      </div>
    </div>
  );
}
