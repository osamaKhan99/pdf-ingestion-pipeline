import { config } from "../config.js";
import { rerankDocuments } from "../services/openrouter.js";
import { formatProviderError } from "../services/openrouter-utils.js";
import type { RetrievedChunk } from "../types.js";

/** Drop duplicate chunk IDs and identical text before reranking. */
export function dedupeChunks(chunks: RetrievedChunk[]): RetrievedChunk[] {
  const byId = new Map<string, RetrievedChunk>();
  for (const chunk of chunks) {
    const existing = byId.get(chunk.id);
    if (!existing || chunk.score > existing.score) {
      byId.set(chunk.id, chunk);
    }
  }

  const byText = new Map<string, RetrievedChunk>();
  for (const chunk of byId.values()) {
    const textKey = chunk.text.trim().toLowerCase();
    const existing = byText.get(textKey);
    if (!existing || chunk.score > existing.score) {
      byText.set(textKey, chunk);
    }
  }

  return [...byText.values()];
}

export async function rerankChunks(
  query: string,
  chunks: RetrievedChunk[],
  topN: number,
): Promise<RetrievedChunk[]> {
  const unique = dedupeChunks(chunks);
  if (unique.length === 0) return [];
  if (unique.length === 1 || topN >= unique.length) {
    return unique.slice(0, topN);
  }

  let ranked: Array<{ index: number; relevanceScore: number }>;
  try {
    ranked = await rerankDocuments(
      query,
      unique.map((c) => c.text.slice(0, config.rerankMaxDocChars)),
      topN,
    );
  } catch (error) {
    console.warn(
      `Reranking unavailable (${formatProviderError(error, "rerank")}). Using retrieval scores.`,
    );
    return unique
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);
  }

  return ranked.map(({ index, relevanceScore }) => {
    const chunk = unique[index];
    if (!chunk) {
      throw new Error(`Rerank returned invalid index: ${index}`);
    }
    return { ...chunk, score: relevanceScore };
  });
}
