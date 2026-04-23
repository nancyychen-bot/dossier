import "server-only";
import { Person, Meeting, Tag } from "./types";
import { isComplete } from "./utils";

const TOKEN = process.env.NOTION_TOKEN!;
const DB_ID = process.env.NOTION_DATABASE_ID!;
const NOTION_VERSION = "2022-06-28";

const baseHeaders = {
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
  "Notion-Version": NOTION_VERSION,
};

const TAG_TO_STATUS: Record<Tag, string> = {
  close: "friend",
  networking: "acquaintance",
  "to-enrich": "acquaintance",
  influential: "influential",
};

const STATUS_TO_TAG: Record<string, Tag> = {
  friend: "close",
  acquaintance: "networking",
  incomplete: "networking",
  influential: "influential",
};

// ─── Rich text helpers ────────────────────────────────────────────────────────

function toRichText(content: string): object[] {
  if (!content) return [];
  const chunks: object[] = [];
  for (let i = 0; i < content.length; i += 1999) {
    chunks.push({ type: "text", text: { content: content.slice(i, i + 1999) } });
  }
  return chunks;
}

function fromRichText(richText: any[]): string {
  return (richText ?? []).map((t: any) => t.plain_text ?? t.text?.content ?? "").join("");
}

// ─── Notion page ↔ Person ────────────────────────────────────────────────────

export function notionPageToPerson(page: any): Person {
  const p = page.properties;
  const status = p.Status?.select?.name ?? "incomplete";
  const tag: Tag = STATUS_TO_TAG[status] ?? "networking";
  const captured = p.Captured?.date?.start ?? page.created_time?.slice(0, 10) ?? "";
  const metWhere = fromRichText(p["Met Where"]?.rich_text ?? []);
  const city = p.Location?.select?.name ?? "";
  const notes = fromRichText(p.Notes?.rich_text ?? []);
  const name = (p.Name?.title ?? []).map((t: any) => t.plain_text).join("");
  const role = fromRichText(p.Role?.rich_text ?? []);
  const email = p.Email?.email ?? null;
  const linkedin = p.LinkedIn?.url ?? null;

  let meetings: Meeting[] = [];
  let followups: string[] = [];
  const meetingsRaw = fromRichText(p.Meetings?.rich_text ?? []);
  const followupsRaw = fromRichText(p.Followups?.rich_text ?? []);
  try { if (meetingsRaw) meetings = JSON.parse(meetingsRaw); } catch {}
  try { if (followupsRaw) followups = JSON.parse(followupsRaw); } catch {}

  if (!meetings.length) {
    meetings = [{
      id: "m-init",
      date: captured,
      location: [metWhere, city].filter(Boolean).join(" · "),
      notes,
    }];
  }

  return {
    id: page.id,
    name,
    role,
    company: fromRichText(p.Company?.rich_text ?? []) || "—",
    met: metWhere,
    metCity: city,
    captured,
    tags: [tag],
    enriched: tag !== "to-enrich" || !!(name && role && email && linkedin),
    photo: null,
    email,
    phone: p.Phone?.phone_number ?? null,
    web: fromRichText(p.Website?.rich_text ?? []) || null,
    twitter: p.Twitter?.url ?? null,
    linkedin,
    instagram: p.Instagram?.url ?? null,
    notes,
    followups,
    meetings,
  };
}

type PersonPatch = Partial<Person> & { meetings?: Meeting[]; followups?: string[] };

function personToNotionProps(patch: PersonPatch): object {
  const props: Record<string, unknown> = {};

  if (patch.name !== undefined)
    props.Name = { title: [{ text: { content: patch.name } }] };
  if (patch.role !== undefined)
    props.Role = { rich_text: toRichText(patch.role || "") };
  if (patch.company !== undefined)
    props.Company = { rich_text: toRichText(patch.company && patch.company !== "—" ? patch.company : "") };
  if (patch.met !== undefined)
    props["Met Where"] = { rich_text: toRichText(patch.met || "") };
  if (patch.metCity !== undefined)
    props.Location = { select: patch.metCity ? { name: patch.metCity } : null };
  if (patch.notes !== undefined)
    props.Notes = { rich_text: toRichText(patch.notes || "") };
  if (patch.email !== undefined)
    props.Email = { email: patch.email || null };
  if (patch.phone !== undefined)
    props.Phone = { phone_number: patch.phone || null };
  if (patch.web !== undefined)
    props.Website = { rich_text: toRichText(patch.web || "") };
  if (patch.linkedin !== undefined)
    props.LinkedIn = { url: patch.linkedin || null };
  if (patch.twitter !== undefined)
    props.Twitter = { url: patch.twitter || null };
  if (patch.instagram !== undefined)
    props.Instagram = { url: patch.instagram || null };
  if (patch.tags !== undefined)
    props.Status = { select: { name: TAG_TO_STATUS[patch.tags[0]] ?? "incomplete" } };
  if (patch.captured !== undefined)
    props.Captured = { date: { start: patch.captured } };
  if (patch.meetings !== undefined)
    props.Meetings = { rich_text: toRichText(JSON.stringify(patch.meetings)) };
  if (patch.followups !== undefined)
    props.Followups = { rich_text: toRichText(JSON.stringify(patch.followups)) };

  return props;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function notionFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    ...options,
    headers: { ...baseHeaders, ...(options.headers ?? {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Notion API error: ${res.status} ${err.message ?? ""}`);
  }
  return res.json();
}

// ─── Public functions ─────────────────────────────────────────────────────────

export async function fetchAllPeople(): Promise<Person[]> {
  const pages: any[] = [];
  let cursor: string | undefined;

  do {
    const body: Record<string, unknown> = {
      sorts: [{ timestamp: "created_time", direction: "descending" }],
      page_size: 100,
    };
    if (cursor) body.start_cursor = cursor;

    const data = await notionFetch(`/databases/${DB_ID}/query`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    pages.push(...data.results);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  return pages.map(notionPageToPerson);
}

export async function createPerson(payload: Omit<Person, "id" | "meetings">): Promise<string> {
  const tag = payload.tags?.[0] ?? "to-enrich";
  const captured = payload.captured || new Date().toISOString().slice(0, 10);
  const props = personToNotionProps({ ...payload, tags: [tag], captured });

  const page = await notionFetch("/pages", {
    method: "POST",
    body: JSON.stringify({ parent: { database_id: DB_ID }, properties: props }),
  });

  return page.id;
}

export async function updatePerson(id: string, patch: PersonPatch): Promise<void> {
  await notionFetch(`/pages/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ properties: personToNotionProps(patch) }),
  });
}

export async function deletePerson(id: string): Promise<void> {
  await notionFetch(`/pages/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ archived: true }),
  });
}
