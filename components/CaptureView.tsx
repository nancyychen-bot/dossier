"use client";
import { useState } from "react";
import { Person, Tag, TAG_META } from "@/lib/types";
import { FilterChip } from "./FilterChip";
import { TextLink } from "./TextLink";
import { UnderlinedInput } from "./UnderlinedInput";
import { createPersonPayload } from "@/lib/person";

interface CaptureViewProps {
  onSave: (payload: Omit<Person, "id" | "meetings">) => string;
  onSaveAndAdd: (payload: Omit<Person, "id" | "meetings">) => void;
  onCancel: () => void;
}

const INITIAL_FORM = {
  name: "",
  role: "",
  company: "",
  email: "",
  phone: "",
  linkedin: "",
  location: "",
  metCity: "",
  notes: "",
  tagKey: "to-enrich" as Tag,
};

export function CaptureView({ onSave, onSaveAndAdd, onCancel }: CaptureViewProps) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [saved, setSaved] = useState(false);
  const canSave = form.name.trim().length > 0;

  const update = (k: keyof typeof INITIAL_FORM) => (v: string) =>
    setForm(f => ({ ...f, [k]: v }));

  const buildPayload = () => createPersonPayload({
    name: form.name,
    role: form.role,
    company: form.company,
    email: form.email,
    phone: form.phone,
    linkedin: form.linkedin,
    location: form.location,
    metCity: form.metCity,
    notes: form.notes,
    tag: form.tagKey,
  });

  const handleSave = () => {
    if (!canSave) return;
    onSave(buildPayload());
  };

  const handleSaveAndAdd = () => {
    if (!canSave) return;
    onSaveAndAdd(buildPayload());
    setForm(INITIAL_FORM);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ padding: "8px 0 80px" }}>
      {/* Editorial lede */}
      <div style={{ paddingBottom: 28, borderBottom: "1px solid var(--ink)", marginBottom: 36 }}>
        <div className="uc muted" style={{ marginBottom: 12 }}>Form № 01 · quick capture</div>
        <h1 className="serif-display-instr" style={{
          margin: 0,
          fontSize: "clamp(44px, 6.5vw, 84px)",
          lineHeight: 0.95,
          letterSpacing: "-0.015em",
        }}>
          Someone new.<br />
          <span style={{ fontStyle: "italic" }}>Write it down.</span>
        </h1>
      </div>

      {saved && (
        <div style={{
          background: "var(--ink)",
          color: "var(--bg)",
          padding: "10px 16px",
          fontSize: 13,
          marginBottom: 24,
          fontFamily: '"JetBrains Mono", monospace',
          letterSpacing: "0.04em",
        }}>
          ✓ Entry saved. Ready for another.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 28 }}>
        {/* Name */}
        <Field label="Name" required>
          <UnderlinedInput
            value={form.name}
            onChange={update("name")}
            placeholder="Full name, as they'd say it"
            autoFocus
          />
        </Field>

        {/* Role + Company */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 28 }}>
          <Field label="Role">
            <UnderlinedInput value={form.role} onChange={update("role")} placeholder="What they do" />
          </Field>
          <Field label="Company / affiliation">
            <UnderlinedInput value={form.company} onChange={update("company")} placeholder="Or a dash if freelance" />
          </Field>
        </div>

        {/* Email + Phone */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 28 }}>
          <Field label="Email">
            <UnderlinedInput value={form.email} onChange={update("email")} placeholder="their@email.com" type="email" />
          </Field>
          <Field label="Phone">
            <UnderlinedInput value={form.phone} onChange={update("phone")} placeholder="+1 212 555 0100" type="tel" />
          </Field>
        </div>

        {/* LinkedIn */}
        <Field label="LinkedIn">
          <UnderlinedInput value={form.linkedin} onChange={update("linkedin")} placeholder="linkedin.com/in/username" />
        </Field>

        {/* Met where + City */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 28 }}>
          <Field label="Met where">
            <UnderlinedInput value={form.location} onChange={update("location")} placeholder="The event, the hallway, the dinner" />
          </Field>
          <Field label="City">
            <UnderlinedInput value={form.metCity} onChange={update("metCity")} placeholder="Brooklyn, The Hague…" />
          </Field>
        </div>

        {/* Notes */}
        <Field label="Notes — what you want to remember">
          <UnderlinedInput
            value={form.notes}
            onChange={update("notes")}
            placeholder="The thing they said. The book they mentioned. The promise you made."
            multiline
            rows={5}
          />
        </Field>

        {/* File under */}
        <Field label="File under">
          <div style={{ display: "flex", gap: 22, paddingTop: 4 }}>
            {(["close", "networking", "to-enrich", "influential"] as Tag[]).map(t => (
              <FilterChip
                key={t}
                label={TAG_META[t].label}
                active={form.tagKey === t}
                onClick={() => setForm(f => ({ ...f, tagKey: t }))}
                color={t === "influential" ? "#2d7a2d" : undefined}
              />
            ))}
          </div>
        </Field>
      </div>

      {/* Footer actions */}
      <div style={{
        marginTop: 48,
        paddingTop: 20,
        borderTop: "1px solid var(--rule)",
        display: "flex",
        gap: 32,
        alignItems: "baseline",
        justifyContent: "space-between",
        flexWrap: "wrap",
      }}>
        <div className="mono muted" style={{ fontSize: 11 }}>
          {canSave ? "READY" : "AWAITING A NAME"}
        </div>
        <div style={{ display: "flex", gap: 28, alignItems: "baseline", flexWrap: "wrap" }}>
          <TextLink onClick={onCancel} arrow="✕">Discard</TextLink>
          <button
            onClick={handleSaveAndAdd}
            disabled={!canSave}
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--muted)",
              borderBottom: "1px solid var(--muted)",
              paddingBottom: 1,
              opacity: canSave ? 1 : 0.35,
              cursor: canSave ? "pointer" : "default",
              background: "none",
              border: "none",
            }}
          >
            Save and add another →
          </button>
          <TextLink onClick={handleSave} arrow="→" accent disabled={!canSave}>
            Save entry
          </TextLink>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="uc" style={{ color: "var(--muted)", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span>{label}</span>
        {required && <span style={{ color: "var(--accent)", letterSpacing: 0, fontSize: 10, textTransform: "uppercase" }}>REQUIRED</span>}
      </div>
      {children}
    </div>
  );
}
