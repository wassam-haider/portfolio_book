import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  // Sequential, not Promise.all: PgBouncer-style transaction poolers (Neon's
  // pooled endpoint included) can collide on prepared-statement names when
  // the same request issues truly concurrent queries over one connection.
  const totalProjects = await prisma.project.count();
  const publishedProjects = await prisma.project.count({ where: { published: true } });
  const ongoingProjects = await prisma.project.count({ where: { status: "ONGOING" } });
  const completedProjects = await prisma.project.count({ where: { status: "COMPLETED" } });
  const totalConversations = await prisma.conversation.count();
  const indexState = await prisma.indexState.findUnique({ where: { id: "index" } });
  const topViewsRaw = await prisma.projectView.groupBy({
    by: ["projectId"],
    _count: { projectId: true },
    orderBy: { _count: { projectId: "desc" } },
    take: 5,
  });
  const recentQuestions = await prisma.message.findMany({
    where: { role: "user" },
    orderBy: { createdAt: "desc" },
    take: 25,
    select: { content: true, createdAt: true },
  });

  const topProjects: { title: string; views: number }[] = [];
  for (const v of topViewsRaw) {
    const p = await prisma.project.findUnique({
      where: { id: v.projectId },
      select: { title: true },
    });
    topProjects.push({ title: p?.title ?? "(deleted project)", views: v._count.projectId });
  }

  return NextResponse.json({
    totalProjects,
    publishedProjects,
    ongoingProjects,
    completedProjects,
    totalConversations,
    topProjects,
    recentQuestions: recentQuestions.map((q) => ({
      content: q.content.slice(0, 160),
      at: q.createdAt,
    })),
    knowledgeBase: {
      state: indexState?.state ?? "idle",
      message: indexState?.message ?? "Not indexed yet",
      docCount: indexState?.docCount ?? 0,
      embeddingMode: indexState?.embeddingMode ?? "lexical",
      lastIndexedAt: indexState?.lastIndexedAt ?? null,
    },
  });
}
