/**
 * S.H.E.A.'s LLM provider: OpenRouter (https://openrouter.ai), an
 * OpenAI-compatible chat-completions API that can route to many models.
 * Default model is nvidia/nemotron-3-ultra-550b-a55b:free — OpenRouter's free
 * tier of NVIDIA's Nemotron model.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export function llmConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

interface OpenRouterResponse {
  choices?: { message?: { content?: string | null }; finish_reason?: string }[];
  error?: { message?: string; code?: string | number };
}

/**
 * Generate a grounded S.H.E.A. reply. The system prompt carries the retrieved
 * archive context; history is the running conversation.
 */
export async function generateReply(system: string, history: ChatTurn[]): Promise<string> {
  const model = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-ultra-550b-a55b:free";

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      // Optional but recommended by OpenRouter for attribution/analytics.
      "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
      "X-Title": "The Archives of Wassam Haider",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048, // chat replies are instructed to stay short
      messages: [
        { role: "system", content: system },
        ...history.map((t) => ({ role: t.role, content: t.content })),
      ],
    }),
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new Error(`OpenRouter request failed: ${res.status} ${bodyText}`);
  }

  const data = (await res.json()) as OpenRouterResponse;

  if (data.error) {
    throw new Error(`OpenRouter error: ${data.error.message ?? data.error.code}`);
  }

  const choice = data.choices?.[0];
  if (choice?.finish_reason === "content_filter") {
    return "The archives decline to speak on that matter, traveler. Ask me about the projects or their maker instead.";
  }

  const text = choice?.message?.content?.trim();
  return text || "The pages flutter, but no words appear. Try asking me again.";
}
