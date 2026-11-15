import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { toProject } from "@/lib/types";
import ProjectForm from "@/components/admin/ProjectForm";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await prisma.project.findUnique({ where: { id } });
  if (!row) notFound();
  return <ProjectForm project={toProject(row)} />;
}
