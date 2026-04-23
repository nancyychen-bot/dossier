import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { fetchAllPeople, createPerson } from "@/lib/notion";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAuthenticated()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const people = await fetchAllPeople();
  return NextResponse.json(people, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(req: Request) {
  if (!isAuthenticated()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await req.json();
  const id = await createPerson(payload);
  return NextResponse.json({ id });
}
