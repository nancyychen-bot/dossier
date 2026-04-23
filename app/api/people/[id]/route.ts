import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { updatePerson, deletePerson } from "@/lib/notion";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!isAuthenticated()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const patch = await req.json();
  await updatePerson(params.id, patch);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!isAuthenticated()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await deletePerson(params.id);
  return NextResponse.json({ ok: true });
}
