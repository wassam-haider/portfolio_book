import { NextResponse } from "next/server";
import { reindexAll } from "@/lib/rag/indexer";
import { prisma } from "@/lib/db";

export const maxDuration = 60;

export async function POST() {
  try {
    const { docCount } = await reindexAll();
    return NextResponse.json({ ok: true, docCount });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Re-indexing failed" },
      { status: 500 },
    );
  }
}

export async function GET() {
  const state = await prisma.indexState.findUnique({ where: { id: "index" } });
  return NextResponse.json({
    state: state?.state ?? "idle",
    message: state?.message ?? "Not indexed yet",
    docCount: state?.docCount ?? 0,
    embeddingMode: state?.embeddingMode ?? "lexical",
    lastIndexedAt: state?.lastIndexedAt ?? null,
  });
}
