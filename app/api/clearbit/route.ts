import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!isAuthenticated()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const apiKey = process.env.CLEARBIT_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "CLEARBIT_API_KEY not set" }, { status: 500 });

  const res = await fetch(
    `https://person.clearbit.com/v2/people/find?email=${encodeURIComponent(email)}`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );

  if (res.status === 404 || res.status === 422) {
    return NextResponse.json({ photo: null });
  }
  if (!res.ok) {
    return NextResponse.json({ error: `Clearbit error ${res.status}` }, { status: res.status });
  }

  const data = await res.json();

  const linkedin = data.linkedin?.handle
    ? `https://linkedin.com/${data.linkedin.handle}`
    : null;

  return NextResponse.json({
    photo:    data.avatar ?? null,
    role:     data.employment?.title ?? null,
    company:  data.employment?.name ?? null,
    twitter:  data.twitter?.handle ?? null,
    linkedin,
    web:      data.site ?? null,
  });
}
