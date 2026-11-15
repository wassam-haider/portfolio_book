import { prisma } from "@/lib/db";
import { toProject, toProfile } from "@/lib/types";
import { chunksForProject, chunksForProfile, hashContent, type KnowledgeChunk } from "./knowledge";
import { embedTexts, activeProvider } from "./embeddings";
import { OWNER_NAME } from "./persona";

async function setIndexState(data: {
  state: string;
  message?: string;
  docCount?: number;
  embeddingMode?: string;
  lastIndexedAt?: Date;
}) {
  await prisma.indexState.upsert({
    where: { id: "index" },
    create: { id: "index", ...data },
    update: data,
  });
}

/** Replace the knowledge documents for one source with freshly built chunks. */
async function syncChunks(sourceType: string, sourceId: string, chunks: KnowledgeChunk[]) {
  const existing = await prisma.knowledgeDocument.findMany({
    where: { sourceType, sourceId },
  });
  const existingBySection = new Map(existing.map((d) => [d.section, d]));
  const keptSections = new Set<string>();
  const toEmbed: { section: string; content: string; hash: string }[] = [];

  for (const chunk of chunks) {
    keptSections.add(chunk.section);
    const hash = hashContent(chunk.content);
    const current = existingBySection.get(chunk.section);
    if (current && current.contentHash === hash && current.embedding !== null) {
      continue; // unchanged and already embedded
    }
    toEmbed.push({ section: chunk.section, content: chunk.content, hash });
  }

  // Remove outdated sections that no longer exist.
  const stale = existing.filter((d) => !keptSections.has(d.section));
  if (stale.length) {
    await prisma.knowledgeDocument.deleteMany({ where: { id: { in: stale.map((d) => d.id) } } });
  }

  if (toEmbed.length === 0) return 0;

  const vectors = await embedTexts(toEmbed.map((c) => c.content)); // null in lexical mode

  for (let i = 0; i < toEmbed.length; i++) {
    const c = toEmbed[i];
    const embedding = vectors ? JSON.stringify(vectors[i]) : null;
    const current = existingBySection.get(c.section);
    if (current) {
      await prisma.knowledgeDocument.update({
        where: { id: current.id },
        data: { content: c.content, contentHash: c.hash, embedding },
      });
    } else {
      await prisma.knowledgeDocument.create({
        data: { sourceType, sourceId, section: c.section, content: c.content, contentHash: c.hash, embedding },
      });
    }
  }
  return toEmbed.length;
}

/** Re-index a single project (call after create/update). Removes docs if unpublished/deleted. */
export async function reindexProject(projectId: string): Promise<void> {
  const row = await prisma.project.findUnique({ where: { id: projectId } });
  if (!row || !row.published) {
    await prisma.knowledgeDocument.deleteMany({
      where: { sourceType: "project", sourceId: projectId },
    });
    await refreshIndexMeta();
    return;
  }
  await syncChunks("project", projectId, chunksForProject(toProject(row)));
  await refreshIndexMeta();
}

export async function reindexProfile(): Promise<void> {
  const row = await prisma.profile.findUnique({ where: { id: "profile" } });
  if (!row) return;
  await syncChunks("profile", "profile", chunksForProfile(toProfile(row), OWNER_NAME));
  await refreshIndexMeta();
}

/** Full rebuild of the knowledge base (manual re-index). */
export async function reindexAll(): Promise<{ docCount: number }> {
  await setIndexState({ state: "indexing", message: "Rebuilding knowledge base..." });
  try {
    const projects = await prisma.project.findMany({ where: { published: true } });
    const publishedIds = new Set(projects.map((p) => p.id));

    // Drop docs for deleted/unpublished projects.
    const orphaned = await prisma.knowledgeDocument.findMany({
      where: { sourceType: "project" },
      select: { id: true, sourceId: true },
    });
    const orphanIds = orphaned.filter((d) => !publishedIds.has(d.sourceId)).map((d) => d.id);
    if (orphanIds.length) {
      await prisma.knowledgeDocument.deleteMany({ where: { id: { in: orphanIds } } });
    }

    for (const p of projects) {
      await syncChunks("project", p.id, chunksForProject(toProject(p)));
    }
    const profileRow = await prisma.profile.findUnique({ where: { id: "profile" } });
    if (profileRow) {
      await syncChunks("profile", "profile", chunksForProfile(toProfile(profileRow), OWNER_NAME));
    }

    const docCount = await prisma.knowledgeDocument.count();
    await setIndexState({
      state: "idle",
      message: "Knowledge base up to date",
      docCount,
      embeddingMode: activeProvider() === "lexical" ? "lexical" : "semantic",
      lastIndexedAt: new Date(),
    });
    return { docCount };
  } catch (err) {
    await setIndexState({
      state: "error",
      message: err instanceof Error ? err.message : "Indexing failed",
    });
    throw err;
  }
}

async function refreshIndexMeta() {
  const docCount = await prisma.knowledgeDocument.count();
  await setIndexState({
    state: "idle",
    message: "Knowledge base up to date",
    docCount,
    embeddingMode: activeProvider() === "lexical" ? "lexical" : "semantic",
    lastIndexedAt: new Date(),
  });
}
