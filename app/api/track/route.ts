import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit, clientKey } from "@/lib/rateLimit";

export async function POST(req: Request) {
  if (!rateLimit(`track:${clientKey(req)}`, 60, 60 * 1000)) {
    return NextResponse.json({ ok: true }); // silently drop
  }
  const body = (await req.json().catch(() => null)) as { projectId?: string } | null;
  if (!body?.projectId || typeof body.projectId !== "string") {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  const exists = await prisma.project.findUnique({
    where: { id: body.projectId },
    select: { id: true, published: true },
  });
  if (!exists?.published) return NextResponse.json({ ok: true });
  await prisma.projectView.create({ data: { projectId: body.projectId } });
  return NextResponse.json({ ok: true });
}
