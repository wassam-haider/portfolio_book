import { z } from "zod";

export const challengeSchema = z.object({
  challenge: z.string().max(2000),
  solution: z.string().max(4000),
});

export const projectInputSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers and hyphens"),
  category: z.string().min(1).max(100),
  status: z.enum(["COMPLETED", "ONGOING", "EXPERIMENTAL"]),
  shortDescription: z.string().max(1000).default(""),
  fullDescription: z.string().max(20000).default(""),
  problemStatement: z.string().max(5000).default(""),
  objectives: z.array(z.string().max(1000)).max(20).default([]),
  features: z.array(z.string().max(1000)).max(30).default([]),
  technologies: z.array(z.string().max(100)).max(40).default([]),
  architecture: z.string().max(20000).default(""),
  challenges: z.array(challengeSchema).max(20).default([]),
  contribution: z.string().max(10000).default(""),
  githubUrl: z.union([z.literal(""), z.string().url().max(500)]).optional(),
  liveDemoUrl: z.union([z.literal(""), z.string().url().max(500)]).optional(),
  screenshots: z.array(z.string().max(1000)).max(20).default([]),
  demoVideo: z.union([z.literal(""), z.string().max(1000)]).optional(),
  documentation: z.string().max(50000).default(""),
  published: z.boolean().default(false),
  displayOrder: z.number().int().min(0).max(10000).default(0),
});

export type ProjectInput = z.infer<typeof projectInputSchema>;

/**
 * For partial updates (PUT /api/admin/projects/[id]). Deliberately NOT
 * `projectInputSchema.partial()`: Zod's `.default()` fills in a value for any
 * key missing from the input even after `.partial()`/`.optional()` wraps it,
 * so a request that omits a field (e.g. just `{ displayOrder }` from the
 * reorder buttons) would parse that field as its default ("", [], false, 0)
 * instead of leaving it `undefined` — and the route handler would then write
 * that default over the real value, silently wiping project content. Every
 * field here is plain `.optional()` with no default, so an omitted key stays
 * `undefined` and the handler's `!== undefined` guards correctly skip it.
 */
export const projectUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers and hyphens")
    .optional(),
  category: z.string().min(1).max(100).optional(),
  status: z.enum(["COMPLETED", "ONGOING", "EXPERIMENTAL"]).optional(),
  shortDescription: z.string().max(1000).optional(),
  fullDescription: z.string().max(20000).optional(),
  problemStatement: z.string().max(5000).optional(),
  objectives: z.array(z.string().max(1000)).max(20).optional(),
  features: z.array(z.string().max(1000)).max(30).optional(),
  technologies: z.array(z.string().max(100)).max(40).optional(),
  architecture: z.string().max(20000).optional(),
  challenges: z.array(challengeSchema).max(20).optional(),
  contribution: z.string().max(10000).optional(),
  githubUrl: z.union([z.literal(""), z.string().url().max(500)]).optional(),
  liveDemoUrl: z.union([z.literal(""), z.string().url().max(500)]).optional(),
  screenshots: z.array(z.string().max(1000)).max(20).optional(),
  demoVideo: z.union([z.literal(""), z.string().max(1000)]).optional(),
  documentation: z.string().max(50000).optional(),
  published: z.boolean().optional(),
  displayOrder: z.number().int().min(0).max(10000).optional(),
});

export const profileInputSchema = z.object({
  introduction: z.string().max(10000).default(""),
  education: z.string().max(10000).default(""),
  skills: z
    .array(z.object({ group: z.string().max(100), items: z.array(z.string().max(100)).max(40) }))
    .max(20)
    .default([]),
  experience: z.string().max(20000).default(""),
  achievements: z.string().max(10000).default(""),
  interests: z.string().max(5000).default(""),
  socialLinks: z
    .array(z.object({ label: z.string().max(100), url: z.string().url().max(500) }))
    .max(20)
    .default([]),
  contactInformation: z.string().max(2000).default(""),
});

export type ProfileInput = z.infer<typeof profileInputSchema>;

export const chatInputSchema = z.object({
  sessionId: z.string().min(8).max(100),
  message: z.string().min(1).max(2000),
});

export const feedbackInputSchema = z.object({
  experienceAnswer: z.string().trim().max(2000).default(""),
  suggestionAnswer: z.string().trim().max(2000).default(""),
});
