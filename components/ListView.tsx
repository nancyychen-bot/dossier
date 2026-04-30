"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
import { Person, Tag, TAG_META } from "@/lib/types";
import { FrameTag } from "./FrameTag";
import { FilterChip } from "./FilterChip";
import { VoiceSearchModal } from "./VoiceSearchModal";
import { getQuarterLabel, fmtDate } from "@/lib/utils";
import { Squiggle } from "./Squiggle";

interface ListViewProps {
  people: Person[];
  onOpen: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkUpdate?: (ids: string[], patch: Partial<Person>) => void;
}

type Filter = "all" | "networking" | "close" | "influential";

type AiResult = { id: string; reason: string };

export function ListView({ people, onOpen, onBulkDelete, onBulkUpdate }: ListViewProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [aiResults, setAiResults] = useState<AiResult[] | null>(null);
  const [aiSearching, setAiSearching] = useState(false);
  const [showVoiceSearch, setShowVoiceSearch] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const runAiSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setAiSearching(true);
    setAiResults(null);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ query: q, people }),
      });
      const data = await res.json();
      setAiResults(data.results ?? []);
    } catch {
      setAiResults([]);
    } finally {
      setAiSearching(false);
    }
  }, [people]);

  const clearAiSearch = useCallback(() => {
    setAiResults(null);
    setAiSearching(false);
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const enterEditMode = useCallback(() => {
    setEditMode(true);
    setSelected(new Set());
  }, []);

  const exitEditMode = useCallback(() => {
    setEditMode(false);
    setSelected(new Set());
  }, []);

  const handleBulkDelete = useCallback(() => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    if (!confirm(`Delete ${ids.length} entr${ids.length === 1 ? "y" : "ies"}? This can't be undone.`)) return;
    onBulkDelete?.(ids);
    exitEditMode();
  }, [selected, onBulkDelete, exitEditMode]);

  const handleBulkStatus = useCallback((tag: Tag) => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    onBulkUpdate?.(ids, { tags: [tag] });
    setSelected(new Set());
  }, [selected, onBulkUpdate]);

  const handleRowUpdate = useCallback((id: string, patch: Partial<Person>) => {
    onBulkUpdate?.([id], patch);
  }, [onBulkUpdate]);

  const handleVoiceResult = useCallback((transcript: string) => {
    setQuery(transcript);
    runAiSearch(transcript);
  }, [runAiSearch]);

  const aiReasonMap = useMemo(() => {
    if (!aiResults) return {} as Record<string, string>;
    return Object.fromEntries(aiResults.map(r => [r.id, r.reason]));
  }, [aiResults]);

  const filtered = useMemo(() => {
    if (aiResults !== null) {
      return aiResults
        .map(r => people.find(p => p.id === r.id))
        .filter((p): p is Person => p !== undefined);
    }
    let rows = people;
    if (filter === "networking") rows = rows.filter(p => p.tags.includes("networking") || p.tags.includes("to-enrich"));
    else if (filter === "close") rows = rows.filter(p => p.tags.includes("close"));
    else if (filter === "influential") rows = rows.filter(p => p.tags.includes("influential"));
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter(p => {
        const meetingText = (p.meetings || []).map(m => (m.notes || "") + " " + (m.location || "")).join(" ");
        return (p.name + " " + p.role + " " + p.company + " " + p.location + " " + (p.notes || "") + " " + meetingText).toLowerCase().includes(q);
      });
    }
    return rows;
  }, [people, filter, query, aiResults]);

  const counts = useMemo(() => ({
    all: people.length,
    networking: people.filter(p => p.tags.includes("networking") || p.tags.includes("to-enrich")).length,
    close: people.filter(p => p.tags.includes("close")).length,
    influential: people.filter(p => p.tags.includes("influential")).length,
  }), [people]);

  const lastUpdated = useMemo(() => {
    if (!people.length) return "";
    const dates = people.flatMap(p => p.meetings?.length ? p.meetings.map(m => m.date) : [p.captured]);
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
          A digital rolodex
        </div>
        <h1 className="serif-display-instr" style={{
          margin: 0,
          fontSize: "clamp(44px, 6.5vw, 84px)",
          lineHeight: 0.95,
          letterSpacing: "-0.015em",
        }}>
          The dossier of<br />
          <span style={{ fontStyle: "italic" }}>everyone you know</span>.
        </h1>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid var(--ink)", paddingBottom: 6 }}>
          <span className="uc muted" style={{ fontSize: 10, whiteSpace: "nowrap" }}>Search ⌕</span>
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); clearAiSearch(); }}
            onKeyDown={e => { if (e.key === "Enter" && query.trim()) runAiSearch(query); }}
            placeholder="name, role, place — press Enter to ask AI, or use the mic"
            style={{ fontSize: 16, padding: "4px 0", flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--ink)", fontFamily: "inherit" }}
          />
          {aiSearching && (
            <span className="mono muted" style={{ fontSize: 9, letterSpacing: "0.1em", whiteSpace: "nowrap" }}>SEARCHING…</span>
          )}
          {aiResults !== null && !aiSearching && (
            <span
              className="mono"
              style={{ fontSize: 9, letterSpacing: "0.1em", color: "var(--accent)", border: "1px solid var(--accent)", padding: "2px 6px", whiteSpace: "nowrap" }}
            >
              AI
            </span>
          )}
          {query && (
            <button
              onClick={() => { setQuery(""); clearAiSearch(); }}
              className="mono"
              style={{ fontSize: 11, color: "var(--muted)", cursor: "pointer", background: "none", border: "none" }}
            >✕</button>
          )}
          {/* Voice search icon */}
          <button
            onClick={() => setShowVoiceSearch(true)}
            title="Voice search"
            style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 0", color: "var(--muted)", display: "flex", alignItems: "center" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="2" width="6" height="12" rx="3"/>
              <path d="M5 10a7 7 0 0 0 14 0"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
              <line x1="9" y1="22" x2="15" y2="22"/>
            </svg>
          </button>
        </div>
        {/* Filters + count */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "baseline" }}>
            <FilterChip label="all"          count={counts.all}         active={filter === "all"}         onClick={() => setFilter("all")} />
            <FilterChip label="acquaintance" count={counts.networking}  active={filter === "networking"}  onClick={() => setFilter("networking")} />
            <FilterChip label="friend"       count={counts.close}       active={filter === "close"}       onClick={() => setFilter("close")} />
            <FilterChip label="influential"  count={counts.influential} active={filter === "influential"} onClick={() => setFilter("influential")} color="#2d7a2d" />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
            <div className="mono muted" style={{ fontSize: 10 }}>
              {String(people.length).padStart(3, "0")} entries · updated {lastUpdated}
            </div>
            {!editMode && (
              <button
                onClick={enterEditMode}
                className="mono"
                style={{ fontSize: 10, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.06em", padding: 0, textDecoration: "underline", textUnderlineOffset: 3 }}
              >
                Edit list
              </button>
            )}
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
        <div className="uc muted">Location</div>
        <div className="uc muted" style={{ textAlign: "right" }}>Status</div>
      </div>

      {/* Mobile list header */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid var(--ink)", borderBottom: "1px solid var(--rule)" }}>
        <span className="uc muted">Entries</span>
        <span className="mono muted" style={{ fontSize: 10 }}>{String(filtered.length).padStart(3, "0")}</span>
      </div>

      {/* Bulk edit action bar */}
      {editMode && (
        <div style={{
          position: "sticky",
          top: 100,
          zIndex: 3,
          background: "var(--bg)",
          borderBottom: "1px solid var(--ink)",
          padding: "10px 0",
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => setSelected(new Set(filtered.map(p => p.id)))}
              className="mono"
              style={{ fontSize: 10, background: "none", border: "none", cursor: "pointer", color: "var(--ink)", letterSpacing: "0.06em", padding: 0, textDecoration: "underline", textUnderlineOffset: 3 }}
            >
              All
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="mono"
              style={{ fontSize: 10, background: "none", border: "none", cursor: "pointer", color: "var(--muted)", letterSpacing: "0.06em", padding: 0, textDecoration: "underline", textUnderlineOffset: 3 }}
            >
              None
            </button>
            <span className="mono muted" style={{ fontSize: 10 }}>
              {selected.size} selected
            </span>
          </div>

          <div style={{ flex: 1 }} />

          <span className="mono muted" style={{ fontSize: 9, letterSpacing: "0.08em" }}>
            Type into any row to edit
          </span>

          {selected.size > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="mono muted" style={{ fontSize: 9, letterSpacing: "0.08em" }}>SET STATUS</span>
              {(["close", "networking", "influential"] as Tag[]).map(tag => (
                <button
                  key={tag}
                  onClick={() => handleBulkStatus(tag)}
                  className="mono"
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.08em",
                    padding: "3px 8px",
                    background: "none",
                    border: "1px solid var(--ink)",
                    cursor: "pointer",
                    color: tag === "influential" ? "#2d7a2d" : "var(--ink)",
                    borderColor: tag === "influential" ? "#2d7a2d" : "var(--ink)",
                  }}
                >
                  {TAG_META[tag].label.toUpperCase()}
                </button>
              ))}
            </div>
          )}

          {selected.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="mono"
              style={{ fontSize: 10, background: "none", border: "1px solid var(--ink)", cursor: "pointer", color: "var(--ink)", letterSpacing: "0.06em", padding: "3px 10px" }}
            >
              Delete {selected.size}
            </button>
          )}

          <button
            onClick={exitEditMode}
            className="mono"
            style={{ fontSize: 10, background: "var(--ink)", border: "1px solid var(--ink)", cursor: "pointer", color: "var(--bg)", letterSpacing: "0.06em", padding: "3px 10px" }}
          >
            Done
          </button>
        </div>
      )}

      {/* Rows */}
      {filtered.length === 0 ? (
        <EmptyList query={query} filter={filter} aiMode={aiResults !== null} aiSearching={aiSearching} />
      ) : (
        filtered.map((p) => (
          <PersonRow
            key={p.id}
            p={p}
            onOpen={() => onOpen(p.id)}
            entryNum={people.indexOf(p) + 1}
            aiReason={aiReasonMap[p.id]}
            editMode={editMode}
            checked={selected.has(p.id)}
            onToggle={() => toggleSelect(p.id)}
            onUpdate={(patch) => handleRowUpdate(p.id, patch)}
          />
        ))
      )}

      {/* Bottom mark */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "56px 0 24px", color: "var(--muted)" }}>
        <div className="mono" style={{ fontSize: 11 }}>{String(filtered.length).padStart(3, "0")} of {String(people.length).padStart(3, "0")} shown</div>
        <div style={{ fontSize: 14 }}>✐</div>
        <div className="mono" style={{ fontSize: 11 }}>↩ end of dossier</div>
      </div>

      {showVoiceSearch && (
        <VoiceSearchModal
          onResult={handleVoiceResult}
          onClose={() => setShowVoiceSearch(false)}
        />
      )}
    </div>
  );
}

function PersonRow({ p, onOpen, entryNum, aiReason, editMode, checked, onToggle, onUpdate }: {
  p: Person;
  onOpen: () => void;
  entryNum: number;
  aiReason?: string;
  editMode?: boolean;
  checked?: boolean;
  onToggle?: () => void;
  onUpdate?: (patch: Partial<Person>) => void;
}) {
  const [hover, setHover] = useState(false);
  const statusTag = p.tags.find(t => ["close", "networking", "to-enrich", "influential"].includes(t));

  const handleRowClick = editMode ? undefined : onOpen;
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (editMode) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen();
    }
  };

  return (
    <div
      onClick={handleRowClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="list-row-inner"
      style={{
        padding: "14px 0",
        borderBottom: "1px solid var(--rule)",
        cursor: editMode ? "default" : "pointer",
        background: checked ? "rgba(17,17,17,0.04)" : hover && !editMode ? "rgba(17,17,17,0.015)" : "transparent",
        transition: "background 60ms",
      }}
      role={editMode ? undefined : "button"}
      tabIndex={editMode ? -1 : 0}
      onKeyDown={handleKeyDown}
    >
      {/* Col 1 — Name stack */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0, flexWrap: "wrap" }}>
          {editMode ? (
            <button
              onClick={onToggle}
              aria-label={checked ? "Deselect" : "Select"}
              style={{
                width: 14,
                height: 14,
                border: "1px solid var(--ink)",
                background: checked ? "var(--ink)" : "transparent",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                alignSelf: "center",
                marginRight: 2,
                padding: 0,
                cursor: "pointer",
              }}
            >
              {checked && <span style={{ color: "var(--bg)", fontSize: 9, lineHeight: 1, fontFamily: "monospace" }}>✓</span>}
            </button>
          ) : (
            <span className="mono" style={{ fontSize: 10, color: "var(--muted)", flexShrink: 0 }}>
              {String(entryNum).padStart(3, "0")}
            </span>
          )}
          <span style={{
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: "-0.015em",
            borderBottom: hover && !editMode ? "1px solid var(--ink)" : "1px solid transparent",
            paddingBottom: 1,
            overflowWrap: "break-word",
          }}>
            {p.name}
          </span>
        </div>
        {aiReason && (
          <div className="mono muted" style={{ fontSize: 9, letterSpacing: "0.06em", paddingLeft: 32 }}>
            {aiReason}
          </div>
        )}
      </div>

      {/* Col 2 — Role · Company (desktop) */}
      <div className="hide-mobile" style={{ fontSize: 13, minWidth: 0, lineHeight: 1.35 }}>
        {editMode ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <RowInput
              value={p.role ?? ""}
              placeholder="Role"
              onCommit={(v) => onUpdate?.({ role: v })}
            />
            <RowInput
              value={p.company && p.company !== "—" ? p.company : ""}
              placeholder="Company"
              onCommit={(v) => onUpdate?.({ company: v || "—" })}
              muted
            />
          </div>
        ) : (
          <div style={{ overflowWrap: "break-word" }}>
            <span>{p.role}</span>
            {p.company && p.company !== "—" && <span className="muted">, {p.company}</span>}
          </div>
        )}
      </div>

      {/* Col 3 — Met at (desktop) */}
      <div className="hide-mobile" style={{ fontSize: 13, minWidth: 0, lineHeight: 1.35 }}>
        {editMode ? (
          <RowInput
            value={p.location ?? ""}
            placeholder="Met at"
            onCommit={(v) => onUpdate?.({ location: v })}
            italic
            muted
          />
        ) : (
          <div className="ital muted" style={{ overflowWrap: "break-word" }}>{p.location}</div>
        )}
      </div>

      {/* Col 4 — Location (desktop) */}
      <div className="hide-mobile" style={{ fontSize: 13, minWidth: 0, lineHeight: 1.35 }}>
        {editMode ? (
          <RowInput
            value={p.metCity ?? ""}
            placeholder="City"
            onCommit={(v) => onUpdate?.({ metCity: v })}
            muted
          />
        ) : (
          <div className="muted" style={{ overflowWrap: "break-word" }}>{p.metCity}</div>
        )}
      </div>

      {/* Col 4 — Status */}
      <div style={{ textAlign: "right", alignSelf: "start" }}>
        {statusTag && (
          <FrameTag color={statusTag === "influential" ? "#2d7a2d" : undefined}>
            {TAG_META[statusTag].label}
          </FrameTag>
        )}
      </div>
    </div>
  );
}

function RowInput({ value, placeholder, onCommit, italic, muted }: {
  value: string;
  placeholder: string;
  onCommit: (v: string) => void;
  italic?: boolean;
  muted?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);

  return (
    <input
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onClick={e => e.stopPropagation()}
      onBlur={() => { if (draft !== value) onCommit(draft.trim()); }}
      onKeyDown={e => {
        if (e.key === "Enter") { (e.target as HTMLInputElement).blur(); }
        if (e.key === "Escape") { setDraft(value); (e.target as HTMLInputElement).blur(); }
      }}
      placeholder={placeholder}
      style={{
        width: "100%",
        background: "transparent",
        border: "none",
        borderBottom: "1px dashed var(--rule)",
        paddingBottom: 1,
        fontSize: 13,
        fontStyle: italic ? "italic" : "normal",
        color: muted ? "var(--muted)" : "var(--ink)",
        fontFamily: "inherit",
        outline: "none",
      }}
    />
  );
}

function EmptyList({ query, filter, aiMode, aiSearching }: { query: string; filter: Filter; aiMode: boolean; aiSearching: boolean }) {
  const line = aiSearching
    ? "Searching…"
    : aiMode
    ? `No one matched "${query}". Try rephrasing your question.`
    : query
    ? `Nothing matches "${query}". Try a shorter word, or check the spelling.`
    : filter === "close"
    ? "No friends yet. That's honest. Keep going."
    : filter === "networking"
    ? "No acquaintances yet. Get out there."
    : filter === "influential"
    ? "No one marked influential yet."
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
