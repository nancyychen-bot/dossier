"use client";
import { useState, useEffect } from "react";
import { Person, Meeting, Tag, TAG_META } from "@/lib/types";
import { FrameTag } from "./FrameTag";
import { TextLink } from "./TextLink";
import { UnderlinedInput } from "./UnderlinedInput";
import { KV } from "./KV";
import { Portrait } from "./Portrait";
import { fmtDate, fmtDateLong, daysAgo, mkMeetingId, isComplete } from "@/lib/utils";

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
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(person);
  const [fetchingPhoto, setFetchingPhoto] = useState(false);

  useEffect(() => {
    setDraft(person);
    setEditing(false);
  }, [person.id]);

  const meetings = (person.meetings && person.meetings.length)
    ? [...person.meetings].sort((a, b) => b.date.localeCompare(a.date))
    : [{
        id: "m-seed",
        date: person.captured,
        location: [person.met, person.metCity].filter(Boolean).join(" · "),
        notes: person.notes || "",
      }];

  const entryNum = allPeople.findIndex(p => p.id === person.id) + 1;
  const days = daysAgo(person.captured);
  const statusTag = person.tags.find(t => ["close", "networking", "to-enrich"].includes(t)) as Tag | undefined;
  const isIncomplete = !person.enriched && !isComplete(person);

  const setField = (k: keyof Person) => (v: string) => setDraft(d => ({ ...d, [k]: v }));

  const saveEdits = async () => {
    const saved = {
      name:      draft.name.trim() || person.name,
      role:      draft.role,
      company:   draft.company,
      email:     draft.email,
      phone:     draft.phone,
      web:       draft.web,
      twitter:   draft.twitter,
      linkedin:  draft.linkedin,
      instagram: draft.instagram,
      met:       draft.met,
      metCity:   draft.metCity,
      notes:     draft.notes,
    };
    onUpdate(saved);
    setEditing(false);

    // Auto-enrich whenever contact info is present
    console.log("[enrich] email:", draft.email, "phone:", draft.phone, "linkedin:", draft.linkedin);
    if (draft.email || draft.phone || draft.linkedin) {
      setFetchingPhoto(true);
      try {
        const qs = new URLSearchParams();
        if (draft.email)    qs.set("email", draft.email);
        if (draft.phone)    qs.set("phone", draft.phone);
        if (draft.linkedin) qs.set("linkedin", draft.linkedin);
        console.log("[enrich] calling /api/enrich?", qs.toString());
        const res = await fetch(`/api/enrich?${qs.toString()}`);
        const data = await res.json();
        const patch: Partial<Person> = {};
        if (data.photo)    patch.photo    = data.photo;
        if (data.role)     patch.role     = data.role;
        if (data.company)  patch.company  = data.company;
        if (data.twitter)  patch.twitter  = data.twitter;
        if (data.linkedin) patch.linkedin = data.linkedin;
        if (data.web)      patch.web      = data.web;
        if (data.phone)    patch.phone    = data.phone;
        if (data.email)    patch.email    = data.email;
        if (Object.keys(patch).length) onUpdate(patch);
      } finally {
        setFetchingPhoto(false);
      }
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
          <div className="uc muted" style={{ marginBottom: 14 }}>
            {isIncomplete ? "Entry · incomplete" : "Entry · complete"}
          </div>
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
              <FrameTag accent={isIncomplete}>
                {TAG_META[statusTag].label}
              </FrameTag>
            )}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <div className="uc muted" style={{ fontSize: 10 }}>§ Portrait</div>
          <Portrait name={person.name} photoUrl={person.photo ?? null} compact />
          {fetchingPhoto && (
            <div className="mono muted" style={{ fontSize: 9, letterSpacing: "0.08em" }}>ENRICHING…</div>
          )}
        </div>
      </div>

      {/* Asymmetric grid */}
      <div className="asym-grid">
        {/* Left — catalog entry */}
        <div>
          <div className="uc muted" style={{
            marginBottom: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}>
            <span>§ Catalog entry</span>
            {editing ? (
              <span className="mono accent" style={{ fontSize: 10 }}>EDITING</span>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="uc"
                style={{ fontSize: 10, letterSpacing: "0.14em", borderBottom: "1px solid var(--ink)", paddingBottom: 1, cursor: "pointer", background: "none", border: "none", color: "var(--ink)" }}
              >
                ⌇ Edit profile
              </button>
            )}
          </div>

          {editing ? (
            <div style={{ borderTop: "1px solid var(--ink)" }}>
              {[
                { k: "Name", field: "name" as keyof Person, type: "text" },
                { k: "Role", field: "role" as keyof Person },
                { k: "Company", field: "company" as keyof Person },
                { k: "Met at", field: "met" as keyof Person },
                { k: "City", field: "metCity" as keyof Person },
                { k: "Email", field: "email" as keyof Person, type: "email" },
                { k: "Twitter", field: "twitter" as keyof Person },
                { k: "LinkedIn", field: "linkedin" as keyof Person },
                { k: "Instagram", field: "instagram" as keyof Person },
              ].map(({ k, field, type }) => (
                <div key={field} style={{
                  display: "grid",
                  gridTemplateColumns: "120px 1fr",
                  gap: 16,
                  padding: "10px 0",
                  borderBottom: "1px solid var(--rule)",
                  alignItems: "baseline",
                }}>
                  <div className="uc muted" style={{ fontSize: 10 }}>{k}</div>
                  <input
                    type={type || "text"}
                    value={(draft[field] as string) ?? ""}
                    onChange={e => setField(field)(e.target.value)}
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
              ))}
              <div style={{ display: "flex", gap: 20, alignItems: "baseline", padding: "16px 0 4px" }}>
                <button
                  onClick={saveEdits}
                  style={{ fontSize: 14, fontWeight: 600, borderBottom: "1px solid var(--ink)", paddingBottom: 2, cursor: "pointer", background: "none", border: "none", color: "var(--ink)" }}
                >
                  Save edits →
                </button>
                <button
                  onClick={() => { setDraft(person); setEditing(false); }}
                  className="muted"
                  style={{ fontSize: 13, cursor: "pointer", background: "none", border: "none", color: "var(--muted)" }}
                >
                  Discard
                </button>
              </div>
            </div>
          ) : (
            <div style={{ borderTop: "1px solid var(--ink)" }}>
              <KV k="Role" v={person.role} />
              <KV k="Company" v={person.company && person.company !== "—" ? person.company : null} />
              <KV k="Met" v={person.met} />
              <KV k="Place" v={person.metCity} />
              <KV k="Captured">
                <span>{fmtDateLong(person.captured)}</span>
                {days != null && <span className="muted"> · {days} {days === 1 ? "day" : "days"} ago</span>}
              </KV>
              <KV k="Email">
                {person.email ? <a href={`mailto:${person.email}`} style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 1 }}>{person.email}</a> : null}
              </KV>
              <KV k="Phone" v={person.phone} />
              <KV k="Twitter" v={person.twitter} />
              <KV k="LinkedIn" v={person.linkedin} />
              <KV k="Instagram" v={person.instagram} />
            </div>
          )}

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
            <TextLink onClick={() => onToggleStatus(nextStatus())} arrow="→">
              {statusTag === "close" ? "Mark acquaintance" : statusTag === "networking" ? "Mark friend" : "Mark acquaintance"}
            </TextLink>
            <TextLink onClick={onDelete} arrow="✕" accent>Delete entry</TextLink>
          </div>
        </div>
      </div>

      {/* End mark */}
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 72, color: "var(--muted)" }}>
        <div style={{ fontSize: 18 }}>• • •</div>
      </div>
    </div>
  );

  function nextStatus(): Tag {
    if (statusTag === "to-enrich") return "networking";
    if (statusTag === "networking") return "close";
    return "to-enrich";
  }
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
    setOpen(false);
  };

  return (
    <div style={{
      marginTop: 24,
      border: "1px solid var(--ink)",
      padding: "20px 22px 22px",
      background: "var(--bg)",
    }}>
      <div className="uc" style={{ fontSize: 11, letterSpacing: "0.14em", marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
        <span>New meeting</span>
        <button onClick={() => setOpen(false)} className="muted" style={{ cursor: "pointer", background: "none", border: "none", color: "var(--muted)", fontSize: 12 }}>✕ cancel</button>
      </div>

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
        <button onClick={() => setOpen(false)} className="muted" style={{ fontSize: 13, cursor: "pointer", background: "none", border: "none", color: "var(--muted)" }}>
          Discard
        </button>
      </div>
    </div>
  );
}
