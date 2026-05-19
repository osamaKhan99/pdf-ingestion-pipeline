import { config } from "../config.js";
import { searchSimilar } from "../services/qdrant.js";
import type { RetrievedChunk } from "../types.js";
import { searchByKeywords } from "./keyword-search.js";
import { mergeRetrievalResults } from "./merge-results.js";

/**
 * Hybrid search: dense vector similarity + BM25 keyword ranking, fused with RRF.
 */
export async function hybridSearch(
  queryText: string,
  queryVector: number[],
  limit: number = config.topK,
): Promise<RetrievedChunk[]> {
  const [vectorResults, keywordResults] = await Promise.all([
    searchSimilar(queryVector, limit),
    searchByKeywords(queryText, limit),
  ]);

  if (keywordResults.length === 0) return vectorResults;
  if (vectorResults.length === 0) return keywordResults;

  return mergeRetrievalResults([vectorResults, keywordResults], limit);
}
