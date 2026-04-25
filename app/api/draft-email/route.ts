import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { formatPersonForEmail } from "@/lib/person";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { person } = await req.json();

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const context = formatPersonForEmail(person);

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      messages: [{
        role: "user",
        content: `Draft a warm, personal follow-up email to ${person.name}.

Here's everything known about them:
${context}

Rules:
- Plain text only — no markdown, no asterisks, no bullet points
- Open by referencing how/where you met them naturally ("It was great meeting you at…", "Really enjoyed our conversation at…")
- If there are open follow-up items, weave them in naturally ("I wanted to follow up on the coffee we talked about having…", "Still thinking about your point on…")
- If the notes mention something personal (being sick, a trip, a project, a book), acknowledge it ("Hope you're feeling better!", "How did the conference go?")
- Most recent meeting notes should take priority over older ones
- 3–4 short paragraphs max, concise and genuine
- No subject line, no greeting salutation (start with the body), no sign-off
- First person, conversational — not corporate

Return ONLY the email body text, nothing else.`,
      }],
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: `Claude API error ${res.status}` }, { status: 500 });
  }

  const data = await res.json();
  const email = data.content?.[0]?.text ?? "";
  return NextResponse.json({ email });
}
