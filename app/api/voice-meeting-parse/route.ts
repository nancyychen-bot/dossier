import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { transcript, today } = await req.json();
  if (!transcript?.trim()) {
    return NextResponse.json({}, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      messages: [{
        role: "user",
        content: `Extract meeting details from a voice note. Today is ${today}. Return ONLY valid JSON. Omit keys with no info.

Keys:
- date: ISO date (YYYY-MM-DD). Resolve relative references like "yesterday", "last Tuesday", "two weeks ago" using today's date. Default to today if no date mentioned.
- location: where you met or what the meeting was (e.g. "Coffee at Blue Bottle", "Zoom call", "Dinner at Lilia")
- notes: everything worth remembering — what was discussed, what they said, follow-ups mentioned, anything notable

Examples:
Input: "Had coffee with her yesterday at Bluestone Lane, we talked about her new startup idea and she wants me to intro her to someone at a16z"
Output: {"date":"${new Date(Date.now() - 86400000).toISOString().slice(0,10)}","location":"Bluestone Lane","notes":"Discussed her new startup idea. Wants an intro to someone at a16z."}

Input: "Zoom call last week, caught up on the project timeline, he said they're launching in June"
Output: {"location":"Zoom call","notes":"Caught up on project timeline. Launching in June."}

Now extract:
Input: "${transcript.replace(/"/g, '\\"')}"
Output:`,
      }],
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: `Claude API error ${response.status}` }, { status: 500 });
  }

  const data = await response.json();
  const text: string = data.content?.[0]?.text ?? "{}";
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return NextResponse.json(JSON.parse(match[0]));
    } catch {
      // fall through
    }
  }
  return NextResponse.json({});
}
