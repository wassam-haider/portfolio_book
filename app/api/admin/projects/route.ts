import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toProject } from "@/lib/types";
import { projectInputSchema } from "@/lib/validation";
import { reindexProject } from "@/lib/rag/indexer";

export async function GET() {
  const rows = await prisma.project.findMany({
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ projects: rows.map(toProject) });
}

export async function POST(req: Request) {
  const parsed = projectInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const d = parsed.data;

  const existing = await prisma.project.findUnique({ where: { slug: d.slug } });
  if (existing) {
    return NextResponse.json({ error: "A project with this slug already exists." }, { status: 409 });
  }

  const row = await prisma.project.create({
    data: {
      title: d.title,
      slug: d.slug,
      category: d.category,
      status: d.status,
      shortDescription: d.shortDescription,
      fullDescription: d.fullDescription,
      problemStatement: d.problemStatement,
      objectives: JSON.stringify(d.objectives),
      features: JSON.stringify(d.features),
      technologies: JSON.stringify(d.technologies),
      architecture: d.architecture,
      challenges: JSON.stringify(d.challenges),
      contribution: d.contribution,
      githubUrl: d.githubUrl || null,
      liveDemoUrl: d.liveDemoUrl || null,
      screenshots: JSON.stringify(d.screenshots),
      demoVideo: d.demoVideo || null,
      documentation: d.documentation,
      published: d.published,
      displayOrder: d.displayOrder,
    },
  });

  // keep S.H.E.A.'s knowledge base in sync
  try {
    await reindexProject(row.id);
  } catch (err) {
    console.error("Re-index after create failed:", err);
  }

  return NextResponse.json({ project: toProject(row) }, { status: 201 });
}
