export type Tag = "close" | "networking" | "to-enrich";

export interface Meeting {
  id: string;
  date: string;       // ISO "2026-04-12"
  location: string;   // e.g. "Printed Matter Art Book Fair · NYC"
  notes: string;
}

export interface Person {
  id: string;              // "p-013"
  name: string;
  role: string;
  company: string;
  met: string;             // first-meeting location (legacy field)
  metCity: string;         // first-meeting city (legacy field)
  captured: string;        // first-meeting date
  tags: Tag[];
  enriched: boolean;
  photo?: string | null;
  email?: string | null;
  phone?: string | null;
  web?: string | null;
  twitter?: string | null;
  linkedin?: string | null;
  instagram?: string | null;
  notes: string;
  followups: string[];
  meetings: Meeting[];
}

export type RouteState =
  | { name: "list" }
  | { name: "detail"; id: string }
  | { name: "capture" }
  | { name: "enrich" };

export const TAG_META: Record<Tag, { label: string; dot: string }> = {
  close:      { label: "friend",       dot: "●" },
  networking: { label: "acquaintance", dot: "●" },
  "to-enrich": { label: "incomplete",  dot: "○" },
};
