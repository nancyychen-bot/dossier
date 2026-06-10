"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Person, Meeting, Tag, TAG_META } from "@/lib/types";
import { FrameTag } from "./FrameTag";
import { TextLink } from "./TextLink";
import { UnderlinedInput } from "./UnderlinedInput";
import { Portrait } from "./Portrait";
import { DraftEmailModal } from "./DraftEmailModal";
import { useSpeechRecognition } from "@/lib/hooks/useSpeechRecognition";
import { fmtDate, fmtDateLong, daysAgo, mkMeetingId, normalizeCity } from "@/lib/utils";

interface DetailViewProps {
  person: Person;
  allPeople: Person[];
  onBack: () => void;
  onUpdate: (patch: Partial<Person>) => void;
  onDelete: () => void;
  onToggleStatus: (tag: Tag) => void;
  onAddMeeting: (m: { date: string; location: string; notes: string }) => void;
  onDeleteMeeting: (meetingId: string) => void;
  onAddFollowup: (text: string) => void;
  onRemoveFollowup: (index: number) => void;
}

export function DetailView({
  person,
  allPeople,
  onBack,
  onUpdate,
  onDelete,
  onToggleStatus,
  onAddMeeting,
  onDeleteMeeting,
  onAddFollowup,
  onRemoveFollowup,
}: DetailViewProps) {
  const [draft, setDraft] = useState(person);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showDraftEmail, setShowDraftEmail] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(person);
  }, [person]);

  const meetings = (person.meetings && person.meetings.length)
    ? [...person.meetings].sort((a, b) => b.date.localeCompare(a.date))
    : [{
        id: "m-seed",
        date: person.captured,
        location: [person.location, person.metCity].filter(Boolean).join(" · "),
        notes: person.notes || "",
      }];

  const entryNum = allPeople.findIndex(p => p.id === person.id) + 1;
  const days = daysAgo(person.captured);
  const statusTag = person.tags.find(t => ["close", "networking", "to-enrich", "influential"].includes(t)) as Tag | undefined;

  const setField = (k: keyof Person) => (v: string) => setDraft(d => ({ ...d, [k]: v }));

  const saveField = (field: keyof Person) => {
    const value = draft[field] as string;
    const normalized =
      field === "name"    ? (value.trim() || person.name) :
      field === "metCity" ? normalizeCity(value || "") :
      value;
    onUpdate({ [field]: normalized });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload-photo", { method: "POST", body: form });
      const { url } = await res.json();
      if (url) onUpdate({ photo: url });
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{
        paddingBottom: 28,
        borderBottom: "1px solid var(--rule)",
        marginBottom: 40,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <button
          onClick={onBack}
          style={{ display: "inline-flex", gap: 10, alignItems: "baseline", fontSize: 13, cursor: "pointer", background: "none", border: "none", color: "var(--ink)" }}
        >
          <span>←</span>
          <span className="uc" style={{ fontSize: 10 }}>Back to dossier</span>
        </button>
        <div className="mono muted" style={{ fontSize: 11 }}>
          ENTRY {String(entryNum).padStart(3, "0")} / {String(allPeople.length).padStart(3, "0")}
        </div>
      </div>

      {/* Hero — name + portrait */}
      <div className="profile-head">
        <div style={{ flex: 1 }}>
          <div className="uc muted" style={{ marginBottom: 14 }}>Entry</div>
          <h1 className="serif-display-instr" style={{
            margin: 0,
            fontSize: "clamp(36px, 6vw, 80px)",
            lineHeight: 0.9,
            maxWidth: "14ch",
            letterSpacing: "-0.015em",
          }}>
            {person.name}
          </h1>
          <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {statusTag && (
              <FrameTag color={statusTag === "influential" ? "#2d7a2d" : undefined}>
                {TAG_META[statusTag].label}
              </FrameTag>
            )}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <div className="uc muted" style={{ fontSize: 10 }}>§ Portrait</div>
          <Portrait
            name={person.name}
            photoUrl={person.photo ?? null}
            compact
            onAddPhoto={() => fileInputRef.current?.click()}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handlePhotoUpload}
          />
          {uploadingPhoto && (
            <div className="mono muted" style={{ fontSize: 9, letterSpacing: "0.08em" }}>
              UPLOADING…
            </div>
          )}
          {person.photo && (
            <button
              onClick={() => onUpdate({ photo: null })}
              className="muted"
              style={{ fontSize: 9, letterSpacing: "0.06em", cursor: "pointer", background: "none", border: "none", color: "var(--muted)", fontFamily: '"JetBrains Mono", monospace' }}
            >
              remove photo
            </button>
          )}
        </div>
      </div>

      {/* Asymmetric grid */}
      <div className="asym-grid">
        {/* Left — catalog entry */}
        <div>
          <div className="uc muted" style={{ marginBottom: 12 }}>
            <span>§ Catalog entry</span>
          </div>

          <div style={{ borderTop: "1px solid var(--ink)" }}>
            {[
              { k: "Name", field: "name" as keyof Person, type: "text" },
              { k: "Role", field: "role" as keyof Person },
              { k: "Company", field: "company" as keyof Person },
              { k: "Met at", field: "location" as keyof Person },
              { k: "Location", field: "metCity" as keyof Person },
              { k: "Email", field: "email" as keyof Person, type: "email" },
              { k: "Phone", field: "phone" as keyof Person, type: "tel" },
              { k: "Twitter", field: "twitter" as keyof Person },
              { k: "LinkedIn", field: "linkedin" as keyof Person },
              { k: "Instagram", field: "instagram" as keyof Person },
              { k: "Photo URL", field: "photo" as keyof Person },
            ].map(({ k, field, type }) => (
              <div key={field} style={{
                display: "grid",
                gridTemplateColumns: "110px 1fr",
                gap: 24,
                padding: "10px 0",
                borderBottom: "1px solid var(--rule)",
                alignItems: "baseline",
              }}>
                <div className="uc muted">{k}</div>
                <input
                  type={type || "text"}
                  value={(draft[field] as string) ?? ""}
                  onChange={e => setField(field)(e.target.value)}
                  onBlur={() => saveField(field)}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    paddingBottom: 2,
                    fontSize: 15,
                    fontWeight: 400,
                    color: "var(--ink)",
                    fontFamily: "inherit",
                    outline: "none",
                  }}
                />
              </div>
            ))}
            <div style={{
              display: "grid",
              gridTemplateColumns: "110px 1fr",
              gap: 24,
              padding: "10px 0",
              borderBottom: "1px solid var(--rule)",
              alignItems: "baseline",
            }}>
              <div className="uc muted">Captured</div>
              <div style={{ fontSize: 15 }}>
                <span>{fmtDateLong(person.captured)}</span>
                {days != null && <span className="muted"> · {days} {days === 1 ? "day" : "days"} ago</span>}
              </div>
            </div>
          </div>

          {/* Follow-ups */}
          <div style={{ marginTop: 36 }}>
            <div className="uc muted" style={{
              marginBottom: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}>
              <span>To-do · follow-ups</span>
              <span className="mono" style={{ fontSize: 10 }}>
                {(person.followups || []).length} {(person.followups || []).length === 1 ? "ITEM" : "ITEMS"}
              </span>
            </div>
            {(!person.followups || person.followups.length === 0) ? (
              <div className="ital muted" style={{ fontSize: 14, paddingBottom: 6 }}>— Nothing outstanding.</div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {person.followups.map((f, i) => (
                  <li key={i} style={{
                    display: "grid",
                    gridTemplateColumns: "22px 1fr auto",
                    gap: 8,
                    padding: "8px 0",
                    borderBottom: "1px solid var(--rule)",
                    fontSize: 14,
                    alignItems: "baseline",
                  }}>
                    <span style={{ color: "var(--accent)", fontSize: 12 }}>□</span>
                    <span>{f}</span>
                    <button
                      onClick={() => onRemoveFollowup(i)}
                      className="muted"
                      title="Mark done"
                      style={{ fontSize: 12, cursor: "pointer", background: "none", border: "none", color: "var(--muted)" }}
                    >✓</button>
                  </li>
                ))}
              </ul>
            )}
            <AddFollowupForm onAdd={onAddFollowup} />
          </div>
        </div>

        {/* Right — meetings log */}
        <div>
          <div className="uc muted" style={{
            marginBottom: 12,
            display: "flex",
            justifyContent: "space-between",
          }}>
            <span>§ Meetings, logged</span>
            <span className="mono" style={{ fontSize: 10 }}>
              {meetings.length} {meetings.length === 1 ? "ENCOUNTER" : "ENCOUNTERS"}
            </span>
          </div>
          <div style={{ borderTop: "1px solid var(--ink)" }}>
            {meetings.map((m, i) => (
              <MeetingEntry
                key={m.id || i}
                meeting={m}
                index={meetings.length - i}
                isFirst={i === 0}
                onDelete={meetings.length > 1 ? () => onDeleteMeeting(m.id) : null}
              />
            ))}
          </div>

          <AddMeetingForm onAdd={onAddMeeting} />

          {/* Actions */}
          <div style={{
            marginTop: 48,
            paddingTop: 20,
            borderTop: "1px solid var(--rule)",
            display: "flex",
            gap: 28,
            flexWrap: "wrap",
            alignItems: "baseline",
          }}>
            <TextLink onClick={() => setShowDraftEmail(true)} arrow="→">Draft email</TextLink>
            {statusTag !== "networking" && (
              <TextLink onClick={() => onToggleStatus("networking")} arrow="→">Mark acquaintance</TextLink>
            )}
            {statusTag !== "close" && (
              <TextLink onClick={() => onToggleStatus("close")} arrow="→">Mark friend</TextLink>
            )}
            {statusTag !== "influential" && (
              <TextLink onClick={() => onToggleStatus("influential")} arrow="→">Mark influential</TextLink>
            )}
            <TextLink onClick={onDelete} arrow="✕" accent>Delete entry</TextLink>
          </div>
        </div>
      </div>

      {/* End mark */}
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 72, color: "var(--muted)" }}>
        <div style={{ fontSize: 18 }}>• • •</div>
      </div>

      {showDraftEmail && (
        <DraftEmailModal person={person} onClose={() => setShowDraftEmail(false)} />
      )}
    </div>
  );

}

function MeetingEntry({ meeting, index, isFirst, onDelete }: { meeting: Meeting; index: number; isFirst: boolean; onDelete: (() => void) | null }) {
  const hasNotes = meeting.notes && meeting.notes.trim().length > 0;
  return (
    <div style={{ padding: "22px 0 26px", borderBottom: "1px solid var(--rule)" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        gap: 14,
        alignItems: "baseline",
        marginBottom: 10,
        flexWrap: "wrap",
      }}>
        <span className="mono" style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.04em" }}>
          № {String(index).padStart(2, "0")}
        </span>
        <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{fmtDateLong(meeting.date)}</span>
          {meeting.location && (
            <span className="ital muted" style={{ fontSize: 14 }}>
              · {meeting.location}
            </span>
          )}
          {isFirst && (
            <span className="mono" style={{
              fontSize: 9,
              letterSpacing: "0.1em",
              color: "var(--accent)",
              border: "1px solid var(--accent)",
              padding: "1px 5px",
              textTransform: "uppercase",
              marginLeft: 4,
              whiteSpace: "nowrap",
            }}>
              most recent
            </span>
          )}
        </div>
        {onDelete && (
          <button
            onClick={onDelete}
            className="muted"
            style={{ fontSize: 12, borderBottom: "1px solid var(--rule)", paddingBottom: 1, cursor: "pointer", background: "none", border: "none", color: "var(--muted)", whiteSpace: "nowrap" }}
          >
            remove ✕
          </button>
        )}
      </div>
      {hasNotes ? (
        <div className="serif" style={{
          fontSize: 18,
          lineHeight: 1.5,
          color: "var(--ink)",
          maxWidth: "62ch",
          paddingLeft: 44,
        }}>
          {meeting.notes}
        </div>
      ) : (
        <div className="ital muted" style={{ fontSize: 14, paddingLeft: 44 }}>
          — No notes transcribed.
        </div>
      )}
    </div>
  );
}

function AddFollowupForm({ onAdd }: { onAdd: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onAdd(t);
    setText("");
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="uc"
        style={{ fontSize: 10, letterSpacing: "0.14em", borderBottom: "1px solid var(--ink)", paddingBottom: 2, marginTop: 12, cursor: "pointer", background: "none", border: "none", color: "var(--ink)" }}
      >
        + Add follow-up
      </button>
    );
  }

  return (
    <div style={{ marginTop: 10, padding: "10px 0 4px", borderTop: "1px dashed var(--rule)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "22px 1fr", gap: 8, alignItems: "baseline" }}>
        <span style={{ color: "var(--accent)", fontSize: 12 }}>□</span>
        <input
          autoFocus
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") { setText(""); setOpen(false); }
          }}
          placeholder="Send the book. Intro them to someone. Reply re: the show."
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            borderBottom: "1px solid var(--ink)",
            paddingBottom: 3,
            fontSize: 14,
            color: "var(--ink)",
            fontFamily: "inherit",
            outline: "none",
          }}
        />
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 8, paddingLeft: 30, alignItems: "baseline" }}>
        <button onClick={submit} style={{ fontSize: 13, fontWeight: 600, borderBottom: "1px solid var(--ink)", paddingBottom: 1, cursor: "pointer", background: "none", border: "none", color: "var(--ink)" }}>
          Add →
        </button>
        <button onClick={() => { setText(""); setOpen(false); }} className="muted" style={{ fontSize: 12, cursor: "pointer", background: "none", border: "none", color: "var(--muted)" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function AddMeetingForm({ onAdd }: { onAdd: (m: { date: string; location: string; notes: string }) => void }) {
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [voicePhase, setVoicePhase] = useState<"idle" | "listening" | "parsing">("idle");
  const { transcript, isListening, startListening, stopListening, reset } = useSpeechRecognition();

  const handleVoiceClick = useCallback(async () => {
    if (isListening) {
      const final = stopListening();
      if (!final) { setVoicePhase("idle"); return; }
      setVoicePhase("parsing");
      try {
        const res = await fetch("/api/voice-meeting-parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ transcript: final, today }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.date) setDate(data.date);
          if (data.location) setLocation(data.location);
          if (data.notes) setNotes(data.notes);
        }
      } catch { /* ignore, fields stay as-is */ }
      setVoicePhase("idle");
      reset();
    } else {
      reset();
      startListening();
      setVoicePhase("listening");
    }
  }, [isListening, stopListening, startListening, reset, today]);

  if (!open) {
    return (
      <div style={{ marginTop: 20, paddingBottom: 8 }}>
        <button
          onClick={() => setOpen(true)}
          className="uc"
          style={{ fontSize: 11, letterSpacing: "0.14em", borderBottom: "1px solid var(--ink)", paddingBottom: 2, cursor: "pointer", background: "none", border: "none", color: "var(--ink)" }}
        >
          + Log a new meeting
        </button>
      </div>
    );
  }

  const submit = () => {
    if (!date) return;
    onAdd({ date, location: location.trim(), notes: notes.trim() });
    setDate(today); setLocation(""); setNotes("");
    setVoicePhase("idle"); reset();
    setOpen(false);
  };

  const MicIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3"/>
      <path d="M5 10a7 7 0 0 0 14 0"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
      <line x1="9" y1="22" x2="15" y2="22"/>
    </svg>
  );

  return (
    <div style={{
      marginTop: 24,
      border: "1px solid var(--ink)",
      padding: "20px 22px 22px",
      background: "var(--bg)",
    }}>
      <div className="uc" style={{ fontSize: 11, letterSpacing: "0.14em", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>New meeting</span>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            onClick={handleVoiceClick}
            title={isListening ? "Tap to finish" : "Fill with voice"}
            style={{
              background: "none", border: "none", cursor: "pointer", padding: 0,
              color: isListening ? "#2d7a2d" : "var(--muted)",
              display: "flex", alignItems: "center", gap: 5,
              animation: isListening ? "mic-pulse 1.4s ease-in-out infinite" : "none",
            }}
          >
            <MicIcon />
            <span className="mono" style={{ fontSize: 9, letterSpacing: "0.1em" }}>
              {voicePhase === "listening" ? "● LISTENING — tap to finish" : voicePhase === "parsing" ? "PARSING…" : "VOICE FILL"}
            </span>
          </button>
          <button onClick={() => { setOpen(false); setVoicePhase("idle"); reset(); }} className="muted" style={{ cursor: "pointer", background: "none", border: "none", color: "var(--muted)", fontSize: 12 }}>✕ cancel</button>
        </div>
      </div>

      {/* Live transcript preview while listening */}
      {isListening && transcript && (
        <div style={{
          borderLeft: "2px solid #2d7a2d", paddingLeft: 12, marginBottom: 16,
          fontFamily: "Georgia, serif", fontStyle: "italic",
          fontSize: 13, lineHeight: 1.55, color: "var(--muted)",
        }}>
          "{transcript}"
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 20, marginBottom: 16 }}>
        <div>
          <div className="uc muted" style={{ fontSize: 10, marginBottom: 6 }}>Date</div>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              borderBottom: "1px solid var(--ink)",
              paddingBottom: 4,
              fontSize: 14,
              color: "var(--ink)",
              fontFamily: '"JetBrains Mono", monospace',
              outline: "none",
            }}
          />
        </div>
        <div>
          <div className="uc muted" style={{ fontSize: 10, marginBottom: 6 }}>Where · context</div>
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="Coffee at Sey · Brooklyn"
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              borderBottom: "1px solid var(--ink)",
              paddingBottom: 4,
              fontSize: 14,
              color: "var(--ink)",
              fontFamily: "inherit",
              outline: "none",
            }}
          />
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div className="uc muted" style={{ fontSize: 10, marginBottom: 6 }}>Notes · what to remember</div>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={5}
          placeholder="What they said. What you promised. What to follow up on."
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            borderBottom: "1px solid var(--ink)",
            paddingBottom: 6,
            fontSize: 15,
            color: "var(--ink)",
            resize: "vertical",
            fontFamily: '"EB Garamond", Georgia, serif',
            lineHeight: 1.5,
            outline: "none",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 20, alignItems: "baseline" }}>
        <button
          onClick={submit}
          style={{ fontSize: 14, fontWeight: 600, borderBottom: "1px solid var(--ink)", paddingBottom: 2, cursor: "pointer", background: "none", border: "none", color: "var(--ink)" }}
        >
          Save meeting →
        </button>
        <button onClick={() => { setOpen(false); setVoicePhase("idle"); reset(); }} className="muted" style={{ fontSize: 13, cursor: "pointer", background: "none", border: "none", color: "var(--muted)" }}>
          Discard
        </button>
      </div>

      <style>{`
        @keyframes mic-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
