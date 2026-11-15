import type { Project as DbProject, Profile as DbProfile } from "@/lib/generated/prisma";

export type ProjectStatus = "COMPLETED" | "ONGOING" | "EXPERIMENTAL";

export interface Challenge {
  challenge: string;
  solution: string;
}

export interface SkillGroup {
  group: string;
  items: string[];
}

export interface SocialLink {
  label: string;
  url: string;
}

/** Project with JSON columns parsed into real arrays/objects. */
export interface Project {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: ProjectStatus;
  shortDescription: string;
  fullDescription: string;
  problemStatement: string;
  objectives: string[];
  features: string[];
  technologies: string[];
  architecture: string;
  challenges: Challenge[];
  contribution: string;
  githubUrl: string | null;
  liveDemoUrl: string | null;
  screenshots: string[];
  demoVideo: string | null;
  documentation: string;
  published: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  introduction: string;
  education: string;
  skills: SkillGroup[];
  experience: string;
  achievements: string;
  interests: string;
  socialLinks: SocialLink[];
  contactInformation: string;
  updatedAt: string;
}

function parseJson<T>(raw: string, fallback: T): T {
  try {
    const value = JSON.parse(raw);
    return (value ?? fallback) as T;
  } catch {
    return fallback;
  }
}

export function toProject(row: DbProject): Project {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    category: row.category,
    status: (row.status as ProjectStatus) ?? "COMPLETED",
    shortDescription: row.shortDescription,
    fullDescription: row.fullDescription,
    problemStatement: row.problemStatement,
    objectives: parseJson<string[]>(row.objectives, []),
    features: parseJson<string[]>(row.features, []),
    technologies: parseJson<string[]>(row.technologies, []),
    architecture: row.architecture,
    challenges: parseJson<Challenge[]>(row.challenges, []),
    contribution: row.contribution,
    githubUrl: row.githubUrl,
    liveDemoUrl: row.liveDemoUrl,
    screenshots: parseJson<string[]>(row.screenshots, []),
    demoVideo: row.demoVideo,
    documentation: row.documentation,
    published: row.published,
    displayOrder: row.displayOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toProfile(row: DbProfile): Profile {
  return {
    id: row.id,
    introduction: row.introduction,
    education: row.education,
    skills: parseJson<SkillGroup[]>(row.skills, []),
    experience: row.experience,
    achievements: row.achievements,
    interests: row.interests,
    socialLinks: parseJson<SocialLink[]>(row.socialLinks, []),
    contactInformation: row.contactInformation,
    updatedAt: row.updatedAt.toISOString(),
  };
}
