/**
 * Pluggable embedding providers.
 *
 * - "voyage"  -> Voyage AI REST API (recommended with Claude)
 * - "openai"  -> OpenAI embeddings REST API
 * - "lexical" -> no embeddings; retrieval falls back to keyword scoring.
 *
 * Swap providers via EMBEDDING_PROVIDER / EMBEDDING_API_KEY / EMBEDDING_MODEL.
 */

export type EmbeddingProvider = "voyage" | "openai" | "lexical";

export function activeProvider(): EmbeddingProvider {
  const p = (process.env.EMBEDDING_PROVIDER ?? "lexical").toLowerCase();
  if (p === "voyage" || p === "openai") {
    return process.env.EMBEDDING_API_KEY ? p : "lexical";
  }
  return "lexical";
}

export function semanticEnabled(): boolean {
  return activeProvider() !== "lexical";
}

async function embedVoyage(texts: string[]): Promise<number[][]> {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.EMBEDDING_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.EMBEDDING_MODEL || "voyage-3.5-lite",
      input: texts,
      input_type: "document",
    }),
  });
  if (!res.ok) throw new Error(`Voyage embeddings failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { data: { embedding: number[] }[] };
  return data.data.map((d) => d.embedding);
}

async function embedOpenAI(texts: string[]): Promise<number[][]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.EMBEDDING_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
      input: texts,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI embeddings failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { data: { embedding: number[] }[] };
  return data.data.map((d) => d.embedding);
}

/** Embed a batch of documents. Returns null when running in lexical mode. */
export async function embedTexts(texts: string[]): Promise<number[][] | null> {
  if (texts.length === 0) return [];
  const provider = activeProvider();
  if (provider === "voyage") return embedVoyage(texts);
  if (provider === "openai") return embedOpenAI(texts);
  return null;
}

export async function embedQuery(text: string): Promise<number[] | null> {
  const provider = activeProvider();
  if (provider === "lexical") return null;
  if (provider === "voyage") {
    const res = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.EMBEDDING_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.EMBEDDING_MODEL || "voyage-3.5-lite",
        input: [text],
        input_type: "query",
      }),
    });
    if (!res.ok) throw new Error(`Voyage embeddings failed: ${res.status}`);
    const data = (await res.json()) as { data: { embedding: number[] }[] };
    return data.data[0].embedding;
  }
  const result = await embedOpenAI([text]);
  return result[0];
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
