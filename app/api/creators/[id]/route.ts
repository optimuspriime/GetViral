import { NextResponse } from "next/server";
import { REAL_CREATORS } from "@/lib/real-creators";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const creator = REAL_CREATORS.find((c) => c.id === id);
  if (!creator) {
    return NextResponse.json({ error: "Creator not found." }, { status: 404 });
  }
  return NextResponse.json(creator);
}
