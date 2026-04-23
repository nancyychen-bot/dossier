"use client";
import { useState, useMemo, useCallback } from "react";
import { Person, Tag, TAG_META } from "@/lib/types";
import { FrameTag } from "./FrameTag";
import { FilterChip } from "./FilterChip";
import { getQuarterLabel, fmtDate, isComplete } from "@/lib/utils";
import { Squiggle } from "./Squiggle";

interface ListViewProps {
  people: Person[];
  onOpen: (id: string) => void;
}

type Filter = "all" | "to-enrich" | "networking" | "close";

export function ListView({ people, onOpen }: ListViewProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let rows = people;
    if (filter === "to-enrich") rows = rows.filter(p => !p.enriched && !isComplete(p));
    else if (filter === "networking") rows = rows.filter(p => p.tags.includes("networking"));
    else if (filter === "close") rows = rows.filter(p => p.tags.includes("close"));
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter(p =>
        (p.name + " " + p.role + " " + p.company + " " + p.met + " " + (p.notes || "")).toLowerCase().includes(q)
      );
    }
    return rows;
  }, [people, filter, query]);

  const counts = useMemo(() => ({
    all: people.length,
    "to-enrich": people.filter(p => !p.enriched && !isComplete(p)).length,
    networking: people.filter(p => p.tags.includes("networking")).length,
    close: people.filter(p => p.tags.includes("close")).length,
  }), [people]);

  const lastUpdated = useMemo(() => {
    if (!people.length) return "";
    const dates = people.flatMap(p => p.meetings?.map(m => m.date) || [p.captured]);
    const latest = dates.filter(Boolean).sort().reverse()[0];
    return fmtDate(latest);
  }, [people]);

  return (
    <div>
      {/* Editorial masthead */}
      <div style={{
        paddingBottom: 28,
        borderBottom: "1px solid var(--ink)",
        marginBottom: 36,
      }}>
        <div className="uc muted" style={{ marginBottom: 12 }}>
          Issue № {String(people.length).padStart(3, "0")} · {getQuarterLabel()}
        </div>
        <h1 className="serif-display-instr" style={{
          margin: 0,
          fontSize: "clamp(44px, 6.5vw, 84px)",
          lineHeight: 0.95,
          letterSpacing: "-0.015em",
        }}>
          Everyone you&apos;ve ever<br />
          met <span style={{ fontStyle: "italic" }}>in one place</span>.
        </h1>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid var(--ink)", paddingBottom: 6 }}>
          <span className="uc muted" style={{ fontSize: 10, whiteSpace: "nowrap" }}>Search ⌕</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="name, role, place…"
            style={{ fontSize: 16, padding: "4px 0", flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--ink)", fontFamily: "inherit" }}
          />
          {query && (
            <button onClick={() => setQuery("")} className="mono" style={{ fontSize: 11, color: "var(--muted)", cursor: "pointer", background: "none", border: "none" }}>✕</button>
          )}
        </div>
        {/* Filters + count */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "baseline" }}>
            <FilterChip label="all"          count={counts.all}          active={filter === "all"}         onClick={() => setFilter("all")} />
            <FilterChip label="incomplete"   count={counts["to-enrich"]} active={filter === "to-enrich"}   onClick={() => setFilter("to-enrich")} />
            <FilterChip label="acquaintance" count={counts.networking}   active={filter === "networking"}  onClick={() => setFilter("networking")} />
            <FilterChip label="friend"       count={counts.close}        active={filter === "close"}        onClick={() => setFilter("close")} />
          </div>
          <div className="mono muted" style={{ fontSize: 10 }}>
            {String(people.length).padStart(3, "0")} entries · updated {lastUpdated}
          </div>
        </div>
      </div>

      {/* Desktop table header */}
      <div className="hide-mobile list-row-inner" style={{
        padding: "10px 0",
        borderTop: "1px solid var(--ink)",
        borderBottom: "1px solid var(--rule)",
        position: "sticky",
        top: 50,
        background: "var(--bg)",
        zIndex: 2,
        alignItems: "baseline",
      }}>
        <div className="uc muted">Name</div>
        <div className="uc muted">Role · Company</div>
        <div className="uc muted">Met at</div>
        <div className="uc muted" style={{ textAlign: "right" }}>Status</div>
      </div>

      {/* Mobile list header */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid var(--ink)", borderBottom: "1px solid var(--rule)" }}>
        <span className="uc muted">Entries</span>
        <span className="mono muted" style={{ fontSize: 10 }}>{String(filtered.length).padStart(3, "0")}</span>
      </div>

      {/* Rows */}
      {filtered.length === 0 ? (
        <EmptyList query={query} filter={filter} />
      ) : (
        filtered.map((p) => (
          <PersonRow key={p.id} p={p} onOpen={() => onOpen(p.id)} entryNum={people.indexOf(p) + 1} />
        ))
      )}

      {/* Bottom mark */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "56px 0 24px", color: "var(--muted)" }}>
        <div className="mono" style={{ fontSize: 11 }}>{String(filtered.length).padStart(3, "0")} of {String(people.length).padStart(3, "0")} shown</div>
        <div style={{ fontSize: 14 }}>✐</div>
        <div className="mono" style={{ fontSize: 11 }}>↩ end of dossier</div>
      </div>
    </div>
  );
}

function PersonRow({ p, onOpen, entryNum }: { p: Person; onOpen: () => void; entryNum: number }) {
  const [hover, setHover] = useState(false);
  const statusTag = p.tags.find(t => ["close", "networking", "to-enrich"].includes(t));
  const isIncomplete = !p.enriched && !isComplete(p);

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="list-row-inner"
      style={{
        padding: "14px 0",
        borderBottom: "1px solid var(--rule)",
        cursor: "pointer",
        background: hover ? "rgba(17,17,17,0.015)" : "transparent",
        transition: "background 60ms",
      }}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
    >
      {/* Col 1 — Name stack */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0, flexWrap: "wrap" }}>
          <span className="mono" style={{ fontSize: 10, color: "var(--muted)", flexShrink: 0 }}>
            {String(entryNum).padStart(3, "0")}
          </span>
          <span style={{
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: "-0.015em",
            borderBottom: hover ? "1px solid var(--ink)" : "1px solid transparent",
            paddingBottom: 1,
            overflowWrap: "break-word",
          }}>
            {p.name}
          </span>
          {isIncomplete && <span style={{ color: "var(--accent)", fontSize: 11 }} title="incomplete entry">●</span>}
        </div>
      </div>

      {/* Col 2 — Role · Company (desktop) */}
      <div className="hide-mobile" style={{ fontSize: 13, minWidth: 0, overflowWrap: "break-word", lineHeight: 1.35 }}>
        <span>{p.role}</span>
        {p.company && p.company !== "—" && <span className="muted">, {p.company}</span>}
      </div>

      {/* Col 3 — Met at (desktop) */}
      <div className="hide-mobile ital muted" style={{ fontSize: 13, minWidth: 0, overflowWrap: "break-word", lineHeight: 1.35 }}>
        {p.met}
        {p.metCity && <span style={{ fontStyle: "normal" }}> · {p.metCity}</span>}
      </div>

      {/* Col 4 — Status */}
      <div style={{ textAlign: "right", alignSelf: "start" }}>
        {statusTag && (
          <FrameTag accent={isIncomplete}>
            {TAG_META[statusTag].label}
          </FrameTag>
        )}
      </div>
    </div>
  );
}

function EmptyList({ query, filter }: { query: string; filter: Filter }) {
  const line = query
    ? `Nothing matches "${query}". Try a shorter word, or check the spelling.`
    : filter === "to-enrich"
    ? "Nothing incomplete. Either you've done the work, or you haven't met anyone new."
    : filter === "close"
    ? "No friends yet. That's honest. Keep going."
    : "Your dossier is empty. Go meet someone interesting.";

  return (
    <div style={{ padding: "80px 0", textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
      <Squiggle width={120} style={{ marginBottom: 20, opacity: 0.6, color: "var(--muted)" }} />
      <div className="serif" style={{ fontSize: 22, lineHeight: 1.3, color: "var(--ink)", fontStyle: "italic" }}>
        {line}
      </div>
    </div>
  );
}
