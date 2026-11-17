/**
 * Seed the archives with the owner profile and placeholder projects.
 * Replace the placeholder content through the admin dashboard (/admin).
 *
 * Run with: npm run db:seed
 */
import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

const projects = [
  {
    title: "ASTRA",
    slug: "astra",
    category: "AI & Security",
    status: "ONGOING",
    shortDescription:
      "An AI-powered threat-intelligence and penetration-testing assistant that explores autonomous agents and MCP-based tool integration for authorized security workflows.",
    fullDescription:
      "ASTRA is an ongoing research project at the intersection of AI agents and offensive-security tooling. It investigates how a language-model agent can orchestrate authorized security tools through the Model Context Protocol (MCP), gather threat intelligence, and assist a human operator during sanctioned penetration-testing engagements.\n\nReplace this placeholder description with the real project details from the admin dashboard.",
    problemStatement:
      "Security assessments involve many repetitive tool-driven steps and large volumes of findings that are hard to correlate by hand.",
    objectives: [
      "Explore AI-agent orchestration of security tooling via MCP",
      "Assist authorized penetration-testing workflows",
      "Correlate and summarize threat-intelligence findings",
    ],
    features: [
      "AI agent with MCP-based tool integration",
      "Threat-intelligence gathering and summarization",
      "Human-in-the-loop operation for authorized engagements",
    ],
    technologies: ["Python", "AI Agents", "MCP", "LLM APIs"],
    architecture:
      "Placeholder: describe ASTRA's real architecture here (agent loop, MCP servers, data stores) from the admin dashboard.",
    challenges: [
      {
        challenge: "Placeholder challenge — replace with a real one.",
        solution: "Placeholder solution — replace with the real approach.",
      },
    ],
    contribution: "Sole developer and researcher.",
    githubUrl: null,
    liveDemoUrl: null,
    published: true,
    displayOrder: 1,
  },
  {
    title: "The Archives",
    slug: "the-archives",
    category: "Full-Stack Web",
    status: "COMPLETED",
    shortDescription:
      "This very portfolio: an interactive ancient book built with Next.js, with a RAG-powered archive keeper named S.H.E.A. guarding its pages.",
    fullDescription:
      "A fantasy-themed portfolio experience. Visitors open an ancient tome on a candle-lit desk; every two-page spread chronicles one project. S.H.E.A., the resident archive keeper, answers questions about the work inside using retrieval-augmented generation over a live knowledge base that updates whenever the archives change.",
    problemStatement:
      "Conventional developer portfolios are forgettable grids of cards; this one aims to be a place visitors remember.",
    objectives: [
      "Build a memorable, book-centred portfolio experience",
      "Keep all content database-driven and editable from an admin dashboard",
      "Ground an AI assistant in real portfolio data with RAG",
    ],
    features: [
      "Openable ancient book with realistic page-flip animations",
      "Dedicated single-page mobile reading mode",
      "Admin dashboard with project CRUD and media uploads",
      "RAG pipeline with automatic knowledge-base re-indexing",
      "S.H.E.A. — an animated mascot and grounded AI guide",
    ],
    technologies: [
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "Framer Motion",
      "PostgreSQL",
      "Prisma",
      "OpenRouter",
      "Vercel",
    ],
    architecture:
      "Next.js App Router application on Vercel. Neon Postgres via Prisma stores projects, profile, conversations and the knowledge base. Admin routes are protected by signed-cookie sessions. A modular RAG pipeline chunks portfolio content, embeds it through a configurable provider, retrieves by cosine similarity, and grounds an LLM's answers via OpenRouter. Media is stored in Vercel Blob.",
    challenges: [
      {
        challenge: "Making a page-flip book feel physical while staying responsive on phones.",
        solution:
          "Two deliberate experiences: a two-page flip book on desktop and a purpose-built single-page swipe reader on mobile, sharing the same data and paper styling.",
      },
      {
        challenge: "Keeping S.H.E.A. honest about what it knows.",
        solution:
          "Strict grounding prompt over retrieved chunks only, with automatic re-indexing whenever projects or the profile change, so the assistant never answers from stale or invented data.",
      },
    ],
    contribution: "Designed and built end to end.",
    githubUrl: null,
    liveDemoUrl: null,
    published: true,
    displayOrder: 2,
  },
  {
    title: "Sample Project — Replace Me",
    slug: "sample-project",
    category: "Backend",
    status: "EXPERIMENTAL",
    shortDescription:
      "A placeholder entry so the book has pages to show. Edit or delete it in the admin dashboard, and add your real projects there.",
    fullDescription:
      "This is seeded placeholder content. Open /admin, sign in, and replace it with a real project: description, screenshots, demo video, GitHub link and all. Published projects automatically appear in the book and in S.H.E.A.'s knowledge base.",
    problemStatement: "An empty book is no fun to open.",
    objectives: ["Show how a project spread looks", "Be deleted once real content exists"],
    features: ["Two-page spread layout", "Technology chips", "Media area"],
    technologies: ["Your", "Stack", "Here"],
    architecture: "",
    challenges: [],
    contribution: "",
    githubUrl: null,
    liveDemoUrl: null,
    published: true,
    displayOrder: 3,
  },
];

async function main() {
  for (const p of projects) {
    const { objectives, features, technologies, challenges, ...rest } = p;
    const data = {
      ...rest,
      objectives: JSON.stringify(objectives),
      features: JSON.stringify(features),
      technologies: JSON.stringify(technologies),
      challenges: JSON.stringify(challenges),
      screenshots: "[]",
    };
    await prisma.project.upsert({
      where: { slug: p.slug },
      create: data,
      update: data,
    });
  }

  await prisma.profile.upsert({
    where: { id: "profile" },
    create: {
      id: "profile",
      introduction:
        "I am Wassam Haider, a software developer who enjoys building things end to end — from backend systems and AI integrations to the interfaces people actually touch. (Placeholder introduction: edit me in the admin dashboard.)",
      education: "Add your education details in the admin dashboard.",
      skills: JSON.stringify([
        { group: "Languages", items: ["TypeScript", "Python"] },
        { group: "Frameworks", items: ["Next.js", "React"] },
        { group: "AI / ML", items: ["RAG", "AI Agents", "MCP"] },
      ]),
      experience: "Add your experience in the admin dashboard.",
      achievements: "",
      interests: "AI agents, security tooling, and immersive web experiences.",
      socialLinks: JSON.stringify([]),
      contactInformation: "",
    },
    update: {},
  });

  console.log("Seeded projects and profile.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
