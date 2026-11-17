import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { feedbackInputSchema } from "@/lib/validation";
import { rateLimit, clientKey } from "@/lib/rateLimit";

export async function POST(req: Request) {
  if (!rateLimit(`feedback:${clientKey(req)}`, 5, 60 * 1000)) {
    return NextResponse.json({ error: "Too many submissions, try again shortly." }, { status: 429 });
  }

  const parsed = feedbackInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const { experienceAnswer, suggestionAnswer } = parsed.data;
  if (!experienceAnswer && !suggestionAnswer) {
    return NextResponse.json({ error: "Write at least one answer first." }, { status: 400 });
  }

  await prisma.feedbackEntry.create({ data: { experienceAnswer, suggestionAnswer } });
  return NextResponse.json({ ok: true }, { status: 201 });
}
