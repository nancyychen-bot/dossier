"use client";
import { Person } from "@/lib/types";
import { FrameTag } from "./FrameTag";
import { Squiggle } from "./Squiggle";
import { fmtDate, isComplete } from "@/lib/utils";

interface EnrichViewProps {
  people: Person[];
  onOpen: (id: string) => void;
}

export function EnrichView({ people, onOpen }: EnrichViewProps) {
  const toEnrich = people.filter(p => !p.enriched && !isComplete(p));

  return (
    <div>
      {/* Editorial lede */}
      <div style={{ paddingBottom: 28, borderBottom: "1px solid var(--ink)", marginBottom: 36 }}>
        <div className="uc muted" style={{ marginBottom: 12 }}>Task list · acquaintances to enrich</div>
        <h1 className="serif-display-instr" style={{
          margin: 0,
          fontSize: "clamp(44px, 6.5vw, 84px)",
          lineHeight: 0.95,
          letterSpacing: "-0.015em",
        }}>
          To enrich.<br />
          <span className="ital muted">{toEnrich.length} {toEnrich.length === 1 ? "entry" : "entries"} waiting.</span>
        </h1>
      </div>

      {toEnrich.length === 0 ? (
        <div style={{ padding: "60px 0", textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
          <Squiggle width={120} style={{ marginBottom: 20, opacity: 0.6, color: "var(--muted)" }} />
          <div className="serif ital" style={{ fontSize: 22, lineHeight: 1.3 }}>
            Your dossier is in order. Everyone is accounted for.
          </div>
        </div>
      ) : (
        <>
          {toEnrich.map(p => (
            <EnrichRow key={p.id} person={p} onOpen={() => onOpen(p.id)} />
          ))}
        </>
      )}
    </div>
  );
}

function EnrichRow({ person, onOpen }: { person: Person; onOpen: () => void }) {
  const metDate = person.captured ? fmtDate(person.captured) : "";
  return (
    <div
      onClick={onOpen}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        padding: "18px 0",
        borderBottom: "1px solid var(--rule)",
        cursor: "pointer",
        gap: 24,
        alignItems: "baseline",
      }}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
    >
      <div>
        <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.015em", marginBottom: 3 }}>
          {person.name}
          {person.role && (
            <span className="muted" style={{ fontWeight: 400, fontSize: 13 }}> · {person.role}</span>
          )}
        </div>
        <div className="ital muted" style={{ fontSize: 13, marginBottom: 6 }}>
          Met at {person.location}{person.metCity ? ` · ${person.metCity}` : ""}{metDate ? ` · ${metDate}` : ""}
        </div>
        <div style={{ fontSize: 13, display: "flex", gap: 14, flexWrap: "wrap" }}>
          {!person.linkedin && <span className="muted">✕ no linkedin</span>}
        </div>
      </div>
      <FrameTag>acquaintance →</FrameTag>
    </div>
  );
}
