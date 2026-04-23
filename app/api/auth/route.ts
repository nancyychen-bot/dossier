import { NextResponse } from "next/server";
import { isAuthenticated, makeSessionCookie } from "@/lib/auth";

export async function GET() {
  if (isAuthenticated()) return NextResponse.json({ ok: true });
  return NextResponse.json({ ok: false }, { status: 401 });
}

export async function POST(req: Request) {
  let password: string | undefined;
  try {
    const body = await req.json();
    password = body?.password;
  } catch {
    return NextResponse.json({ error: "Bad request body" }, { status: 400 });
  }

  const envPass = process.env.DOSSIER_PASSWORD;
  if (!envPass) {
    return NextResponse.json({ error: "Server misconfigured: no password set" }, { status: 500 });
  }

  if (password?.trim() !== envPass.trim()) {
    return NextResponse.json({
      error: `Invalid password (received ${password?.length ?? 0} chars, expected ${envPass.length} chars)`,
    }, { status: 401 });
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
