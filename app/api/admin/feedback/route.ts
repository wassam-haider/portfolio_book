import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const rows = await prisma.feedbackEntry.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ entries: rows });
}
