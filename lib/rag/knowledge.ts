import { createHash } from "crypto";
import type { Project, Profile } from "@/lib/types";

export interface KnowledgeChunk {
  sourceType: "project" | "profile";
  sourceId: string;
  section: string;
  content: string;
}

export function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function lines(label: string, items: string[]): string {
  return items.length ? `${label}:\n${items.map((i) => `- ${i}`).join("\n")}` : "";
}

/**
 * Turn a published project into retrievable knowledge chunks.
 * Each chunk is self-contained (repeats the project name) so a retrieved
 * chunk makes sense on its own inside the LLM context.
 */
export function chunksForProject(p: Project): KnowledgeChunk[] {
  const header = `Project: ${p.title} (category: ${p.category}, status: ${p.status.toLowerCase()})`;
  const links = [
    p.githubUrl ? `GitHub repository: ${p.githubUrl}` : "",
    p.liveDemoUrl ? `Live demo: ${p.liveDemoUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const chunks: KnowledgeChunk[] = [];
  const push = (section: string, body: string) => {
    const content = body.trim();
    if (content) chunks.push({ sourceType: "project", sourceId: p.id, section, content });
  };

  push(
    "overview",
    [
      header,
      p.shortDescription,
      p.problemStatement ? `Problem it solves: ${p.problemStatement}` : "",
      lines("Objectives", p.objectives),
      links,
    ]
      .filter(Boolean)
      .join("\n\n"),
  );

  push(
    "description",
    [header, p.fullDescription, lines("Key features", p.features)].filter(Boolean).join("\n\n"),
  );

  push(
    "technical",
    [
      header,
      lines("Technologies and frameworks", p.technologies),
      p.architecture ? `Architecture and implementation:\n${p.architecture}` : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
  );

  if (p.challenges.length || p.contribution) {
    push(
      "challenges",
      [
        header,
        p.challenges.length
          ? `Challenges and solutions:\n${p.challenges
              .map((c) => `- Challenge: ${c.challenge}\n  Solution: ${c.solution}`)
              .join("\n")}`
          : "",
        p.contribution ? `Developer's contribution: ${p.contribution}` : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
    );
  }

  if (p.documentation) {
    push("documentation", [header, p.documentation].join("\n\n"));
  }

  return chunks;
}

export function chunksForProfile(profile: Profile, ownerName: string): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];
  const push = (section: string, body: string) => {
    const content = body.trim();
    if (content) chunks.push({ sourceType: "profile", sourceId: profile.id, section, content });
  };

  push("introduction", `About ${ownerName}:\n${profile.introduction}`);
  push("education", `Education of ${ownerName}:\n${profile.education}`);
  if (profile.skills.length) {
    push(
      "skills",
      `Technical skills of ${ownerName}:\n` +
        profile.skills.map((g) => `${g.group}: ${g.items.join(", ")}`).join("\n"),
    );
  }
  push("experience", `Experience of ${ownerName}:\n${profile.experience}`);
  push("achievements", `Achievements of ${ownerName}:\n${profile.achievements}`);
  push("interests", `Interests and specializations of ${ownerName}:\n${profile.interests}`);
  if (profile.socialLinks.length) {
    push(
      "links",
      `Where to find ${ownerName} online:\n` +
        profile.socialLinks.map((l) => `${l.label}: ${l.url}`).join("\n"),
    );
  }
  return chunks;
}
