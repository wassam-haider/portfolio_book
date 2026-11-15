import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { chatInputSchema } from "@/lib/validation";
import { rateLimit, clientKey } from "@/lib/rateLimit";
import { retrieve } from "@/lib/rag/retrieve";
import { buildSystemPrompt } from "@/lib/rag/persona";
import { generateReply, llmConfigured, type ChatTurn } from "@/lib/rag/llm";

export const maxDuration = 60;

const HISTORY_TURNS = 12;
const OPEN_MARKER = /\[\[open:([a-z0-9-]+)\]\]/i;

export async function POST(req: Request) {
  if (!rateLimit(`chat:${clientKey(req)}`, 20, 5 * 60 * 1000)) {
    return NextResponse.json(
      { error: "The keeper needs a moment to rest. Ask again shortly." },
      { status: 429 },
    );
  }

  const parsed = chatInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { sessionId, message } = parsed.data;

  if (!llmConfigured()) {
    return NextResponse.json({
      reply:
        "Alas, traveler — my voice has not yet been bound to the archives. The keeper of this site must set an OPENROUTER_API_KEY before I can answer. Until then, do browse the book itself!",
    });
  }

  // conversation bookkeeping
  const conversation = await prisma.conversation.upsert({
    where: { sessionId },
    create: { sessionId },
    update: {},
  });
  await prisma.message.create({
    data: { conversationId: conversation.id, role: "user", content: message },
  });

  // retrieval
  const chunks = await retrieve(message, 6);
  const context = chunks
    .map((c, i) => `[${i + 1}] (${c.sourceType}/${c.section})\n${c.content}`)
    .join("\n\n---\n\n");

  const publishedProjects = await prisma.project.findMany({
    where: { published: true },
    select: { slug: true, title: true },
    orderBy: { displayOrder: "asc" },
  });
  const projectIndex = publishedProjects.map((p) => `${p.slug} -> ${p.title}`).join("\n");

  // recent history (excluding the message we just stored)
  const recent = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "desc" },
    take: HISTORY_TURNS,
  });
  const history: ChatTurn[] = recent
    .reverse()
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
  // the latest user message is already included via the DB read above
  if (history.length === 0 || history[history.length - 1].content !== message) {
    history.push({ role: "user", content: message });
  }

  try {
    const raw = await generateReply(buildSystemPrompt(context, projectIndex), history);

    // extract optional navigation marker
    let action: { type: "open"; slug: string; title: string } | null = null;
    const match = raw.match(OPEN_MARKER);
    if (match) {
      const slug = match[1].toLowerCase();
      const target = publishedProjects.find((p) => p.slug === slug);
      if (target) action = { type: "open", slug: target.slug, title: target.title };
    }
    const reply = raw.replace(OPEN_MARKER, "").trim();

    await prisma.message.create({
      data: { conversationId: conversation.id, role: "assistant", content: reply },
    });

    return NextResponse.json({ reply, action });
  } catch (err) {
    console.error("S.H.E.A. generation failed:", err);
    return NextResponse.json(
      { error: "The archives are unreachable at this moment. Try again shortly." },
      { status: 502 },
    );
  }
}
