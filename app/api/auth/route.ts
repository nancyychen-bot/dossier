import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated, makeSessionCookie } from "@/lib/auth";
import { checkRateLimit, resetRateLimit } from "@/lib/rateLimit";

export async function GET() {
  if (isAuthenticated()) return NextResponse.json({ ok: true });
  return NextResponse.json({ ok: false }, { status: 401 });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(ip);

  if (!allowed) {
    const minutes = Math.ceil(retryAfterMs / 60000);
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` },
      { status: 429 }
    );
  }

  const { password } = await req.json();
  if (password?.trim() !== process.env.DOSSIER_PASSWORD?.trim()) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  resetRateLimit(ip); // clear counter on success
  const { name, value } = makeSessionCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(name, value, { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production" });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("dossier_session");
  return res;
}
