import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

// ── Heuristic fallback patterns ───────────────────────────────────────────────

const ROLES = [
  "founder", "co-founder", "cofounder", "ceo", "cto", "coo", "cfo", "cpo",
  "president", "chairman", "partner", "managing partner", "general partner",
  "vp", "vice president", "director", "head of", "managing director", "md",
  "principal", "associate", "analyst", "consultant", "advisor", "investor",
  "engineer", "designer", "developer", "architect", "manager", "lead",
  "entrepreneur", "operator",
];

const CITIES: Record<string, string> = {
  "new york": "New York", "nyc": "New York", "new york city": "New York",
  "los angeles": "Los Angeles", "la": "Los Angeles",
  "san francisco": "San Francisco", "sf": "San Francisco",
  "chicago": "Chicago", "miami": "Miami", "boston": "Boston",
  "seattle": "Seattle", "austin": "Austin", "denver": "Denver",
  "london": "London", "ldn": "London", "paris": "Paris",
  "berlin": "Berlin", "amsterdam": "Amsterdam", "dubai": "Dubai",
  "singapore": "Singapore", "tokyo": "Tokyo", "sydney": "Sydney",
  "toronto": "Toronto", "montreal": "Montreal",
  "washington": "Washington D.C.", "dc": "Washington D.C.",
  "brooklyn": "Brooklyn", "manhattan": "Manhattan",
};

const TAG_SIGNALS: Record<string, string> = {
  "close friend": "close", "good friend": "close", "old friend": "close",
  "best friend": "close", "friend": "close",
  "influential": "influential", "very important": "influential",
  "powerful": "influential", "prominent": "influential", "famous": "influential",
};

function extractName(t: string): string {
  const patterns = [
    /(?:met|meeting)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/,
    /(?:her|his|their)\s+name\s+is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/i,
    /(?:named?|called)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/,
    /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/,
  ];
  for (const p of patterns) {
    const m = t.match(p);
    if (m) return m[1].trim();
  }
  return "";
}

function extractRole(t: string): string {
  const lower = t.toLowerCase();
  const headOf = lower.match(/\b(head\s+of\s+[\w\s]{2,20}|vp\s+of\s+[\w\s]{2,20})/);
  if (headOf) return headOf[1].replace(/\s+/g, " ").trim();
  for (const r of ROLES) {
    const re = new RegExp(`\\b(co[-\\s]?founder|${r})\\b`, "i");
    if (re.test(lower)) return lower.match(re)![1];
  }
  return "";
}

function extractCompany(t: string): string {
  const m = t.match(/(?:at|from|for|with|works?\s+(?:at|for))\s+([A-Z][A-Za-z0-9\s&'.-]{1,40}?)(?:\s+(?:in|at|as|and|,|\.)|$)/);
  if (m) return m[1].trim();
  return "";
}

function extractCity(t: string): string {
  const lower = t.toLowerCase();
  const sorted = Object.keys(CITIES).sort((a, b) => b.length - a.length);
  for (const key of sorted) {
    if (lower.includes(key)) return CITIES[key];
  }
  const m = t.match(/\bin\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
  if (m) return m[1].trim();
  return "";
}

function extractMet(t: string): string {
  const m = t.match(/(?:at|through|via|during)\s+(?:a\s+|the\s+)?([a-zA-Z][a-zA-Z0-9\s&'.-]{2,40}?)(?:\s+in\s+|\s+at\s+|,|\.|\band\b|$)/i);
  if (m) {
    const candidate = m[1].trim();
    if (!Object.values(CITIES).some(c => c.toLowerCase() === candidate.toLowerCase())) {
      return candidate;
    }
  }
  return "";
}

function extractTag(t: string): string {
  const lower = t.toLowerCase();
  for (const [signal, tag] of Object.entries(TAG_SIGNALS)) {
    if (lower.includes(signal)) return tag;
  }
  return "to-enrich";
}

function extractNotes(t: string): string {
  const m = t.match(/(?:remember|note[sd]?[:\-]?|also[,\s]|ps[:\-]?)\s+(.+)/i);
  return m ? m[1].trim() : "";
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { transcript } = await req.json();
  if (!transcript?.trim()) {
    return NextResponse.json({}, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (apiKey) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 512,
          messages: [{
            role: "user",
            content: `Extract contact info from a voice note. Return ONLY valid JSON. Omit keys with no info.

Keys:
- name: full name
- role: full job title including modifiers (e.g. "Marketing Lead", "Senior Engineer", "Head of Product")
- company: their EMPLOYER / organization (e.g. "Notion", "Goldman Sachs") — never the meeting venue
- location: the EVENT, VENUE, or SCENE where YOU met them (e.g. "Toronto music scene", "NFX Summit dinner") — never the company name
- metCity: city WHERE THE MEETING HAPPENED — not where they live, are based, or work
- notes: anything else worth remembering
- tag: "close" | "networking" | "to-enrich" | "influential"

Example 1:
Input: "Met Sarah at the London fintech conference. She's a marketing lead at Stripe and lives in New York."
Output: {"name":"Sarah","role":"Marketing Lead","company":"Stripe","location":"London fintech conference","metCity":"London","tag":"networking"}

Example 2:
Input: "I met Nancy Chen in Toronto, in the Toronto music scene. She is based in New York and works as a marketing lead at Notion."
Output: {"name":"Nancy Chen","role":"Marketing Lead","company":"Notion","location":"Toronto music scene","metCity":"Toronto","tag":"networking"}

Example 3:
Input: "Just had dinner with James, he's the co-founder of a fintech startup called Brex. We met at the YC demo day in San Francisco."
Output: {"name":"James","role":"Co-founder","company":"Brex","location":"YC demo day","metCity":"San Francisco","tag":"influential"}

Now extract:
Input: "${transcript.replace(/"/g, '\\"')}"
Output:`,
          }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text: string = data.content?.[0]?.text ?? "{}";
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          return NextResponse.json(JSON.parse(match[0]));
        }
      }
    } catch {
      // Fall through to heuristic parser
    }
  }

  // Heuristic fallback
  const result: Record<string, string> = {};
  const name = extractName(transcript);
  const role = extractRole(transcript);
  const company = extractCompany(transcript);
  const metCity = extractCity(transcript);
  const location = extractMet(transcript);
  const notes = extractNotes(transcript);
  const tag = extractTag(transcript);

  if (name) result.name = name;
  if (role) result.role = role;
  if (company) result.company = company;
  if (metCity) result.metCity = metCity;
  if (location) result.location = location;
  if (notes) result.notes = notes;
  result.tag = tag;

  return NextResponse.json(result);
}
