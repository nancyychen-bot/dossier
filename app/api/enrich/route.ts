import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";

async function fetchClearbit(email: string) {
  const key = process.env.CLEARBIT_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://person.clearbit.com/v2/people/find?email=${encodeURIComponent(email)}`,
      { headers: { Authorization: `Bearer ${key}` } }
    );
    if (!res.ok) return null;
    const d = await res.json();
    return {
      photo:    d.avatar ?? null,
      role:     d.employment?.title ?? null,
      company:  d.employment?.name ?? null,
      twitter:  d.twitter?.handle ?? null,
      linkedin: d.linkedin?.handle ? `https://linkedin.com/${d.linkedin.handle}` : null,
      web:      d.site ?? null,
    };
  } catch { return null; }
}

async function fetchPDL(params: { email?: string | null; phone?: string | null; linkedin?: string | null }) {
  const key = process.env.PDL_API_KEY;
  if (!key) return null;
  const qs = new URLSearchParams();
  if (params.email)    qs.set("email", params.email);
  if (params.phone)    qs.set("phone", params.phone);
  if (params.linkedin) {
    // PDL expects linkedin.com/in/username — strip protocol and www
    const normalized = params.linkedin.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
    qs.set("profile", normalized);
  }
  if (!qs.toString()) return null;
  try {
    const url = `https://api.peopledatalabs.com/v5/person/enrich?${qs.toString()}`;
    const res = await fetch(url, { headers: { "X-Api-Key": key } });
    const d = await res.json();
    if (!res.ok) return null;
    const person = d.data;
    if (!person) return null;
    return {
      phone:    person.phone_numbers?.[0] ?? null,
      email:    person.emails?.[0]?.address ?? null,
      role:     person.job_title ?? null,
      company:  person.job_company_name ?? null,
      linkedin: person.linkedin_url ?? null,
      twitter:  person.twitter_url ? person.twitter_url.replace("https://twitter.com/", "") : null,
    };
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  if (!isAuthenticated()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const email    = req.nextUrl.searchParams.get("email");
  const phone    = req.nextUrl.searchParams.get("phone");
  const linkedin = req.nextUrl.searchParams.get("linkedin");
  if (!email && !phone && !linkedin) return NextResponse.json({ error: "email, phone, or linkedin required" }, { status: 400 });

  const [clearbit, pdl] = await Promise.all([
    email ? fetchClearbit(email) : null,
    fetchPDL({ email, phone, linkedin }),
  ]);

  // Merge: Clearbit wins for photo/web, PDL wins for phone; fill gaps from each other
  const result = {
    photo:    clearbit?.photo    ?? null,
    role:     clearbit?.role     ?? pdl?.role     ?? null,
    company:  clearbit?.company  ?? pdl?.company  ?? null,
    twitter:  clearbit?.twitter  ?? pdl?.twitter  ?? null,
    linkedin: clearbit?.linkedin ?? pdl?.linkedin ?? null,
    web:      clearbit?.web      ?? null,
    phone:    pdl?.phone         ?? null,
    email:    pdl?.email         ?? null,
  };

  return NextResponse.json(result);
}
