import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { formatPersonForSearch } from "@/lib/person";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { query, people } = await req.json();
  if (!query?.trim() || !Array.isArray(people)) {
    return NextResponse.json({ results: [] });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const roster = people.map(formatPersonForSearch).join("\n---\n");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      messages: [{
        role: "user",
        content: `You are searching a personal contact database. Find everyone who meaningfully matches the query.

Query: "${query.replace(/"/g, '\\"')}"

Contacts:
${roster}

Return a JSON array of matches. Each item: {"id": "...", "reason": "..."} where reason is 4–8 words explaining the match.
Order results by relevance (best match first).
If no one matches, return [].
Return ONLY the JSON array, nothing else.`,
      }],
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ results: [] });
  }

  const data = await res.json();
  const text: string = data.content?.[0]?.text ?? "[]";
  const match = text.match(/\[[\s\S]*\]/);
  if (match) {
    try {
      return NextResponse.json({ results: JSON.parse(match[0]) });
    } catch {
      // fall through
    }
  }
  return NextResponse.json({ results: [] });
}
