import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toProject } from "@/lib/types";
import { projectUpdateSchema } from "@/lib/validation";
import { reindexProject } from "@/lib/rag/indexer";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const row = await prisma.project.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ project: toProject(row) });
}

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = projectUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const d = parsed.data;

  if (d.slug && d.slug !== existing.slug) {
    const clash = await prisma.project.findUnique({ where: { slug: d.slug } });
    if (clash) {
      return NextResponse.json(
        { error: "A project with this slug already exists." },
        { status: 409 },
      );
    }
  }

  const row = await prisma.project.update({
    where: { id },
    data: {
      ...(d.title !== undefined && { title: d.title }),
      ...(d.slug !== undefined && { slug: d.slug }),
      ...(d.category !== undefined && { category: d.category }),
      ...(d.status !== undefined && { status: d.status }),
      ...(d.shortDescription !== undefined && { shortDescription: d.shortDescription }),
      ...(d.fullDescription !== undefined && { fullDescription: d.fullDescription }),
      ...(d.problemStatement !== undefined && { problemStatement: d.problemStatement }),
      ...(d.objectives !== undefined && { objectives: JSON.stringify(d.objectives) }),
      ...(d.features !== undefined && { features: JSON.stringify(d.features) }),
      ...(d.technologies !== undefined && { technologies: JSON.stringify(d.technologies) }),
      ...(d.architecture !== undefined && { architecture: d.architecture }),
      ...(d.challenges !== undefined && { challenges: JSON.stringify(d.challenges) }),
      ...(d.contribution !== undefined && { contribution: d.contribution }),
      ...(d.githubUrl !== undefined && { githubUrl: d.githubUrl || null }),
      ...(d.liveDemoUrl !== undefined && { liveDemoUrl: d.liveDemoUrl || null }),
      ...(d.screenshots !== undefined && { screenshots: JSON.stringify(d.screenshots) }),
      ...(d.demoVideo !== undefined && { demoVideo: d.demoVideo || null }),
      ...(d.documentation !== undefined && { documentation: d.documentation }),
      ...(d.published !== undefined && { published: d.published }),
      ...(d.displayOrder !== undefined && { displayOrder: d.displayOrder }),
    },
  });

  try {
    await reindexProject(row.id);
  } catch (err) {
    console.error("Re-index after update failed:", err);
  }

  return NextResponse.json({ project: toProject(row) });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.project.delete({ where: { id } });
  await prisma.knowledgeDocument.deleteMany({ where: { sourceType: "project", sourceId: id } });

  return NextResponse.json({ ok: true });
}
