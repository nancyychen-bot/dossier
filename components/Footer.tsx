"use client";
import { Squiggle } from "./Squiggle";

export function Footer() {
  return (
    <footer className="container foot-grid">
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div className="uc muted">About</div>
        <div className="serif ital" style={{ fontSize: 15, maxWidth: "42ch", lineHeight: 1.45 }}>
          A private dossier for forgetful people.<br />
          Designed by{" "}
          <a
            href="https://x.com/nancy_y_chen"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--ink)", borderBottom: "1px solid var(--ink)", paddingBottom: 1 }}
          >
            Nancy Chen
          </a>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <Squiggle width={90} style={{ opacity: 0.5, color: "var(--muted)" }} />
        <div className="mono muted" style={{ fontSize: 10 }}>※ EST. 2026</div>
      </div>
    </footer>
  );
}
