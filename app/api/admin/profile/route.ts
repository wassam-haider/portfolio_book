import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toProfile } from "@/lib/types";
import { profileInputSchema } from "@/lib/validation";
import { reindexProfile } from "@/lib/rag/indexer";

export async function GET() {
  const row = await prisma.profile.findUnique({ where: { id: "profile" } });
  return NextResponse.json({ profile: row ? toProfile(row) : null });
}

export async function PUT(req: Request) {
  const parsed = profileInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const d = parsed.data;
  const data = {
    introduction: d.introduction,
    education: d.education,
    skills: JSON.stringify(d.skills),
    experience: d.experience,
    achievements: d.achievements,
    interests: d.interests,
    socialLinks: JSON.stringify(d.socialLinks),
    contactInformation: d.contactInformation,
  };

  const row = await prisma.profile.upsert({
    where: { id: "profile" },
    create: { id: "profile", ...data },
    update: data,
  });

  try {
    await reindexProfile();
  } catch (err) {
    console.error("Re-index after profile update failed:", err);
  }

  return NextResponse.json({ profile: toProfile(row) });
}
