import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch(`https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}`, {
    headers: {
      Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
    },
  });
  if (!res.ok) return NextResponse.json({ ok: false }, { status: 500 });
  return NextResponse.json({ ok: true });
}
