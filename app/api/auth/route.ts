import { NextResponse } from "next/server";
import { isAuthenticated, makeSessionCookie } from "@/lib/auth";

export async function GET() {
  if (isAuthenticated()) return NextResponse.json({ ok: true });
  return NextResponse.json({ ok: false }, { status: 401 });
}

export async function POST(req: Request) {
  const { password } = await req.json();
  if (password?.trim() !== process.env.DOSSIER_PASSWORD?.trim()) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  const { name, value } = makeSessionCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(name, value, { httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("dossier_session");
  return res;
}
