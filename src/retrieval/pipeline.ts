import { config } from "../config.js";
import { embedTexts } from "../services/openrouter.js";
import { searchSimilar } from "../services/qdrant.js";
import type { RetrievedChunk } from "../types.js";

export async function runRetrievalPipeline(
  query: string,
  topK: number = config.topK,
): Promise<RetrievedChunk[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new Error("Query cannot be empty");
  }

  const [queryVector] = await embedTexts([trimmed], "search_query");
  if (!queryVector) {
    throw new Error("Failed to embed query");
  }

  return searchSimilar(queryVector, topK);
}
