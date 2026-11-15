import { prisma } from "@/lib/db";
import { toProject, toProfile, type Project, type Profile } from "@/lib/types";
import ArchiveExperience from "@/components/ArchiveExperience";

export const dynamic = "force-dynamic";

export default async function Home() {
  let projects: Project[] = [];
  let profile: Profile | null = null;

  try {
    // Sequential, not Promise.all: PgBouncer-style transaction poolers (Neon's
    // pooled endpoint included) can collide on prepared-statement names when
    // the same request issues truly concurrent queries over one connection.
    const projectRows = await prisma.project.findMany({
      where: { published: true },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    });
    const profileRow = await prisma.profile.findUnique({ where: { id: "profile" } });
    projects = projectRows.map(toProject);
    profile = profileRow ? toProfile(profileRow) : null;
  } catch (err) {
    console.error("Failed to load archives from the database:", err);
  }

  return <ArchiveExperience projects={projects} profile={profile} />;
}
