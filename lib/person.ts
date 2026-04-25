import { Person, Tag } from "@/lib/types";
import { normalizeCity } from "@/lib/utils";

export interface PersonInput {
  name: string;
  role: string;
  company: string;
  email?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  location: string;
  metCity: string;
  notes: string;
  tag: Tag;
}

export function createPersonPayload(input: PersonInput): Omit<Person, "id" | "meetings"> {
  return {
    name: input.name.trim() || "Unknown",
    role: input.role.trim(),
    company: input.company.trim() || "—",
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    linkedin: input.linkedin?.trim() || null,
    location: input.location.trim(),
    metCity: normalizeCity(input.metCity),
    notes: input.notes.trim(),
    captured: new Date().toISOString().slice(0, 10),
    tags: [input.tag],
    enriched: input.tag !== "to-enrich" && input.tag !== "networking",
    web: null,
    twitter: null,
    instagram: null,
    followups: [],
  };
}

/** Formats a person as a multiline context block for the draft-email Claude prompt. */
export function formatPersonForEmail(person: Person): string {
  const meetingLines = (person.meetings ?? [])
    .map(m => `  - ${m.date}${m.location ? ` at ${m.location}` : ""}${m.notes ? `: ${m.notes}` : ""}`)
    .join("\n");

  return [
    `Name: ${person.name}`,
    person.role                                  ? `Role: ${person.role}`                         : null,
    person.company && person.company !== "—"     ? `Company: ${person.company}`                   : null,
    person.location                              ? `First met at: ${person.location}`              : null,
    person.metCity                               ? `City where we met: ${person.metCity}`          : null,
    person.captured                              ? `Date first met: ${person.captured}`            : null,
    person.notes                                 ? `General notes: ${person.notes}`                : null,
    person.followups?.length
      ? `Open follow-ups: ${person.followups.join("; ")}`                                          : null,
    meetingLines                                 ? `Meeting history:\n${meetingLines}`             : null,
  ].filter(Boolean).join("\n");
}

/** Formats a person as a single-line entry for the search roster Claude prompt. */
export function formatPersonForSearch(person: Person): string {
  const meetingText = (person.meetings ?? [])
    .map(m => `${m.date}${m.location ? ` (${m.location})` : ""}${m.notes ? `: ${m.notes}` : ""}`)
    .join(" | ");

  return [
    `ID: ${person.id}`,
    `Name: ${person.name}`,
    person.role                                  ? `Role: ${person.role}`                         : null,
    person.company && person.company !== "—"     ? `Company: ${person.company}`                   : null,
    person.location                              ? `Met at: ${person.location}`                   : null,
    person.metCity                               ? `City: ${person.metCity}`                      : null,
    person.captured                              ? `Date met: ${person.captured}`                  : null,
    person.notes                                 ? `Notes: ${person.notes}`                       : null,
    person.followups?.length
      ? `Follow-ups: ${person.followups.join("; ")}`                                               : null,
    meetingText                                  ? `Meetings: ${meetingText}`                     : null,
    person.tags?.length                          ? `Tags: ${person.tags.join(", ")}`              : null,
  ].filter(Boolean).join(", ");
}
