import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import sharp from "sharp";
import { isAuthenticated } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isAuthenticated()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());

  // Resize: max 800px on longest side, JPEG 80%
  const resized = await sharp(buffer)
    .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();

  const blob = await put(`portraits/${Date.now()}.jpg`, resized, {
    access: "public",
    contentType: "image/jpeg",
  });

  return NextResponse.json({ url: blob.url });
}
