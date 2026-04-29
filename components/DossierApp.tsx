"use client";
import { useState } from "react";
import { useDossier } from "@/lib/store";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { LoginView } from "./LoginView";
import { ListView } from "./ListView";
import { DetailView } from "./DetailView";
import { CaptureView } from "./CaptureView";
import { EnrichView } from "./EnrichView";
import { VoiceCaptureModal } from "./VoiceCaptureModal";
import { Person, Tag } from "@/lib/types";
import { Squiggle } from "./Squiggle";

export function DossierApp() {
  const {
    user, loading,
    people, route,
    setRoute, goto, openPerson,
    addPerson, updatePerson, deletePerson, toggleStatus,
    addMeeting, deleteMeeting, addFollowup, removeFollowup,
  } = useDossier();
  const [showVoice, setShowVoice] = useState(false);

  // ── Auth gate ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Squiggle width={80} style={{ opacity: 0.3, color: "var(--ink)", animation: "none" }} />
      </div>
    );
  }

  if (!user) return <LoginView />;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const person = route.name === "detail" ? people.find(p => p.id === route.id) : null;

  const handleSavePerson = (payload: Omit<Person, "id" | "meetings">) => {
    const id = addPerson(payload);
    setRoute({ name: "detail", id });
    return id;
  };

  const handleSaveAndAdd = (payload: Omit<Person, "id" | "meetings">) => {
    addPerson(payload);
    // stay on capture page
  };

  const handleDeletePerson = () => {
    if (!person) return;
    if (confirm(`Delete ${person.name}? This can't be undone.`)) {
      deletePerson(person.id);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", display: "flex", flexDirection: "column" }}>
      <Header onVoiceCapture={user ? () => setShowVoice(true) : undefined} />
      <main className="container main-pad" style={{ flex: 1, width: "100%" }}>
        {route.name === "list" && (
          <ListView
            people={people}
            onOpen={openPerson}
            onBulkDelete={(ids) => ids.forEach(id => deletePerson(id))}
            onBulkUpdate={(ids, patch) => ids.forEach(id => updatePerson(id, patch))}
          />
        )}
        {route.name === "capture" && (
          <CaptureView
            onSave={handleSavePerson}
            onSaveAndAdd={handleSaveAndAdd}
            onCancel={() => goto("list")}
          />
        )}
        {route.name === "detail" && person && (
          <DetailView
            person={person}
            allPeople={people}
            onBack={() => goto("list")}
            onUpdate={(patch) => updatePerson(person.id, patch)}
            onDelete={handleDeletePerson}
            onToggleStatus={(tag: Tag) => toggleStatus(person.id, tag)}
            onAddMeeting={(m) => addMeeting(person.id, m)}
            onDeleteMeeting={(mid) => deleteMeeting(person.id, mid)}
            onAddFollowup={(t) => addFollowup(person.id, t)}
            onRemoveFollowup={(i) => removeFollowup(person.id, i)}
          />
        )}
        {route.name === "detail" && !person && (
          <div style={{ padding: "80px 0", textAlign: "center" }}>
            <p className="serif ital" style={{ fontSize: 20 }}>Entry not found.</p>
            <button onClick={() => goto("list")} style={{ marginTop: 20, fontSize: 14, cursor: "pointer", background: "none", border: "none", color: "var(--ink)", borderBottom: "1px solid var(--ink)" }}>
              ← Back to dossier
            </button>
          </div>
        )}
        {route.name === "enrich" && (
          <EnrichView people={people} onOpen={openPerson} />
        )}
      </main>
      <Footer people={people} />
      {showVoice && (
        <VoiceCaptureModal
          onSave={(payload) => {
            const id = addPerson(payload);
            setRoute({ name: "detail", id });
          }}
          onSaveAndAdd={(payload) => { addPerson(payload); }}
          onClose={() => setShowVoice(false)}
        />
      )}
    </div>
  );
}
