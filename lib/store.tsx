"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Person, Meeting, RouteState, Tag } from "./types";
import { isComplete } from "./utils";

type SimpleUser = { email: string };

interface DossierStore {
  user: SimpleUser | null;
  loading: boolean;
  people: Person[];
  route: RouteState;
  setRoute: (r: RouteState) => void;
  goto: (name: RouteState["name"]) => void;
  openPerson: (id: string) => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  addPerson: (payload: Omit<Person, "id" | "meetings">) => string;
  updatePerson: (id: string, patch: Partial<Person>) => void;
  deletePerson: (id: string) => void;
  toggleStatus: (id: string, newTag: Tag) => void;
  addMeeting: (personId: string, m: { date: string; location: string; notes: string }) => void;
  deleteMeeting: (personId: string, meetingId: string) => void;
  addFollowup: (personId: string, text: string) => void;
  removeFollowup: (personId: string, index: number) => void;
}

const DossierContext = createContext<DossierStore | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function DossierProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [people, setPeople] = useState<Person[]>([]);
  const [route, setRouteState] = useState<RouteState>({ name: "list" });

  // ── Check session on mount ─────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/auth")
      .then(res => {
        if (res.ok) setUser({ email: "" });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ── Load people when signed in ─────────────────────────────────────────────
  useEffect(() => {
    if (!user) { setPeople([]); return; }
    setLoading(true);
    fetch("/api/people")
      .then(res => res.json())
      .then((data: Person[]) => { setPeople(data); setLoading(false); })
      .catch(err => { console.error("load people", err); setLoading(false); });
  }, [user?.email]);

  // ── Routing ────────────────────────────────────────────────────────────────
  const setRoute = useCallback((r: RouteState) => setRouteState(r), []);
  const goto = useCallback((name: RouteState["name"]) => setRouteState({ name } as RouteState), []);
  const openPerson = useCallback((id: string) => setRouteState({ name: "detail", id }), []);

  // ── Auth ───────────────────────────────────────────────────────────────────
  const signIn = useCallback(async (_email: string, password: string) => {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error ?? "Invalid password" };
    setUser({ email: _email });
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/auth", { method: "DELETE" });
    setUser(null);
    setPeople([]);
    setRouteState({ name: "list" });
  }, []);

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const addPerson = useCallback((payload: Omit<Person, "id" | "meetings">): string => {
    if (!user) return "";
    const tempId = crypto.randomUUID();
    const today = new Date().toISOString().slice(0, 10);
    const meeting: Meeting = {
      id: crypto.randomUUID(),
      date: payload.captured || today,
      location: [payload.met, payload.metCity].filter(Boolean).join(" · "),
      notes: payload.notes || "",
    };
    const newPerson: Person = { ...payload, id: tempId, meetings: [meeting] };
    setPeople(prev => [newPerson, ...prev]);

    fetch("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, meetings: [meeting] }),
    })
      .then(res => res.json())
      .then(({ id: notionId }) => {
        setPeople(prev => prev.map(p => p.id === tempId ? { ...p, id: notionId } : p));
        setRouteState(prev =>
          prev.name === "detail" && prev.id === tempId ? { name: "detail", id: notionId } : prev
        );
      })
      .catch(err => console.error("create person", err));

    return tempId;
  }, [user]);

  const updatePerson = useCallback((id: string, patch: Partial<Person>) => {
    if (!user) return;
    setPeople(prev => prev.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, ...patch };
      updated.enriched = updated.enriched || isComplete(updated);
      return updated;
    }));
    fetch(`/api/people/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(err => console.error("update person", err));
  }, [user]);

  const deletePerson = useCallback((id: string) => {
    if (!user) return;
    setPeople(prev => prev.filter(p => p.id !== id));
    setRouteState({ name: "list" });
    fetch(`/api/people/${id}`, { method: "DELETE" })
      .catch(err => console.error("delete person", err));
  }, [user]);

  const toggleStatus = useCallback((id: string, newTag: Tag) => {
    if (!user) return;
    setPeople(prev => prev.map(p =>
      p.id === id ? { ...p, tags: [newTag], enriched: newTag !== "to-enrich" } : p
    ));
    fetch(`/api/people/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: [newTag] }),
    }).catch(err => console.error("toggle status", err));
  }, [user]);

  const addMeeting = useCallback((personId: string, m: { date: string; location: string; notes: string }) => {
    if (!user) return;
    const newMeeting: Meeting = { id: crypto.randomUUID(), ...m };
    let updatedMeetings: Meeting[] = [];
    setPeople(prev => prev.map(p => {
      if (p.id !== personId) return p;
      const meetings = [...(p.meetings || []), newMeeting].sort((a, b) => b.date.localeCompare(a.date));
      updatedMeetings = meetings;
      return { ...p, meetings, captured: meetings[0].date };
    }));
    fetch(`/api/people/${personId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetings: updatedMeetings }),
    }).catch(err => console.error("add meeting", err));
  }, [user]);

  const deleteMeeting = useCallback((personId: string, meetingId: string) => {
    if (!user) return;
    let updatedMeetings: Meeting[] = [];
    setPeople(prev => prev.map(p => {
      if (p.id !== personId) return p;
      const meetings = (p.meetings || []).filter(m => m.id !== meetingId);
      if (!meetings.length) return p;
      updatedMeetings = meetings;
      return { ...p, meetings, captured: meetings[0].date };
    }));
    if (!updatedMeetings.length) return;
    fetch(`/api/people/${personId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetings: updatedMeetings }),
    }).catch(err => console.error("delete meeting", err));
  }, [user]);

  const addFollowup = useCallback((personId: string, text: string) => {
    if (!user) return;
    let updatedFollowups: string[] = [];
    setPeople(prev => prev.map(p => {
      if (p.id !== personId) return p;
      updatedFollowups = [...(p.followups || []), text];
      return { ...p, followups: updatedFollowups };
    }));
    fetch(`/api/people/${personId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followups: updatedFollowups }),
    }).catch(err => console.error("add followup", err));
  }, [user]);

  const removeFollowup = useCallback((personId: string, index: number) => {
    if (!user) return;
    let updatedFollowups: string[] = [];
    setPeople(prev => prev.map(p => {
      if (p.id !== personId) return p;
      updatedFollowups = (p.followups || []).filter((_, i) => i !== index);
      return { ...p, followups: updatedFollowups };
    }));
    fetch(`/api/people/${personId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followups: updatedFollowups }),
    }).catch(err => console.error("remove followup", err));
  }, [user]);

  return (
    <DossierContext.Provider value={{
      user, loading, people, route,
      setRoute, goto, openPerson,
      signIn, signOut,
      addPerson, updatePerson, deletePerson, toggleStatus,
      addMeeting, deleteMeeting, addFollowup, removeFollowup,
    }}>
      {children}
    </DossierContext.Provider>
  );
}

export function useDossier() {
  const ctx = useContext(DossierContext);
  if (!ctx) throw new Error("useDossier must be used within DossierProvider");
  return ctx;
}
