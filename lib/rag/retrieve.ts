import { prisma } from "@/lib/db";
import { cosineSimilarity, embedQuery } from "./embeddings";

export interface RetrievedChunk {
  sourceType: string;
  sourceId: string;
  section: string;
  content: string;
  score: number;
}

const STOPWORDS = new Set(
  "a an and are as at be but by for from has have he his her i in is it its of on or that the this to was what which who will with would you your".split(
    " ",
  ),
);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s.+#-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/** Keyword scoring fallback when no embedding provider is configured. */
function lexicalScore(queryTokens: string[], content: string): number {
  const docTokens = tokenize(content);
  if (docTokens.length === 0) return 0;
  const docSet = new Set(docTokens);
  let matches = 0;
  for (const qt of queryTokens) {
    if (docSet.has(qt)) matches += 1;
    else if (docTokens.some((dt) => dt.startsWith(qt) || qt.startsWith(dt))) matches += 0.5;
  }
  return queryTokens.length ? matches / queryTokens.length : 0;
}

/**
 * Retrieve the most relevant knowledge chunks for a visitor question.
 * Uses vector similarity when embeddings exist, otherwise keyword overlap.
 */
export async function retrieve(query: string, topK = 6): Promise<RetrievedChunk[]> {
  const docs = await prisma.knowledgeDocument.findMany();
  if (docs.length === 0) return [];

  const queryVector = await embedQuery(query).catch(() => null);
  const queryTokens = tokenize(query);

  const scored: RetrievedChunk[] = docs.map((doc) => {
    let score = 0;
    if (queryVector && doc.embedding) {
      try {
        score = cosineSimilarity(queryVector, JSON.parse(doc.embedding) as number[]);
      } catch {
        score = lexicalScore(queryTokens, doc.content);
      }
    } else {
      score = lexicalScore(queryTokens, doc.content);
    }
    return {
      sourceType: doc.sourceType,
      sourceId: doc.sourceId,
      section: doc.section,
      content: doc.content,
      score,
    };
  });

  return scored
    .filter((c) => c.score > 0.02)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
