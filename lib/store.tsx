"use client";
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { Person, RouteState, Tag } from "./types";
import { isComplete } from "./utils";
import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";

// ─── DB ↔ App mappers ────────────────────────────────────────────────────────

const TAG_TO_STATUS: Record<Tag, string> = {
  close: "friend",
  networking: "acquaintance",
  "to-enrich": "incomplete",
};
const STATUS_TO_TAG: Record<string, Tag> = {
  friend: "close",
  acquaintance: "networking",
  incomplete: "to-enrich",
};

function dbToPerson(row: any, meetings: any[], followups: any[]): Person {
  const tag: Tag = STATUS_TO_TAG[row.status] ?? "to-enrich";
  const sortedMeetings = [...meetings]
    .sort((a, b) => b.met_on.localeCompare(a.met_on))
    .map(m => ({ id: m.id, date: m.met_on, location: m.location ?? "", notes: m.notes ?? "" }));
  const sortedFollowups = [...followups]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .filter(f => !f.done);

  return {
    id: row.id,
    name: row.name,
    role: row.role ?? "",
    company: row.company ?? "—",
    met: row.met_where ?? "",
    metCity: row.city ?? "",
    captured: (row.captured_at ?? row.created_at ?? "").slice(0, 10),
    tags: [tag],
    enriched: tag !== "to-enrich" || !!(row.name && row.role && row.email && row.linkedin_url),
    photo: row.photo_url ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    web: row.website ?? null,
    twitter: row.twitter ?? null,
    linkedin: row.linkedin_url ?? null,
    instagram: row.instagram ?? null,
    notes: row.notes ?? "",
    followups: sortedFollowups.map(f => f.text),
    meetings: sortedMeetings.length
      ? sortedMeetings
      : [{ id: "m-init", date: (row.captured_at ?? row.created_at ?? "").slice(0, 10), location: [row.met_where, row.city].filter(Boolean).join(" · "), notes: row.notes ?? "" }],
  };
}

function personToDb(p: Partial<Person>, userId: string) {
  const tag = p.tags?.[0] ?? "to-enrich";
  return {
    user_id: userId,
    name: p.name!,
    role: p.role || null,
    company: p.company && p.company !== "—" ? p.company : null,
    met_where: p.met || null,
    city: p.metCity || null,
    notes: p.notes || null,
    email: p.email || null,
    phone: p.phone || null,
    website: p.web || null,
    linkedin_url: p.linkedin || null,
    instagram: p.instagram || null,
    twitter: p.twitter || null,
    status: TAG_TO_STATUS[tag as Tag] ?? "incomplete",
    captured_at: p.captured ? new Date(p.captured).toISOString() : new Date().toISOString(),
  };
}

// ─── Store interface ─────────────────────────────────────────────────────────

interface DossierStore {
  user: User | null;
  loading: boolean;
  people: Person[];
  route: RouteState;
  setRoute: (r: RouteState) => void;
  goto: (name: RouteState["name"]) => void;
  openPerson: (id: string) => void;
  signIn: (email: string) => Promise<{ error: string | null }>;
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [people, setPeople] = useState<Person[]>([]);
  const [route, setRouteState] = useState<RouteState>({ name: "list" });
  // Maps personId → ordered array of followup UUIDs (so we can delete by index)
  const followupIds = useRef<Record<string, string[]>>({});

  // ── Auth listener ──────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      if (!data.session?.user) setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) { setPeople([]); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Load data when user is set ─────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    loadAllPeople(user.id).finally(() => setLoading(false));
  }, [user?.id]);

  async function loadAllPeople(userId: string) {
    const { data, error } = await supabase
      .from("people")
      .select("*, meetings(*), followups(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) { console.error("load error", error); return; }

    const ids: Record<string, string[]> = {};
    const mapped = (data ?? []).map((row: any) => {
      const sortedFollowups = [...(row.followups ?? [])]
        .sort((a: any, b: any) => a.created_at.localeCompare(b.created_at))
        .filter((f: any) => !f.done);
      ids[row.id] = sortedFollowups.map((f: any) => f.id);
      return dbToPerson(row, row.meetings ?? [], row.followups ?? []);
    });

    followupIds.current = ids;
    setPeople(mapped);
  }

  // ── Routing ────────────────────────────────────────────────────────────────
  const setRoute = useCallback((r: RouteState) => setRouteState(r), []);
  const goto = useCallback((name: RouteState["name"]) => setRouteState({ name } as RouteState), []);
  const openPerson = useCallback((id: string) => setRouteState({ name: "detail", id }), []);

  // ── Auth actions ───────────────────────────────────────────────────────────
  const signIn = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setRouteState({ name: "list" });
  }, []);

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const addPerson = useCallback((payload: Omit<Person, "id" | "meetings">): string => {
    if (!user) return "";
    const id = crypto.randomUUID();
    const today = new Date().toISOString().slice(0, 10);
    const meeting = {
      id: crypto.randomUUID(),
      date: payload.captured || today,
      location: [payload.met, payload.metCity].filter(Boolean).join(" · "),
      notes: payload.notes || "",
    };
    const newPerson: Person = { ...payload, id, meetings: [meeting] };

    // Optimistic update
    setPeople(prev => [newPerson, ...prev]);

    // Persist to Supabase
    const dbRow = personToDb({ ...payload, id }, user.id);
    supabase.from("people").insert({ ...dbRow, id }).then(({ error }) => {
      if (error) console.error("insert person", error);
    });
    supabase.from("meetings").insert({
      id: meeting.id,
      person_id: id,
      user_id: user.id,
      met_on: meeting.date,
      location: meeting.location,
      notes: meeting.notes,
    }).then(({ error }) => { if (error) console.error("insert meeting", error); });

    return id;
  }, [user]);

  const updatePerson = useCallback((id: string, patch: Partial<Person>) => {
    if (!user) return;
    setPeople(prev => prev.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, ...patch };
      updated.enriched = updated.enriched || isComplete(updated);
      return updated;
    }));
    const dbPatch: any = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.role !== undefined) dbPatch.role = patch.role || null;
    if (patch.company !== undefined) dbPatch.company = patch.company && patch.company !== "—" ? patch.company : null;
    if (patch.met !== undefined) dbPatch.met_where = patch.met || null;
    if (patch.metCity !== undefined) dbPatch.city = patch.metCity || null;
    if (patch.notes !== undefined) dbPatch.notes = patch.notes || null;
    if (patch.email !== undefined) dbPatch.email = patch.email || null;
    if (patch.phone !== undefined) dbPatch.phone = patch.phone || null;
    if (patch.web !== undefined) dbPatch.website = patch.web || null;
    if (patch.photo !== undefined) dbPatch.photo_url = patch.photo || null;
    if (patch.linkedin !== undefined) dbPatch.linkedin_url = patch.linkedin || null;
    if (patch.instagram !== undefined) dbPatch.instagram = patch.instagram || null;
    if (patch.twitter !== undefined) dbPatch.twitter = patch.twitter || null;
    if (patch.tags !== undefined) dbPatch.status = TAG_TO_STATUS[patch.tags[0] as Tag] ?? "incomplete";
    if (Object.keys(dbPatch).length) {
      supabase.from("people").update(dbPatch).eq("id", id)
        .then(({ error }) => { if (error) console.error("update person", error); });
    }
  }, [user]);

  const deletePerson = useCallback((id: string) => {
    if (!user) return;
    setPeople(prev => prev.filter(p => p.id !== id));
    setRouteState({ name: "list" });
    supabase.from("people").delete().eq("id", id)
      .then(({ error }) => { if (error) console.error("delete person", error); });
  }, [user]);

  const toggleStatus = useCallback((id: string, newTag: Tag) => {
    if (!user) return;
    setPeople(prev => prev.map(p => {
      if (p.id !== id) return p;
      return { ...p, tags: [newTag], enriched: newTag !== "to-enrich" };
    }));
    supabase.from("people").update({ status: TAG_TO_STATUS[newTag] }).eq("id", id)
      .then(({ error }) => { if (error) console.error("toggle status", error); });
  }, [user]);

  const addMeeting = useCallback((personId: string, m: { date: string; location: string; notes: string }) => {
    if (!user) return;
    const id = crypto.randomUUID();
    const newMeeting = { id, ...m };
    setPeople(prev => prev.map(p => {
      if (p.id !== personId) return p;
      const meetings = [...(p.meetings || []), newMeeting].sort((a, b) => b.date.localeCompare(a.date));
      return { ...p, meetings, captured: meetings[0].date };
    }));
    supabase.from("meetings").insert({
      id,
      person_id: personId,
      user_id: user.id,
      met_on: m.date,
      location: m.location || null,
      notes: m.notes || "",
    }).then(({ error }) => { if (error) console.error("insert meeting", error); });
  }, [user]);

  const deleteMeeting = useCallback((personId: string, meetingId: string) => {
    if (!user) return;
    setPeople(prev => prev.map(p => {
      if (p.id !== personId) return p;
      const meetings = (p.meetings || []).filter(m => m.id !== meetingId);
      if (!meetings.length) return p;
      return { ...p, meetings, captured: meetings[0].date };
    }));
    supabase.from("meetings").delete().eq("id", meetingId)
      .then(({ error }) => { if (error) console.error("delete meeting", error); });
  }, [user]);

  const addFollowup = useCallback((personId: string, text: string) => {
    if (!user) return;
    const id = crypto.randomUUID();
    setPeople(prev => prev.map(p =>
      p.id === personId ? { ...p, followups: [...(p.followups || []), text] } : p
    ));
    // Track ID for later deletion
    followupIds.current[personId] = [...(followupIds.current[personId] || []), id];
    supabase.from("followups").insert({ id, person_id: personId, user_id: user.id, text })
      .then(({ error }) => { if (error) console.error("insert followup", error); });
  }, [user]);

  const removeFollowup = useCallback((personId: string, index: number) => {
    if (!user) return;
    const id = followupIds.current[personId]?.[index];
    setPeople(prev => prev.map(p =>
      p.id === personId ? { ...p, followups: (p.followups || []).filter((_, i) => i !== index) } : p
    ));
    if (followupIds.current[personId]) {
      followupIds.current[personId] = followupIds.current[personId].filter((_, i) => i !== index);
    }
    if (id) {
      supabase.from("followups").update({ done: true }).eq("id", id)
        .then(({ error }) => { if (error) console.error("remove followup", error); });
    }
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
